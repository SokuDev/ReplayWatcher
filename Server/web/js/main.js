let characters = [
	"reimu",     "marisa", "sakuya",  "alice",
	"patchouli", "youmu",  "remilia", "yuyuko",
	"yukari",    "suika",  "udonge",  "aya",
	"komachi",   "iku",    "tenshi",  "sanae",
	"chirno",    "meirin", "utsuho",  "suwako",
	undefined,   undefined,"momiji",  "clownpiece",
	"flandre",   "orin",   "yuuka",   "kaguya",
	"mokou",     "mima",   "shou",    "murasa",
	"sekibanki", "satori", "ran",     "tewi",
	"mamizou"
];
let commonSounds = [
	'001.wav', '002.wav', '003.wav', '004.wav',
	'005.wav', '006.wav', '007.wav', '008.wav',
	'009.wav', '010.wav', '011.wav', '012.wav',
	'020.wav', '021.wav', '022.wav', '023.wav',
	'024.wav', '025.wav', '026.wav', '027.wav',
	'028.wav', '029.wav', '030.wav', '031.wav',
	'032.wav', '033.wav', '034.wav', '035.wav',
	'036.wav', '037.wav', '038.wav', '039.wav',
	'040.wav', '041.wav', '043.wav', '044.wav',
	'045.wav', '046.wav', '047.wav', '048.wav',
	'049.wav', '053.wav', '054.wav', '055.wav',
	'056.wav', '057.wav', '058.wav', '059.wav',
	'061.wav', '070.wav', '071.wav', '072.wav',
	'073.wav', '074.wav', '100.wav', '101.wav',
	'102.wav', '103.wav', '104.wav', '105.wav'
];
let durationFrame = false;
let forcedStage = 14;
let lastVolumes = [0, 0];
let loadingPromises = [];
let topPortraits = [];
let stages = {
	0: { format: 0 },
	1: { format: 0 },
	2: { format: 0, extra: [
		"left/a00.png",
		"left/a01.png",
		"left/a02.png",
		"left/a03.png",
		"left/a04.png",
		"left/a05.png",
		"left/a06.png",
		"left/a07.png",
		"left/a08.png",
		"left/a09.png",
		"left/a10.png",
		"left/a11.png",
		"left/a12.png",
		"left/a13.png",
		"left/a14.png",
		"left/a15.png",

		"center/b00.png",
		"center/b01.png",
		"center/b02.png",
		"center/b03.png",
		"center/b04.png",
		"center/b05.png",
		"center/b06.png",
		"center/b07.png",
		"center/b08.png",
		"center/b09.png",
		"center/b10.png",
		"center/b11.png",
		"center/b12.png",
		"center/b13.png",
		"center/b14.png",
		"center/b15.png",

		"right/c00.png",
		"right/c01.png",
		"right/c02.png",
		"right/c03.png",
		"right/c04.png",
		"right/c05.png",
		"right/c06.png",
		"right/c07.png",
		"right/c08.png",
		"right/c09.png",
		"right/c10.png",
		"right/c11.png",
		"right/c12.png",
		"right/c13.png",
		"right/c14.png",
		"right/c15.png",
	] },
	3: { format: 0 },
	4: { format: 0, extra: [ "cloud2.png" ] },
	5: { format: 0 },
	6: { format: 0 },
	10: { format: 0 },
	11: { format: 0 },
	12: { format: 0, extra: [ "tori1.png", "tori2.png" ] },
	13: { format: 0 },
	14: { format: 0 },
	15: { format: 0 },
	16: { format: 0 },
	17: { format: 0 },
	18: { format: 0 },
	30: { format: 1, size: [4, 5] },
	31: { format: 1, size: [4, 5] },
	32: { format: 1, size: [4, 5] },
	33: { format: 1, size: [3, 5], extra: [ "0001.png", "0002.png" ] },
	34: { format: 1, size: [4, 5], extra: [
		"0001.png", "0002.png", "0003.png", "0004.png",

		"object/objectFa000.png",
		"object/objectFa001.png",
		"object/objectFa002.png",
		"object/objectFa003.png",
		"object/objectFa004.png",
		"object/objectFa005.png",
		"object/objectFa006.png",
		"object/objectFa007.png",
		"object/objectFa008.png",
		"object/objectFa009.png",
		"object/objectFa010.png",
		"object/objectFa011.png",
		"object/objectFa012.png",
		"object/objectFa013.png",
		"object/objectFa014.png",
		"object/objectFa015.png",
		"object/objectFa016.png",
		"object/objectFa017.png",
		"object/objectFa018.png",
		"object/objectFa019.png",
		"object/objectFa020.png",
		"object/objectFa021.png",
		"object/objectFa022.png",
		"object/objectFa023.png",
		"object/objectFa024.png",
		"object/objectFa025.png",
		"object/objectFa026.png",
		"object/objectFa027.png",
		"object/objectFa028.png",
		"object/objectFa029.png",
	] },
};
let baseData;
let loadedStage;
let loadedMusic;
let loadedReplay;
let effectsFramedata;
let infoEffectsFramedata;
let framedatas = [ null, null ];
let currentFrame = null;
let weatherNumbers = document.createElement('img');
let weatherNumbersActivated = document.createElement('img');

function extractBoxes(boxes)
{
	if (!boxes)
		return [];

	let result = [];

	for (let box of boxes.children) {
		if (box.tagName !== 'box')
			throw new Error("Unrecognized box tag name " + box.tagName);

		let bobj = {};

		bobj.left  = +box.attributes.left.value;
		bobj.right = +box.attributes.right.value;
		bobj.up    = +box.attributes.up.value;
		bobj.down  = +box.attributes.down.value;
		result.push(bobj);
	}
	return result;
}

function extractBlend(blend)
{
	if (!blend)
		return {};

	let color = parseInt(blend.attributes.color.value, 16);

	return {
		mode: +blend.attributes.mode.value,
		color: {
			value: color,
			r: (color >> 24) & 0xFF,
			g: (color >> 16) & 0xFF,
			b: (color >> 8)  & 0xFF,
			a: (color >> 0)  & 0xFF,
		},
		scale: {
			x: +blend.attributes.xscale.value,
			y: +blend.attributes.yscale.value
		},
		rotation: {
			x: +blend.attributes.vertflip.value,
			y: +blend.attributes.horzflip.value,
			z: +blend.attributes.angle.value
		}
	};
}

async function extractSpriteData(frame, spriteRoot, palette)
{
	const sprite = frame.attributes.image.value.split('.')[0] + ".png";
	const url = await loadImagePalettedUrl(spriteRoot + "/" + sprite, palette);
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	const img = document.createElement("img");

	return await new Promise((resolve, reject) => {
		img.onload = e => {
			try {
				let offset = {
					x: +frame.attributes.xtexoffset.value,
					y: +frame.attributes.ytexoffset.value,
					w: +frame.attributes.texwidth.value,
					h: +frame.attributes.texheight.value,
				};
				let obj = {
					sprite: sprite,
					textureOffset: offset,
					offset: {
						x: +frame.attributes.xoffset.value,
						y: +frame.attributes.yoffset.value
					},
					duration: +frame.attributes.duration.value,
					renderGroup: +frame.attributes.rendergroup.value
				};

				canvas.width = offset.w;
				canvas.height = offset.h;
				ctx.drawImage(img, -offset.x, -offset.y, offset.w, offset.h, 0, 0, offset.w, offset.h);
				canvas.toBlob(b => {
					if (b)
						obj.image = URL.createObjectURL(b);
					resolve(obj);
				});
			} catch (err) {
				reject(err);
			}
		};
		img.onerror = e => {
			let err = new Error('Failed loading ' + spriteRoot + "/" + sprite + " with palette.");

			err.event = e;
			reject(err);
		};
		img.src = url;
	});
}

async function extractFrames(move, spriteRoot, palette)
{
	let objs = [];
	let promises = [];

	for (let frame of move.children) {
		if (frame.tagName !== 'frame')
			throw new Error("Unrecognized frame tag name " + frame.tagName);

		let fobj = {};
		let traits = frame.getElementsByTagName("traits")[0];
		let effect = frame.getElementsByTagName("effect")[0];

		fobj.blend = extractBlend(frame.getElementsByTagName("blend")[0]);
		fobj.hitBoxes = extractBoxes(frame.getElementsByTagName("attack")[0]);
		fobj.hurtBoxes = extractBoxes(frame.getElementsByTagName("hit")[0]);
		fobj.collisionBoxes = extractBoxes(frame.getElementsByTagName("collision")[0]);
		promises.push(extractSpriteData(frame, spriteRoot, palette).then(r => { fobj.sprite = r }));
		objs.push(fobj);
	}
	for (let promise of promises)
		await promise.catch(console.error);
	return objs;
}

async function loadCharacter(name, pal, replay, key)
{
	console.log('Loading', name, pal);

	const decoder = new TextDecoder('shift-jis');
	const framedata = decoder.decode(await loadFile(`data/character/${name}/${name}.xml`));
	const parser = new DOMParser();
	const doc = parser.parseFromString(framedata, "application/xml").children[0];
	const palette = await loadFile(`data/character/${name}/palette${"0".repeat(3 - Math.ceil(Math.max(1, Math.log10(pal + 1))))}${pal}.act`);
	let obj = {};
	let clones = [];
	let cardSet = new Set();
	let soundSet = new Set();

	replay = replay ?? { frames: [] };
	for (let frame of replay.frames)
		for (let sound of frame[key].sounds)
			soundSet.add(sound);
	for (let move of doc.children) {
		if (move.tagName === 'move') {
			if (!(move.id in obj))
				obj[move.id] = [];
			obj[move.id][move.attributes.index.value] = await extractFrames(move, `data/character/${name}`, palette);
		} else if (move.tagName === 'clone')
			clones.push(move);
		else
			throw new Error("Unrecognized tag name " + move.tagName);
	}
	for (let move of clones)
		obj[move.id] = obj[move.attributes.target.value];
	obj.sfx = [];
	obj.sfx.length = 256;
	for (let sound of soundSet) {
		let audio = document.createElement("audio");

		loadingPromises.push(loadFileUrl(`data/se/${name}/${"0".repeat(3 - Math.ceil(Math.max(1, Math.log10(sound + 1))))}${sound}.wav`).then(url => {
			audio.src = url;
		}).catch(() => {}));
		audio.volume = volumes.sfx;
		obj.sfx[sound] = audio;
	}
	obj.cards = {};

	for (let card of replay?.[key]?.deck ?? [])
		if (card >= 100)
			cardSet.add(card);
	for (let card of cardSet) {
		let cardObj = { url: null, cost: 1 };

		obj.cards[card] = cardObj;
		loadingPromises.push(loadFileUrl(`data/card/${name}/card${card}.png`).then(url => {
			cardObj.url = url;
		}));
	}
	return obj;
}

async function loadEffects(name)
{
	console.log('Loading', name);

	const decoder = new TextDecoder('shift-jis');
	const framedata = decoder.decode(await loadFile(`data/${name}/effect.xml`));
	const parser = new DOMParser();
	const doc = parser.parseFromString(framedata, "application/xml").children[0];
	let obj = {};

	for (let move of doc.children) {
		if (move.tagName === 'animation') {
			if (!(move.id in obj))
				obj[move.id] = [];
			obj[move.id][move.attributes.index.value] = await extractFrames(move, `data/${name}`);
		} else
			throw new Error("Unrecognized tag name " + move.tagName);
	}
	return obj;
}

async function loadStage(id)
{
	if (!(id in stages))
		throw new Error("Invalid stage");

	let handle = id + "";

	loadedStage = {
		sprites: [],
		extra: [],
		id
	};
	if (id < 10)
		handle = "0" + id;
	if (stages[id].format === 0) {
		for (let i = 0; i < 30; i++) {
			let k = i + "";

			if (i < 10)
				k = "0" + i;

			let path = `data/background/bg${handle}/0000_${k}.png`;

			try {
				loadedStage.sprites.push(await loadFileUrl(path));
			} catch (err) {
				loadedStage.sprites.push(undefined);
			}
		}
	} else {
		for (let x = 0; x < stages[id].size[1]; x++) {
			for (let y = 0; y < stages[id].size[0]; y++) {
				let path = `data/background/bg${handle}/0000[0${y}][0${x}].png`;

				loadedStage.sprites.push(await loadFileUrl(path));
			}
		}
		for (let sprite of stages[id].extra)
			loadedStage.sprites.push(
				await loadFileUrl(`data/background/bg${handle}/${sprite}`)
			);
	}
}

async function loadMusic(id)
{
	let k = id + "";

	if (id < 10)
		k = "0" + id;
	loadedMusic = 'data/bgm/st' + k;
	await loadFile('data/bgm/st' + k + ".ogg");
}

async function loadWeatherCounter(root)
{
	const canvas = document.createElement("canvas");
	const url1 = await loadFileUrl('data/battle/weatherFont000.png');
	const url2 = await loadFileUrl('data/battle/weatherFont001.png');
	let p1 = new Promise((resolve, reject) => {
		weatherNumbers.onload = resolve;
		weatherNumbers.onerror = e => {
			let err = new Error('Failed loading data/battle/weatherFont001.png');

			err.event = e;
			reject(err);
		};
		weatherNumbers.src = url2;
	});
	let p2 = new Promise((resolve, reject) => {
		weatherNumbersActivated.onload = resolve;
		weatherNumbersActivated.onerror = e => {
			let err = new Error('Failed loading data/battle/weatherFont000.png');

			err.event = e;
			reject(err);
		};
		weatherNumbersActivated.src = url1;
	});

	canvas.setAttribute('id', 'weatherCounter');
	canvas.style.left = "302px";
	canvas.style.top = "48px";
	canvas.style.zIndex = "30";
	canvas.width = 38;
	canvas.height = 18;
	await p1;
	await p2;
	root.appendChild(canvas);
}

async function loadBaseData()
{
	let obj = {};

	obj.commonEffects = await loadCharacter('common', 0);
	obj.cards = [];
	obj.cards.length = 21;
	for (let i = 0; i < 21; i++) {
		let card = { url: null, cost: 1 };

		obj.cards[i] = card;
		loadingPromises.push(loadFileUrl(`data/card/common/card${"0".repeat(3 - Math.ceil(Math.max(1, Math.log10(i + 1))))}${i}.png`).then(s => {
			card.url = s;
		}));
	}
	obj.sfx = [];
	obj.sfx.length = 128;
	for (let name of commonSounds) {
		try {
			let url = await loadFileUrl(`data/se/${name}`);
			let audio = document.createElement("audio");

			audio.src = url;
			audio.volume = volumes.sfx;
			obj.sfx[parseInt(name)] = audio;
		} catch (err) {}
	}
	await loadHudFile(gameHUDUpper, 'data/battle/battleUpper.xml', 'hudUpper');
	await loadHudFile(gameHUDUnder, 'data/battle/battleUnder.xml', 'hudUnder');
	effectsFramedata = await loadEffects('effect');
	infoEffectsFramedata = await loadEffects('infoeffect');
	await loadWeatherCounter(gameHUD);
	for (let i = 0; i < 2; i++) {
		//for (let j = 0; j < 5; j++)
		//	window["hudUnder" + (20 + i * 10 + j)].children[0].style.transform = "scaleX(-1)";
		for (let j = 0; j < 5; j++) {
			let cardHolder = window["hudUnder" + (205 + j + i * 10)];

			if (i == 0)
				cardHolder.style.transform = 'translate(2px, 2px)';
			else
				cardHolder.style.transform = 'translate(' + (2 - cardHolder.children[0].width) +  'px, 2px)';
			cardHolder.children[0].width  = cardHolder.children[0].width  - 4;
			cardHolder.children[0].height = cardHolder.children[0].height - 4;
		}
	}
	return obj;
}

async function loadReplayData(replayFile)
{
	let players = [ replayFile.p1, replayFile.p2 ];

	if (!baseData)
		baseData = await loadBaseData();
	for (let i = 0; i < players.length; i++) {
		let chr = characters[players[i].character];

		if (!chr)
			throw new Error("Invalid character");
		framedatas[i] = await loadCharacter(chr, players[i].palette, replayFile, 'p' + (i + 1));
		window[`p${i + 1}Portrait`].src = await loadFileUrl(`data/character/${chr}/face/face000.png`);
	}
	await loadStage(forcedStage ?? replayFile.stageId);
	await loadMusic(replayFile.musicId);
	backgrounds[forcedStage ?? replayFile.stageId].init(stages[forcedStage ?? replayFile.stageId]);
	loadedReplay = replayFile;
	for (let promise of loadingPromises)
		await promise;
	loadingPromises = [];
}

async function loadReplayFile(hash)
{
	if (!replay.files.length && hash == null)
		return;

	try {
		fade.new = "loading";

		let arr = replay.files[0]?.name?.split('.') ?? [];
		let ext = arr[arr.length - 1];
		let data;

		if (hash) {
			let response = await fetch('/converted_replay/' + hash);

			if (!response.ok)
				throw new Error(response.status + " " + response.statusText);
			data = await response.arrayBuffer();
		} else if (ext !== '.re2'){
			let form = new FormData();

			form.set('file', replay.files[0]);

			let response = await fetch('/convert_replay', { method: "POST", body: form });

			if (!response.ok)
				throw new Error(response.status + " " + response.statusText);

			let url = new URL(window.location.origin + window.location.pathname + "?replay=" + response.headers.get("X-Hash"));

			history.pushState(null, null, url);
			data = await response.arrayBuffer();
		} else
			data = await replay.files[0].arrayBuffer();

		let replayFile = loadReplay(data);

		await playMusic();
		await loadReplayData(replayFile);

		fade.new = "game";
		videoSlider.value = 0;
		videoSlider.setAttribute("max", loadedReplay.frames.length);
		currentFrame = 0;
		playGame();
		revealControls();
	} catch (err) {
		fade.new = "menu";
		loadError.textContent = "Invalid replay:" + err;
		console.error(err);
	}
}

let hideTimeout = null;
let hideSfxTimeout = null;
let hideMusicTimeout = null;
let sfxIcons = [ "&#128263;", "&#128264;", "&#128265;", "&#128266;" ];
let musicIcons = [ "&#119188;", "&#119189;" ];

function revealControls()
{
	if (hideTimeout)
		clearTimeout(hideTimeout);
	if (playing)
		hideTimeout = setTimeout(() => {
			videoControlContainer.style.cursor = "none";
			videoControlContainer.style.opacity = "0%";
			videoControlContainer.style.transition = "opacity 1s";
		}, 4000);
	videoControlContainer.style.transition = "";
	videoControlContainer.style.cursor = "";
	videoControlContainer.style.opacity = "100%";
}

function reloadSoundIcons()
{
	if (volumes.sfx === 0)
		sfxButton.innerHTML = sfxIcons[0];
	else if (volumes.sfx < 0.25)
		sfxButton.innerHTML = sfxIcons[1];
	else if (volumes.sfx < 0.5)
		sfxButton.innerHTML = sfxIcons[2];
	else
		sfxButton.innerHTML = sfxIcons[3];
	if (volumes.music === 0)
		musicButton.innerHTML = musicIcons[0];
	else
		musicButton.innerHTML = musicIcons[1];
}

function muteSfx()
{
	let last = lastVolumes[0];

	lastVolumes[0] = volumes.sfx;
	if (volumes.sfx === 0)
		volumes.sfx = last;
	else
		volumes.sfx = 0;
	sfxSlider.value = volumes.sfx;
	localStorage.setItem("volumeSfx", volumes.sfx);
	reloadSoundIcons();
}

function muteMusic()
{
	let last = lastVolumes[1];

	lastVolumes[1] = volumes.music;
	if (volumes.music === 0)
		volumes.music = last;
	else
		volumes.music = 0;
	musicSlider.value = volumes.music;
	localStorage.setItem("volumeMusic", volumes.music);
	reloadSoundIcons();
}

function displaySfxSlider()
{
	if (hideSfxTimeout != null)
		clearTimeout(hideSfxTimeout);
	hideSfxTimeout = setTimeout(() => {
		sfxSlider.style.opacity = "0";
		hideSfxTimeout = setTimeout(() => sfxSlider.style.display = "none", 250);
	}, 2000);
	sfxSlider.style.display = "block";
	sfxSlider.style.opacity = "100%";
}

function displayMusicSlider()
{
	if (hideMusicTimeout != null)
		clearTimeout(hideMusicTimeout);
	hideMusicTimeout = setTimeout(() => {
		musicSlider.style.opacity = "0";
		hideMusicTimeout = setTimeout(() => musicSlider.style.display = "none", 250);
	}, 2000);
	musicSlider.style.display = "block";
	musicSlider.style.opacity = "100%";
}

function disableSfxSliderHide()
{
	if (hideSfxTimeout == null)
		return;
	clearTimeout(hideSfxTimeout);
	hideSfxTimeout = null;
}

function disableMusicSliderHide()
{
	if (hideMusicTimeout == null)
		return;
	clearTimeout(hideMusicTimeout);
	hideMusicTimeout = null;
}

function hideSfxSlider()
{
	if (hideSfxTimeout != null)
		return;
	hideSfxTimeout = setTimeout(() => {
		sfxSlider.style.opacity = "0";
		hideSfxTimeout = setTimeout(() => sfxSlider.style.display = "none", 250);
	}, 2000);
}

function hideMusicSlider()
{
	if (hideMusicTimeout != null)
		return;
	hideMusicTimeout = setTimeout(() => {
		musicSlider.style.opacity = "0";
		hideMusicTimeout = setTimeout(() => musicSlider.style.display = "none", 250);
	}, 2000);
}

function updateSfxVolume()
{
	volumes.sfx = +sfxSlider.value;
	localStorage.setItem("volumeSfx", volumes.sfx);
	reloadSoundIcons();
}

function updateMusicVolume()
{
	volumes.music = +musicSlider.value;
	localStorage.setItem("volumeMusic", volumes.music);
	reloadSoundIcons();
}

function gameKeyDown(event)
{
	if (fade.current !== "game")
		return console.log(event.code);

	let time = 1;

	if (!durationFrame)
		time = 60;
	if (event.ctrlKey)
		time *= 5;
	if (event.code === "ArrowLeft") {
		currentFrame -= time + 1;
		playFrame();
	} else if (event.code === "ArrowRight") {
		currentFrame += time - 1;
		playFrame();
	} else if (event.code === "Space") {
		if (playing)
			videoPause.click();
		else
			videoPlay.click();
	} else
		console.log(event.code);
}

function updateDuration()
{
	if (durationFrame)
		return videoDuration.textContent = `${currentFrame}/${loadedReplay.frames.length}`;

	let tsc = Math.floor(currentFrame / 60);
	let sc = tsc % 60;
	let mc = Math.floor(tsc / 60);
	let tst = Math.ceil(loadedReplay.frames.length / 60);
	let st = tst % 60;
	let mt = Math.floor(tst / 60);

	videoDuration.textContent = `${mc}:${sc < 10 ? "0" + sc : sc}/${mt}:${st < 10 ? "0" + st : st}`;
}

function changeDurationFormat()
{
	durationFrame = !durationFrame;
	updateDuration();
}

function resetReplayHash()
{
	window.location = window.location.pathname;
}

window.addEventListener("load", () => {
	replay.onchange = () => loadReplayFile();
	videoSlider.onmousedown = event => {
		if (event.button !== 0)
			return;
		clearInterval(gameInterval);
		gameInterval = null;
	};
	videoSlider.onmouseup = event => {
		if (event.button !== 0)
			return;
		if (playing)
			playGame();
	};
	videoSlider.oninput = () => {
		currentFrame = videoSlider.value;
		playFrame();
	};
	game.onmousemove = revealControls;
	videoPlay.onclick = playGame;
	videoPause.onclick = pauseGame;

	sfxButton.onclick = muteSfx;
	sfxButton.onmousemove = displaySfxSlider;
	sfxSlider.onmouseenter = disableSfxSliderHide;
	sfxSlider.onmouseleave = hideSfxSlider;
	sfxSlider.oninput = updateSfxVolume;
	musicButton.onclick = muteMusic;
	musicButton.onmousemove = displayMusicSlider;
	musicSlider.onmouseenter = disableMusicSliderHide;
	musicSlider.onmouseleave = hideMusicSlider;
	musicSlider.oninput = updateMusicVolume;
	videoDuration.onclick = changeDurationFormat;
	resetReplay.onclick = resetReplayHash;
	document.onkeydown = gameKeyDown;

	volumes.music = +(localStorage.getItem("volumeMusic") ?? 0);
	volumes.sfx = +(localStorage.getItem("volumeSfx") ?? 0);
	if (isNaN(volumes.music))
		volumes.music = 0;
	if (isNaN(volumes.sfx))
		volumes.sfx = 0;
	sfxSlider.value = volumes.sfx;
	musicSlider.value = volumes.music;
	reloadSoundIcons();

	let params = new URLSearchParams(window.location.search);

	if (!params.has("replay"))
		return;

	let hash = params.get("replay");

	if (hash.length !== 64)
		return;
	if (hash.search(/[^0123456789ABCDEFabcdef]/g) !== -1)
		return;
	loadReplayFile(hash);
});
