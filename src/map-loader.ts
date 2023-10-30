import { Entity, EntityGeometry, GeoGenerator, Input, MapParser, TextureData } from "./hxlibmap";

interface NamedArray<T> {
  name: string;
  items: T[];
}

export const isLinkedGroup = (entity: Entity): boolean => {
  const props = entity.properties.h;
  return props._tb_linked_group_id !== undefined;
}
export const isClassEntity = (entity: Entity): boolean => {
  const props = entity.properties.h;
  const className = props.classname;
  return (className != undefined && className != 'func_group' && className != 'worldspawn')
}

export class MapData {
  player: {
    position: {x: number, y: number, z: number};
    lookat: {x: number, y: number, z: number};
  };
  entities: Entity[] = [];
  geometry: Map<Entity, EntityGeometry> = new Map();
  id: Record<number, Entity> = {};
  layers: Record<number, NamedArray<Entity>> = {};
  groups: Record<number, NamedArray<Entity>> = {};
  linked_groups: Record<string, NamedArray<Entity>> = {};
  classes: Record<string, NamedArray<Entity>> = {};
  textures: Array<TextureData> = [];

  constructor() {
    this.player = { position: {x: 0, y: 0, z: 0}, lookat: {x: 0, y: 0, z: 0} }
  }
  parseEntity( entity: Entity, geometry: EntityGeometry, props: Record<string,string>) {
    this.entities.push(entity);
    this.geometry.set(entity, geometry);
    const id = props._tb_id;
    if(id) {
      this.id[parseInt(id,10)] = entity
    }
    const groupId = parseInt(props._tb_group || '-1', 10);
    this.groups[groupId] = (this.groups[groupId] || { name: '', items: []});
    this.groups[groupId].items.push(entity);

    const layerId = parseInt(props._tb_layer || '-1', 10);
    this.layers[layerId] = (this.layers[layerId] || { name: '', items: []});
    this.layers[layerId].items.push(entity);

    const guid = props._tb_linked_group_id;
    if(guid) {
      if(!this.linked_groups[guid]) {
        this.linked_groups[guid] = { name: '', items: []};
      }
      this.linked_groups[guid].items.push(entity);
    }
    const className = props.classname;
    if(className == 'func_group') {
      const groupId = parseInt(id,10);
      this.groups[groupId] = (this.groups[groupId] || { name: '', items: []});
      this.groups[groupId].name = props._tb_name;
      this.groups[groupId].items.push(entity);
    }
    if(props._tb_type == '_tb_layer') {
      const layerId = parseInt(id,10);
      this.layers[layerId] = (this.layers[layerId] || { name: '', items: []});
      this.layers[layerId].name = props._tb_name;
      this.layers[layerId].items.push(entity);
    }
    if(className && className != 'func_group' && className != 'worldspawn') {
      this.classes[className] = (this.classes[className] || { name: '', items: []});
      this.classes[className].items.push(entity); 
    }
  }
}

export interface TextureSizeResolver {
  forTexture(name: string): { width: number, height: number};
}

export class MapLoader {

  async parseMap(url: string, textureSizeResolver: TextureSizeResolver): Promise<MapData> {
    const uint8 = await fetch(url).then(res => res.arrayBuffer()).then(buffer => new Uint8Array(buffer));
    const data = new MapParser(new Input(uint8)).parse();
    data.textures.forEach(tex => {
      const size = textureSizeResolver.forTexture(tex.name);
      data.setTextureSize(tex.name, size.width, size.height );
    })
    
    new GeoGenerator(data).run();

    const res: MapData = new MapData();

    data.entities.forEach((entity, i) => {
      const props = entity.properties?.h;
      const origin = props?.origin?.split(/\s+/).map(x => parseFloat(x));
      if(props?.classname == 'info_player_start' && origin) {
        res.player.position = {x: -origin[1], y: origin[2], z: origin[0] };
      }
      res.parseEntity(entity, data.entitiesGeo[i], props);
    });
    res.textures = data.textures;

    return res;
  }
}