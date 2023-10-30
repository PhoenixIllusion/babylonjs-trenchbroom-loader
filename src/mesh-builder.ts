import type { Material } from "@babylonjs/core/Materials/material";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MapData, isClassEntity, isLinkedGroup } from "./map-loader";
import type { BrushGeometry, Entity, EntityGeometry, FaceGeometry } from "./hxlibmap";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Mesh } from "@babylonjs/core/Meshes";
import { Matrix,Vector3 } from "@babylonjs/core/Maths";
import { Scene } from '@babylonjs/core/scene';

export interface MeshResolver {
  forName(name: string): Promise<AbstractMesh|undefined>;
  instanceLinkedGroup(entities: Matrix[], geometry: Mesh[]): Promise<AbstractMesh[]>;
} 
export interface MaterialResolver {
  forName(name: string): Promise<Material|undefined>;
}

export class MapSceneBuilder {

  constructor(private scene: Scene, private materialResolver: MaterialResolver, private meshResolver: MeshResolver) {

  }

  private _preCorrect = Matrix.FromValues(
    0, 1, 0, 0,
    0, 0, 1, 0,
    1, 0, 0, 0,
    0, 0, 0, 1
  );
  private _postCorrect = Matrix.FromValues(
        0, 0, 1, 0,
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 0, 1
  );
  private _postFlip = Matrix.Scaling(-1,1,1);
  private _tmpMatrix1 = new Matrix();
  private _tmpMatrix2 = new Matrix();
  private fixInstanceMatrix( matrix0: Matrix, instanceMatrix: Matrix): void {
    const m1 = this._tmpMatrix1;
    const m2 = this._tmpMatrix2;
    const inv = matrix0.invertToRef(m2);
    let res = this._preCorrect.multiplyToRef(inv, m1);
    res = res.multiplyToRef(instanceMatrix, m2);
    res = res.multiplyToRef(this._postCorrect, m1);
    res = res.multiplyToRef(this._postFlip, instanceMatrix);
  }

  private async meshFromData(name: string, geo: BrushGeometry, flip: boolean): Promise<Mesh> {
    const positions: number[] = [];
    const normals: number[] = [];
    const index: number[] = [];
    const uv: number[] = [];
    let i = 0;
    let pos: Vector3 = new Vector3();
    geo.forEach((face) => {
      face.vertices.forEach( vt => {
        {
          const { x, y, z} = vt.vertex;
          pos.set(x,y,z);
          positions.push(flip? -y: y,z,x);
        }
        {
          const { x, y, z} = vt.normal;
          normals.push(flip? -y: y,z,x);
        }
        {
          const { u, v } = vt.uv;
          uv.push(u,v);
        }
      });
      index.push(... face.indices.map(x => x + i));
      i += face.vertices.length;
    })
    const mesh = new Mesh(name, this.scene);
  
    if(!mesh.thinInstanceAdd || !mesh.addInstance) {
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

  private createMaterialMeshes(name: string, entity: Entity, geometry: EntityGeometry|undefined, mapData: MapData, flip: boolean) {
    const res: Promise<Mesh>[] = [];
    if(geometry) {
      const meshParts: Record<number, FaceGeometry[]> = {};
      entity.brushes.forEach((brush,i) => {
        brush.faces.forEach((f,j) => {
          meshParts[f.textureIdx] = (meshParts[f.textureIdx]||[]);
          meshParts[f.textureIdx].push(geometry[i][j])
        })
      });
      Object.entries(meshParts).forEach(([texId, brushGeo])=> {
        res.push(this.meshFromData(name, brushGeo, flip).then(mesh => {
          return this.materialResolver.forName(mapData.textures[parseInt(texId, 10)].name).then(material => {
            if(material) {
              mesh.material = material;
            }
            return mesh;
          })
        }));
      })
    }
    return Promise.all(res);
  }

  async build(mapData: MapData) {
    
    for(let i=0;i<mapData.entities.length;i++) {
      const entity = mapData.entities[i];
      if(!isLinkedGroup(entity)) {
        if(entity.brushes) {
          const geometry = mapData.geometry.get(entity);
          this.createMaterialMeshes('block', entity, geometry, mapData, true);
        }
      }
      if(isClassEntity(entity)) {
        const model = await this.meshResolver.forName(entity.properties.h.classname);
        if(model) {
          const props = entity.properties.h;
          const origin = props?.origin?.split(/\s+/).map(x => parseFloat(x));
          model.position.set(-origin[1],origin[2],origin[0]);
        }
      }
    }
    Object.entries(mapData.linked_groups).forEach(([guid, entities]) => {
      const parity: Record<number, {entity: Entity, geo: EntityGeometry, m0: Matrix, matrix: Matrix[]}> = {}; 
      const scales = new Vector3();
      entities.items.forEach(entity => {
        const props = entity.properties.h;
        const m = props._tb_transformation.split(/\s+/).map(x => parseFloat(x));
        const matrix = Matrix.FromArray(m, 0).transpose();
        matrix.decompose(scales);
        let negParity = 0;
        (['x','y','z'] as ('x'|'y'|'z')[]).forEach( k =>
          negParity += scales[k] < 0 ? 0 : 1
        )
        const matrices = parity[negParity] = parity[negParity]
              || {entity: entity, m0: matrix.clone(), geo: mapData.geometry.get(entity), matrix:[]};
        matrices.matrix.push(matrix);
        this.fixInstanceMatrix(matrices.m0, matrix);
      });
      Object.values(parity).forEach(async (geo,i) => {
        const meshes = this.createMaterialMeshes(guid+' '+i, geo.entity, geo.geo, mapData, false);
        this.meshResolver.instanceLinkedGroup(geo.matrix, await meshes);
      })
    })
  }

}