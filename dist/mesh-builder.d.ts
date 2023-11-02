import type { Material } from "@babylonjs/core/Materials/material";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MapData } from "./map-loader";
import type { Entity, EntityGeometry } from "./hxlibmap";
import { Mesh } from "@babylonjs/core/Meshes";
import { Matrix } from "@babylonjs/core/Maths";
import { Scene } from '@babylonjs/core/scene';
export interface MeshResolver {
    forClassName(name: string): Promise<AbstractMesh | undefined>;
    instanceLinkedGroup(entities: Matrix[], geometry: Mesh[]): Promise<AbstractMesh[]>;
    shouldRenderEntity(entity: Entity, geometry: EntityGeometry): boolean;
    onEntityProduced(entity: Entity, meshes: Mesh[]): void;
}
export interface MaterialResolver {
    forTextureName(name: string): Promise<Material | undefined>;
}
export declare class MapSceneBuilder {
    private scene;
    private materialResolver;
    private meshResolver;
    constructor(scene: Scene, materialResolver: MaterialResolver, meshResolver: MeshResolver);
    private _preCorrect;
    private _postCorrect;
    private _tmpMatrix1;
    private _tmpMatrix2;
    private fixInstanceMatrix;
    private meshFromData;
    private createMaterialMeshes;
    build(mapData: MapData): Promise<void>;
}
