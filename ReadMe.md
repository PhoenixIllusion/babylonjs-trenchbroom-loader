## Babylon JS TrenchBroom Map Loader

This NodeJS package allows for the parsing and reading of TrenchBroom MAP text files, and for rendering of the related data inside BabylonJS.

This project is not affiliated with TrenchBroom, BabylonJS, or any linked libraries used in this package.


#### Core Tools and Libraries
Map: TrenchBroom - https://github.com/TrenchBroom/TrenchBroom
Babylon JS - https://babylonjs.com , https://github.com/BabylonJS/Babylon.js

MAP-parsing: hxlibmap - 1.0.1 - MIT License - https://github.com/RollinBarrel/hxlibmap
Compiled using Haxe 4.3.2 - https://haxe.org/

hxlibmap Types.d file written based off original source code.

####  Description:  
The MapLoader executes the hxlibmap.MapParser process to parse the MAP text file, then run it through the hxlibmap.GeoGenerate class to produce triangle-meshes with indexed geometry.

The SurfaceGatherer of this library is exposed, but not used. Analysis of the MAP data is used to gather various existing TrenchBroom meta-data: IDs, groups, layers, linked-groups. The MapLoader class does not perform any matrix manipulation for the Linked-Group objects at this time to avoid importing BabylonJS specific classes into this file, should other 3D libraries wish to use this importer as a stopping point.

The MapBuilder class is minimal at this point. Currently this class will render all non-linked-group Brushes, splitting each brush into one-mesh-per-texture-per-brush. All class entities will be passed to a resolver interface used in the MapBuilder constructor, so that the importer can decide if it is a mesh or other logical entity. Once all brushes and entities are constructed, the linked-group structure will pass the very first instance of linked group, along with an array of adjusted matrices to the Mesh resolver. The mesh resolver can then decide how to instance the groups (thin instance, regular instance, split-instancing based on spacial grouping).


#### Geometry Handling
The MapBuilder currently performs rotation to BabylonJS default orientation and handedness. This involves mapping produced brush geometry from (x, y, z) to (-y, z, x).


#### Linked Groups
Linked Groups (treated as instances) do not have a 'primary' mesh or a requirement that any group exists at "origin". Should the original linked group be moved after creation, all copies of the group will still treat their TB Transformation matrix relative to that original location (that even if no group has any origin at 0,0,0).

Babylon FromArray loads in column-major order, so loaded arrays are transposed on-load.

Due to Mesh instancing with an axis 'mirror/flip' causing faces to invert and back-face, such as an X-axis-mirror, a check is performed on the scaling matrix of the Transformation. Odd number flips will render as a unique model variant using Map's geometry with corrected back-faces, and even flips will render in the primary model, as a second flip will correct the face orientation back again. BabylonJS performs this same action internally on regular instanced Meshes to prevent rendering entirely as backfacing polygons.

Due to the x/y/z to -y/z/x transformation on brushes above, along with the lack of any required Identity-transform linked-group, the first encountered LinkedGroup is treated as a primary model. To correct for all transformations that have been done, all matrix are passed through a transformation sequence.
* Flip -Y/Z/X back to TrenchBroom orientation
* Inverted against the first models transform to reset geometry to the groups true-origin
* Apply the current linked-groups transformation-matrix 
* Flip -Y/Z/X back to BabylonJS orientation 


#### To Do:
Meshes are not stored in a collection or structure during or after production.

Linked Groups have not been tested with class entities inside them. All linked group class entities will likely render during the ClassEntity rendering phase.

Scales and Rotations are not performed on ClassEntities (models)

Currently the TrenchBroom layer and group data is stored, but is not used. Nodes/Transform Nodes can likely be used to structure the produced Meshes.

These may be performed on the calling project for now. A utility functionality may be added to this package later.


#### Example Map:
Creative Commons CC0 Texture Assets:
* Concrete: https://ambientcg.com/view?id=Concrete042A
* StonePath: https://ambientcg.com/view?id=Tiles087
* Grass: https://ambientcg.com/view?id=Grass003
* Other Textures: https://ambientcg.com - [See License](./example/Examples-LICENSE.md)

Models:
* Bushes / Plant Meshes / Palm Tree: nobiax.deviantart.com / OpenGameArt.com (yughues) / ShareCG.com (yughues)
  * C0 1.0 Universal (CC0 1.0) - Public Domain Dedication 