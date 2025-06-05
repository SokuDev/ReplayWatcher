let musicData = {
	handle: null,
	fadeIn: false,
	fadeCounter: 0
};
let volumes = {
	music: 0.005,
	sfx: 0.005
};
let cache = {};
let palettedCache = {};
let noPalette = {};
let FADEOUT_TIME = 60;
let FADEIN_TIME = 60;

async function fetchImagePalettedUrl(path, palette)
{
	let data = await loadFile(path);

	if (data[25] === 3) {
		let index = data.findIndex((v, i, a) => {
			let target = "PLTE";

			for (let j = 0; j < 4; j++)
				if (a[i + j] !== target.charCodeAt(j))
					return false;
			return true;
		});
		let oldData = data;
		let start = index;

		noPalette[path] = false;
		data = [];
		data.length = oldData.length + 13;
		index += 4;
		for (let i = 0; i < index; i++)
			data[i] = oldData[i];
		for (let i = 0; i < 256 * 3; i++)
			data[index++] = palette[i];

		let crc = pngCrc32(data, start, 256 * 3 + 4);

		data[index++] = (crc >>> 24) & 0xFF;
		data[index++] = (crc >>> 16) & 0xFF;
		data[index++] = (crc >>> 8) & 0xFF;
		data[index++] = (crc >>> 0) & 0xFF;

		let copyHead = index;
		let extra = "\x00\x00\x00\x01tRNS\x00\x40\xe6\xd8\x66";

		for (let i = 0; i < extra.length; i++)
			data[index++] = extra.charCodeAt(i);
		for (let i = copyHead; i < oldData.length; i++)
			data[index++] = oldData[i];
		data = new Uint8Array(data);
	} else
		noPalette[path] = true;
	palettedCache[`${palette}|${path}`] = {
		data: data,
		url: URL.createObjectURL(new Blob([data])),
	};
}

async function loadImagePalettedUrl(path, palette)
{
	if (noPalette[path] || palette == null)
		return loadFileUrl(path);

	let index = `${palette}|${path}`;

	if (!(index in palettedCache))
		await fetchImagePalettedUrl(path, palette);
	return palettedCache[index].url;
}

async function playMusic(path)
{
	let url;
	let audio;
	let loopPoints;

	try {
		if (path) {
			url = await loadFileUrl(path + ".ogg");
			audio = document.createElement("audio");

			let data = await loadFile(path + ".lbl");
			let text = new TextDecoder().decode(data);
			let points = text.split('\t');

			loopPoints = [+points[0], +points[1]];
		}
	} catch (err) {
		console.error(err);
	}
	if (audio)
		audio.src = url;
	if (musicData.handle !== null) {
		musicData.newHandle = { audio, loopPoints };
		musicData.fadeIn = false;
		musicData.fadeCounter = 0;
		if (audio)
			audio.volume = 0;
	} else {
		musicData.handle = { audio, loopPoints };
		musicData.fadeIn = true;
		musicData.fadeCounter = 0;
		if (audio)
			audio.volume = volumes.music;
	}
}

async function playSound(path)
{
	let url = await loadFileUrl(path);
	let audio = document.createElement("audio");

	audio.volume = volumes.sfx;
	audio.src = url;
	await audio.play();
}

async function updateMusic()
{
	if (!musicData.handle)
		return;
	if (musicData.fadeIn) {
		try {
			if (musicData.handle.audio)
				await musicData.handle.audio.play();
		} catch (err) {
			return;
		}
		musicData.fadeCounter++;
		if (musicData.fadeCounter >= FADEIN_TIME)
			musicData.fadeCounter = FADEIN_TIME;
		if (musicData.handle.audio)
			musicData.handle.audio.volume = volumes.music * musicData.fadeCounter / FADEIN_TIME;
	} else {
		musicData.fadeCounter++;
		if (musicData.fadeCounter >= FADEOUT_TIME) {
			let oldHandle = musicData.handle.audio;

			if (musicData.handle.audio)
				musicData.handle.audio.pause();
			musicData.handle = musicData.newHandle;
			if (musicData.handle.audio)
				musicData.handle.audio.play();
			if (oldHandle) {
				musicData.fadeCounter = 0;
				musicData.fadeIn = true;
			} else {
				musicData.fadeCounter = FADEIN_TIME;
				musicData.fadeIn = true;
			}
		} else if (musicData.handle.audio)
			musicData.handle.audio.volume = volumes.music * (1 - musicData.fadeCounter / FADEOUT_TIME);
	}
	if (musicData.handle.loopPoints) {
		if (musicData.handle.audio.currentTime >= musicData.handle.loopPoints[0] + musicData.handle.loopPoints[1])
			musicData.handle.audio.currentTime -= musicData.handle.loopPoints[1];
	}
}

setInterval(updateMusic, 10);
