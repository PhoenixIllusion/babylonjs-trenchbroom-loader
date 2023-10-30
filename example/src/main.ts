import { Engine, Scene, Vector3, FlyCamera, DirectionalLight, Mesh, Color3, StandardMaterial, Texture, Material, HemisphericLight, PointLight, InstancedMesh, SceneLoader, AbstractMesh, Matrix } from '@babylonjs/core';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/loaders/glTF/2.0/glTFLoader';
import "@babylonjs/core/Meshes/thinInstanceMesh";
import './style.css'
import { MapLoader } from 'babylonjs-trenchbroom-loader/map-loader';
import { MapSceneBuilder, MaterialResolver, MeshResolver } from 'babylonjs-trenchbroom-loader/mesh-builder';
import { Entity, EntityGeometry } from 'babylonjs-trenchbroom-loader/hxlibmap';


class TestMaterialResolver implements MaterialResolver {
    private _materials: Record<string,Material> = {};
    async forTextureName(name: string): Promise<Material>  {
      const texture = name.replace('general/','');
      if(this._materials[texture]) {
        return this._materials[texture];
      }
      const material = new StandardMaterial(texture);
      this._materials[texture] = material;
      if(texture.match(/Color_/)) {
        material.diffuseColor = Color3.FromHexString('#'+texture.replace('Color_',''));
        return material;
      }
      material.diffuseTexture = new Texture('textures/'+texture+".jpg");
      material.bumpTexture = new Texture('textures/'+texture+"_NormalGL.jpg");
      material.bumpTexture.level = .2;
      material.ambientColor = new Color3(0.3,0.3,0.3);
      return material;
    }
}

class TestMeshResolver implements MeshResolver {
    private _meshCache : Record<string, Mesh>= {};
    private _meshCacheIdx : Record<string, number>= {};
    async forClassName(modelName: string): Promise<AbstractMesh|undefined> {
        if(!modelName.startsWith('model_')) {
            return undefined;
        }
        modelName = modelName.replace('model_','');
        if(this._meshCache[modelName]) {
        const mesh = this._meshCache[modelName];
        return mesh.createInstance(modelName+'-'+(this._meshCacheIdx[modelName]++));
        }
        const model = await SceneLoader.LoadAssetContainerAsync("models/", modelName+".glb");
        const mesh =  (model.meshes as Mesh[]).find(mesh => mesh.geometry != null) ;
        if(mesh != null) {
        this._meshCache[modelName] = mesh;
        mesh.isVisible = false;
        this._meshCacheIdx[modelName] = 0;
        return mesh.createInstance(modelName+'-'+(this._meshCacheIdx[modelName]++));
        }
        return undefined;
    }
    async instanceLinkedGroup(matrix: Matrix[], meshes: Mesh[]): Promise<AbstractMesh[]> {
        const bufferMatrices = new Float32Array(16 * matrix.length);
        matrix.forEach((m,i) => {
            m.copyToArray(bufferMatrices, i*16);
        });
         if(meshes) {
          meshes.forEach(mesh => {
            mesh.thinInstanceSetBuffer("matrix", bufferMatrices, 16);
            mesh.thinInstanceCount = matrix.length;
          })
        }
        return meshes;
    }
    shouldRenderEntity(_entity: Entity, _geometry: EntityGeometry): boolean {
        return true;
    }
    onEntityProduced(_entity: Entity, _meshes: Mesh[]): void {
        /* do nothing */
    }
}


export class App {
  private canvas: HTMLCanvasElement;
  constructor() {
      // create the canvas html element and attach it to the webpage
      const canvas = this.canvas = document.createElement('canvas');
      canvas.id = 'gameCanvas';
      document.getElementById('app')!.appendChild(canvas);
      this.init();
  }
  
  async init() {

      // initialize babylon scene and engine
      var engine = new Engine(this.canvas, true, undefined, true);
      var scene = new Scene(engine);
      scene.ambientColor = new Color3(0.4,0.4,0.4)

      const camera = new FlyCamera('camera1', new Vector3(0, 35, 100), scene);
      // This targets the camera to scene origin
      camera.setTarget(new Vector3(0,0,1000));

      // This attaches the camera to the canvas
      camera.attachControl(true);

      // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
      const light = new DirectionalLight('light', new Vector3(1, 1, -10), scene);
 
      const hemi = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);
      hemi.intensity = 0.8;
      hemi.specular = Color3.Black();
      // Default intensity is 1. Let's dim the light a small amount
      light.intensity = .5;
      light.specular = new Color3(0.1,0.1,0.1);

      const mapLoader = new MapLoader();
      const map = await mapLoader.parseMap('level1.map', {forTexture: (s) => ({ width: 512, height: 512} )});
      const spawn = map.player.position;
      camera.position = new Vector3(spawn.x, spawn.y, spawn.z);

      const mapBuilder = new MapSceneBuilder(scene, new TestMaterialResolver(), new TestMeshResolver());
      mapBuilder.build(map);

      // hide/show the Inspector
      window.addEventListener('keydown', (ev) => {
          // Shift+Ctrl+Alt+I
          if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
              if (scene.debugLayer.isVisible()) {
                  scene.debugLayer.hide();
              } else {
                  scene.debugLayer.show();
              }
          }
      });

      // run the main render loop
      engine.runRenderLoop(() => {
          scene.render();
      });
  }
}
new App();
