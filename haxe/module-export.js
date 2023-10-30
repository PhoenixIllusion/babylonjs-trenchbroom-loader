class JsHxInput extends haxe_io_Input {
	constructor(uint8) {
		super();
		this.buffer = uint8;
		this.index = 0;
	}
	readByte() {
		if(this.index >= this.buffer.byteLength) {
			throw new haxe_io_Eof();
		}
		return this.buffer[this.index++];
	}
}

export {
	libmap_GeoGenerator as GeoGenerator,
	libmap_MapParser as MapParser,
	libmap_SurfaceGatherer as SurfaceGatherer,
	JsHxInput as Input
}