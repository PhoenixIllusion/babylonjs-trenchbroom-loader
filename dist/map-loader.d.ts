import { Entity, EntityGeometry, TextureData } from "./hxlibmap";
interface NamedArray<T> {
    name: string;
    items: T[];
}
export declare const isLinkedGroup: (entity: Entity) => boolean;
export declare const isClassEntity: (entity: Entity) => boolean;
export declare class MapData {
    player: {
        position: {
            x: number;
            y: number;
            z: number;
        };
        lookat: {
            x: number;
            y: number;
            z: number;
        };
    };
    entities: Entity[];
    geometry: Map<Entity, EntityGeometry>;
    id: Record<number, Entity>;
    layers: Record<number, NamedArray<Entity>>;
    groups: Record<number, NamedArray<Entity>>;
    linked_groups: Record<string, NamedArray<Entity>>;
    classes: Record<string, NamedArray<Entity>>;
    textures: Array<TextureData>;
    constructor();
    parseEntity(entity: Entity, geometry: EntityGeometry, props: Record<string, string>): void;
}
export interface TextureSizeResolver {
    forTexture(name: string): {
        width: number;
        height: number;
    };
}
export declare class MapLoader {
    parseMap(url: string, textureSizeResolver: TextureSizeResolver): Promise<MapData>;
}
export {};
