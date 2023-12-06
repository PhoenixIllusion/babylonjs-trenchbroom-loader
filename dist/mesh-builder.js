import { isClassEntity, isLinkedGroup } from "./map-loader";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import '@babylonjs/core/Meshes/thinInstanceMesh';
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
export class MapSceneBuilder {
    constructor(scene, materialResolver, meshResolver) {
        this.scene = scene;
        this.materialResolver = materialResolver;
        this.meshResolver = meshResolver;
        this._preCorrect = Matrix.FromValues(0, -1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1);
        this._postCorrect = Matrix.FromValues(0, 0, 1, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);
        this._tmpMatrix1 = new Matrix();
        this._tmpMatrix2 = new Matrix();
    }
    fixInstanceMatrix(matrix0, instanceMatrix) {
        const m1 = this._tmpMatrix1;
        const m2 = this._tmpMatrix2;
        const inv = matrix0.invertToRef(m2);
        let res = this._preCorrect.multiplyToRef(inv, m1);
        res = res.multiplyToRef(instanceMatrix, m2);
        res = res.multiplyToRef(this._postCorrect, instanceMatrix);
    }
    async meshFromData(name, geo) {
        const positions = [];
        const normals = [];
        const index = [];
        const uv = [];
        let i = 0;
        let pos = new Vector3();
        geo.forEach((face) => {
            face.vertices.forEach(vt => {
                {
                    const { x, y, z } = vt.vertex;
                    pos.set(x, y, z);
                    positions.push(-y, z, x);
                }
                {
                    const { x, y, z } = vt.normal;
                    normals.push(-y, z, x);
                }
                {
                    const { u, v } = vt.uv;
                    uv.push(u, v);
                }
            });
            index.push(...face.indices.map(x => x + i));
            i += face.vertices.length;
        });
        const mesh = new Mesh(name, this.scene);
        if (!mesh.thinInstanceAdd || !mesh.addInstance) {
            console.warn('Mesh methods not available');
        }
        const vertexData = new VertexData();
        vertexData.positions = positions;
        vertexData.normals = normals;
        vertexData.indices = index;
        vertexData.uvs = uv;
        vertexData.applyToMesh(mesh);
        return mesh;
    }
    createMaterialMeshes(name, entity, geometry, mapData) {
        const res = [];
        if (geometry) {
            const meshParts = {};
            entity.brushes.forEach((brush, i) => {
                brush.faces.forEach((f, j) => {
                    meshParts[f.textureIdx] = (meshParts[f.textureIdx] || []);
                    meshParts[f.textureIdx].push(geometry[i][j]);
                });
            });
            Object.entries(meshParts).forEach(([texId, brushGeo]) => {
                res.push(this.meshFromData(name, brushGeo).then(mesh => {
                    return this.materialResolver.forTextureName(mapData.textures[parseInt(texId, 10)].name).then(material => {
                        if (material) {
                            mesh.material = material;
                        }
                        return mesh;
                    });
                }));
            });
        }
        return Promise.all(res);
    }
    async build(mapData) {
        for (let i = 0; i < mapData.entities.length; i++) {
            const entity = mapData.entities[i];
            const geometry = mapData.geometry.get(entity);
            if (!isLinkedGroup(entity) && geometry && geometry.length > 0) {
                if (entity.brushes && this.meshResolver.shouldRenderEntity(entity, geometry)) {
                    const geometry = mapData.geometry.get(entity);
                    const meshes = await this.createMaterialMeshes('block', entity, geometry, mapData);
                    this.meshResolver.onEntityProduced(entity, meshes);
                }
            }
            if (isClassEntity(entity)) {
                const model = await this.meshResolver.forClassName(entity.properties.h.classname);
                if (model) {
                    const props = entity.properties.h;
                    const origin = props?.origin?.split(/\s+/).map(x => parseFloat(x));
                    model.position.set(-origin[1], origin[2], origin[0]);
                }
            }
        }
        const _matrixScales = new Vector3();
        Object.entries(mapData.linked_groups).forEach(([guid, entities]) => {
            const parity = {};
            entities.items.forEach(entity => {
                // potentially linked objects may all be Classes (ex, cloned OBJ Models)
                if (entity.brushes && entity.brushes.length > 0) {
                    const props = entity.properties.h;
                    const m = props._tb_transformation.split(/\s+/).map(x => parseFloat(x));
                    const matrix = Matrix.FromArray(m, 0).transpose();
                    matrix.decompose(_matrixScales);
                    let negParity = 0;
                    ['x', 'y', 'z'].forEach(k => negParity += _matrixScales[k] < 0 ? 0 : 1);
                    const matrices = parity[negParity] = parity[negParity]
                        || { entity: entity, m0: matrix.clone(), geo: mapData.geometry.get(entity), matrix: [] };
                    matrices.matrix.push(matrix);
                    this.fixInstanceMatrix(matrices.m0, matrix);
                }
            });
            //this may resolve to nothing, but will not create any empty instances
            Object.values(parity).forEach(async (geo, i) => {
                const meshes = this.createMaterialMeshes(guid + ' ' + i, geo.entity, geo.geo, mapData);
                this.meshResolver.instanceLinkedGroup(geo.matrix, await meshes);
            });
        });
    }
}
