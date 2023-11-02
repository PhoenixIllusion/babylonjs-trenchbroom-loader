type Float = number;
type Bool = boolean;
type Int = number;
type String = string;

interface Vector3 {
  x: Float, y: Float, z: Float
}
interface Vector4 {
  x: Float, y: Float, z: Float, w: Float
}

export interface FacePoints {
  v0:Vector3;
  v1:Vector3;
  v2:Vector3;
}

export interface StandardUV {
  u:Float;
  v:Float;
}

export interface ValveTextureAxis {
  axis:Vector3;
  offset:Float;
}

export interface ValveUV {
  u:ValveTextureAxis;
  v:ValveTextureAxis;
}

export interface FaceUVExtra {
  rot:Float;
  scaleX:Float;
  scaleY:Float;
}

export interface Face {
  planePoints:FacePoints;
  planeNormal:Vector3;
  planeDist:Float;

  textureIdx:Int;

  isValveUV:Bool;
  uvStandard:StandardUV;
  uvValve:ValveUV;
  uvExtra:FaceUVExtra;
}

export interface Brush {
  faces: Face[];
  center: Vector3;
}

export interface VertexUV {
  u:Float;
  v:Float;
}

export type VertexTangent = Vector4;

export interface FaceVertex {
  vertex:Vector3;
  normal:Vector3;
  uv:VertexUV;
  tangent:VertexTangent;
}

export interface FaceGeometry {
  vertices:Array<FaceVertex>;
  indices:Array<Int>;
}

export type BrushGeometry = Array<FaceGeometry>;

export type EntityGeometry = Array<BrushGeometry>;

export interface TextureData {
  name:String;
  width:Int;
  height:Int;
}

export interface WorldspawnLayer {
  textureIdx:Int;
  buildVisuals:Bool;
}


export type SpawnType_WORLDSPAWN = 0;
export type SpawnType_MERGE_WORLDSPAWN = 1;
export type SpawnType_ENTITY = 2;
export type SpawnType_GROUP = 3;
export type SpawnType = SpawnType_WORLDSPAWN|SpawnType_MERGE_WORLDSPAWN|SpawnType_ENTITY|SpawnType_GROUP

export interface Entity {
  public properties: {h: Record<string,string> };
  public brushes: Brush[];
  public center: Vector3;
  public spawnType: SpawnType;
  constructor();
}

export interface Surface {
  vertices:Array<FaceVertex>;
  indices:Array<Int>;
}

export interface MapData {
  public entities:Array<Entity>;
  public entitiesGeo:Array<EntityGeometry>;
  public textures:Array<TextureData>;
  public worldspawnLayers:Array<WorldspawnLayer>;

  registerWorldspawnLayer(name:String, buildVisuals:Bool);
  findWorldspawnLayer(textureIdx:Int);
  setTextureSize(name:String, width:Int, height:Int);
  setSpawnTypeByClassname(key:String, spawnType:Entity.SpawnType);
  registerTexture(name:String);
  findTexture(textureName:String);
}

export class GeoGenerator {
  constructor(mapData: MapData);
  run();
}
export class MapParser {
  constructor(input: JsHxInput);
  parse(): MapData;
}


export type SplitType_NONE = 0;
export type SplitType_ENTITY = 1;
export type SplitType_BRUSH = 2;
export type SplitType = SplitType_NONE|SplitType_ENTITY|SplitType_BRUSH


export class SurfaceGatherer {
  public splitType: SplitType;
  public filterWorldspawnLayers:boolean;
  public outSurfaces:Array<Surface>;
  constructor(mapData: MapData);
  setBrushFilterTexture(name:String);
  setFaceFilterTexture(name:String);
  setTextureFilter(name:String);
  run(): void;
}

export class Input {
  constructor(uint8: Uint8Array);
}
