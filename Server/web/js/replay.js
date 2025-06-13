class ReplayReader {
	constructor(data)
	{
		this.data = new DataView(data);
		this.index = 0;
	}

	readBool()
	{
		let index = this.index;

		this.index++;
		return this.data.getInt8(index) !== 0;
	}

	readChar()
	{
		let index = this.index;

		this.index++;
		return this.data.getInt8(index);
	}

	readUChar()
	{
		let index = this.index;

		this.index++;
		return this.data.getUint8(index);
	}

	readShort()
	{
		let index = this.index;

		this.index += 2;
		return this.data.getInt16(index, true);
	}

	readUShort()
	{
		let index = this.index;

		this.index += 2;
		return this.data.getUint16(index, true);
	}

	readInt()
	{
		let index = this.index;

		this.index += 4;
		return this.data.getInt32(index, true);
	}

	readUInt()
	{
		let index = this.index;

		this.index += 4;
		return this.data.getUint32(index, true);
	}

	readFloat()
	{
		let index = this.index;

		this.index += 4;
		return this.data.getFloat32(index, true);
	}

	isEnd()
	{
		return this.index >= this.data.byteLength;
	}

	readReplayPlayerHeaderV2()
	{
		let chr = {};

		chr.character = this.readUInt();
		chr.palette = this.readUChar();
		chr.deck = [];
		chr.deck.length = this.readInt();
		for (let i = 0; i < chr.deck.length; i++)
			chr.deck[i] = this.readUShort();
		return chr;
	}

	readReplayHeaderV2()
	{
		let header = {};

		header.musicId = this.readUChar();
		header.stageId = this.readUChar();
		header.p1 = this.readReplayPlayerHeaderV2();
		header.p2 = this.readReplayPlayerHeaderV2();
		return header;
	}

	readVector2f()
	{
		return {
			x: this.readFloat(),
			y: this.readFloat()
		}
	}

	readVector3f()
	{
		return {
			x: this.readFloat(),
			y: this.readFloat(),
			z: this.readFloat()
		}
	}

	readColor()
	{
		let value = this.readUInt();

		return {
			value,
			r: (value >> 16) & 0xFF,
			g: (value >> 8)  & 0xFF,
			b: (value >> 0)  & 0xFF,
			a: (value >> 24) & 0xFF,
		}
	}

	readRenderInfo()
	{
		let info = {};

		info.color = this.readColor();
		info.shader = this.readInt();
		info.shaderColor = this.readColor();
		info.scale = this.readVector2f();
		info.rotation = this.readVector3f();
		return info;
	}

	readReplayFrameObjectV2()
	{
		let data = {};

		data.direction = this.readChar();
		data.posAbsolute = this.readBool();
		data.position = this.readVector2f();
		data.rotationCenter = this.readVector2f();
		data.renderInfo = this.readRenderInfo();
		data.actionId = this.readUShort();
		data.sequenceId = this.readUShort();
		data.poseId = this.readUShort();
		data.layer = this.readChar();
		return data;
	}

	readReplayCharacterDataV2()
	{
		let data = this.readReplayFrameObjectV2();

		data.comboDamage = this.readUShort();
		data.comboLimit = this.readUShort();
		data.hp = this.readUShort();
		data.redHp = this.readUShort();
		data.spirit = this.readUShort();
		data.maxSpirit = this.readUShort();
		data.timeWithBrokenOrb = this.readUShort();
		data.deckSize = this.readUChar();
		data.score = this.readUChar();
		data.hand = [this.readUChar(), this.readUChar(), this.readUChar(), this.readUChar(), this.readUChar()].filter(r => r !== 255);
		data.cardGauge = this.readUShort();
		data.sounds = [];
		data.sounds.length = this.readUChar();
		data.objects = [];
		data.objects.length = this.readUShort();
		return data;
	}

	readReplayFrameV2()
	{
		let frame = {};

		frame.p1 = this.readReplayCharacterDataV2();
		frame.p2 = this.readReplayCharacterDataV2();
		frame.activeWeather = this.readUChar();
		frame.displayedWeather = this.readUChar();
		frame.weatherTimer = this.readUShort();
		frame.sounds = [];
		frame.sounds.length = this.readUChar();
		frame.camera = {};
		frame.camera.translate = this.readVector2f();
		frame.camera.bgTranslate = this.readVector2f();
		frame.camera.scale = this.readFloat();
		frame.effects = [];
		frame.effects.length = this.readUShort();
		frame.infoEffects = [];
		frame.infoEffects.length = this.readUShort();
		for (let i = 0; i < frame.p1.objects.length; i++)
			frame.p1.objects[i] = this.readReplayFrameObjectV2();
		for (let i = 0; i < frame.p2.objects.length; i++)
			frame.p2.objects[i] = this.readReplayFrameObjectV2();
		for (let i = 0; i < frame.effects.length; i++)
			frame.effects[i] = this.readReplayFrameObjectV2();
		for (let i = 0; i < frame.infoEffects.length; i++)
			frame.infoEffects[i] = this.readReplayFrameObjectV2();
		for (let i = 0; i < frame.sounds.length; i++)
			frame.sounds[i] = this.readUChar();
		for (let i = 0; i < frame.p1.sounds.length; i++)
			frame.p1.sounds[i] = this.readUChar();
		for (let i = 0; i < frame.p2.sounds.length; i++)
			frame.p2.sounds[i] = this.readUChar();
		return frame;
	}

	readReplayV2()
	{
		let replay = this.readReplayHeaderV2();

		console.log(replay);
		replay.frames = [];
		while (!this.isEnd())
			replay.frames.push(this.readReplayFrameV2());
		return replay;
	}
}

function loadReplay(data)
{
	let reader = new ReplayReader(data);

	return reader.readReplayV2();
}
