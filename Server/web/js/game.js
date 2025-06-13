function renderObject(tag, obj, framedata, i, baseZ, invertZ)
{
	if (obj.actionId >= 1000)
		framedata = baseData.commonEffects;
	if (!(obj.actionId in framedata)) {
		console.log("Unknown action", obj.actionId, i);
		return;
	}
	if (!(obj.sequenceId in framedata[obj.actionId])) {
		console.log("Unknown sequence", obj.actionId, obj.sequenceId, i);
		return;
	}
	if (!(obj.poseId in framedata[obj.actionId][obj.sequenceId])) {
		console.log("Unknown pose", obj.actionId, obj.sequenceId, obj.poseId, i);
		return;
	}

	let frame = framedata[obj.actionId][obj.sequenceId][obj.poseId];
	let scale = {};

	if (frame.sprite.renderGroup === 0) {
		scale.x = 2;
		scale.y = 2;
	} else if (frame.sprite.renderGroup === 2) {
		scale.x = frame.blend.scale.x / 100;
		scale.y = frame.blend.scale.y / 100;
	} else {
		scale.x = 1;
		scale.y = 1;
	}

	let scaleReal = {
		x: (frame.sprite.renderGroup === 2 ? frame.blend.scale.x : 100) / 100,
		y: (frame.sprite.renderGroup === 2 ? frame.blend.scale.y : 100) / 100
	};

	scale.x *= obj.renderInfo.scale.x * obj.direction;
	scale.y *= obj.renderInfo.scale.y;
	scaleReal.x *= obj.renderInfo.scale.x * obj.direction;
	scaleReal.y *= obj.renderInfo.scale.y;

	let result = {
		x: -frame.sprite.offset.x * scaleReal.x,
		y: -frame.sprite.offset.y * scaleReal.y
	};
	let rotation = { ...obj.renderInfo.rotation };
	let translate = { x: 0, y: 0 };
	let color = { ...obj.renderInfo.color };

	result.x += frame.sprite.textureOffset.w * scale.x / 2;
	result.y += frame.sprite.textureOffset.h * scale.y / 2;

	if (frame.sprite.renderGroup === 2) {
		rotation.x += frame.blend.rotation.x;
		rotation.y += frame.blend.rotation.y;
		rotation.z += frame.blend.rotation.z;
		color.r = (color.r * frame.blend.color.r) / 255;
		color.g = (color.g * frame.blend.color.g) / 255;
		color.b = (color.b * frame.blend.color.b) / 255;
		color.a = (color.a * frame.blend.color.a) / 255;
	}

	// TODO: Rotation offset is wrong
	rotation.x *= Math.PI / 180;
	rotation.y *= Math.PI / 180;
	rotation.z *= Math.PI / 180;

	// TODO: Handle tint
	// this->_sprite.setColor(SokuColor(data.frame->blendOptions.color));

	// X rotation
	result.y *= Math.cos(rotation.x);
	scale.y *= Math.cos(rotation.x);

	// Y rotation
	result.x *= Math.cos(rotation.y);
	scale.x *= Math.cos(rotation.y);

	if (frame.sprite.renderGroup === 2 && frame.blend) {
		let c = Math.cos(frame.blend.rotation.z);
		let s = Math.sin(frame.blend.rotation.z);

		result = {
			x: c * result.x - s * result.y,
			y: s * result.x + c * result.y,
		};
	}

	result.x -= frame.sprite.textureOffset.w / 2;
	result.y -= frame.sprite.textureOffset.h / 2;

	if (frame.sprite.image)
		tag.src = frame.sprite.image;
	tag.style.opacity = color.a / 255;
	tag.style.imageRendering = "pixelated";
	tag.style.left = (result.x + obj.position.x) + "px";
	if (obj.posAbsolute)
		tag.style.top = (result.y + obj.position.y) + "px";
	else
		tag.style.top = (result.y - obj.position.y) + "px";
	tag.style.transform = `scale(${scale.x}, ${scale.y}) rotate(${rotation.z}rad)`;
	if (invertZ)
		tag.style.zIndex = baseZ - obj.layer;
	else
		tag.style.zIndex = obj.layer + baseZ;
	if (frame.sprite.renderGroup === 2) {
		if (frame.blend.mode === 1)
			tag.style.mixBlendMode = "plus-lighter";
		if (frame.blend.mode === 2)
			tag.style.mixBlendMode = "difference";
	}
}

function renderWeatherCounter(frame)
{
	const counter = document.getElementById('weatherCounter');
	const ctx = counter.getContext('2d');
	const img = frame.activeWeather === 21 ? weatherNumbers : weatherNumbersActivated;
	let timer = frame.weatherTimer;

	ctx.clearRect(0, 0, 38, 18);
	ctx.drawImage(img, timer % 10 * 11, 0, 11, 18, 27, 0, 11, 18);
	timer = Math.floor(timer / 10);
	ctx.drawImage(img, 132, 0, 5, 18, 22, 0, 5, 18);
	ctx.drawImage(img, timer % 10 * 11, 0, 11, 18, 11, 0, 11, 18);
	timer = Math.floor(timer / 10);
	ctx.drawImage(img, timer % 10 * 11, 0, 11, 18, 0, 0, 11, 18);
}

function renderPlayerHud(player, framedata, i)
{
	window["hudUpper" + (10 + i)].setAttribute("value", player.hp / 10000);
	window["hudUpper" + (15 + i)].setAttribute("value", player.redHp / 10000);
	for (let j = 0; j < 5; j++) {
		let borderBar = window["hudUnder" + (20 + i * 10 + j)];
		let borderFull = window["hudUnder" + (40 + i * 10 + j)];
		let borderGauge = window["hudUnder" + (60 + i * 10 + j)];
		let crashGauge = window["hudUnder" + (80 + i * 10 + j)];
		let crash = window["hudUnder" + (100 + i * 10 + j)];

		if (player.maxSpirit > j * 200) {
			borderGauge.removeAttribute("hidden");
			crashGauge.setAttribute("hidden", true);
			crash.setAttribute("hidden", true);
		} else if (player.maxSpirit == j * 200) {
			borderGauge.setAttribute("hidden", true);
			crashGauge.removeAttribute("hidden");
			crash.removeAttribute("hidden");
			crash.setAttribute("value", 1 - player.timeWithBrokenOrb / 4800);
		} else {
			borderGauge.setAttribute("hidden", true);
			crashGauge.removeAttribute("hidden");
			crash.setAttribute("hidden", true);
		}
		if (player.spirit >= (j + 1) * 200) {
			borderFull.removeAttribute("hidden");
			borderBar.setAttribute("hidden", true);
		} else if (player.spirit > j * 200) {
			borderFull.setAttribute("hidden", true);
			borderBar.removeAttribute("hidden");
			borderBar.setAttribute("value", (player.spirit - j * 200) / 200);
		} else {
			borderFull.setAttribute("hidden", true);
			borderBar.setAttribute("hidden", true);
		}
	}
	for (let j = 0; j < 2; j++) {
		if (player.score > j)
			window["hudUpper" + (20 + j + i * 5)].removeAttribute("hidden");
		else
			window["hudUpper" + (20 + j + i * 5)].setAttribute("hidden", true);
	}
	for (let j = 0; j < 5; j++) {
		let cardGauge = window["hudUnder" + (200 + j + i * 10)];
		let cardHolder = window["hudUnder" + (205 + j + i * 10)];
		let cardBar = window["hudUnder" + (120 + j + i * 10)];
		let cardFaceDown = window["hudUnder" + (140 + j + i * 10)];

		if (player.hand[j] === 99) {
			cardGauge.removeAttribute("hidden");
			cardHolder.setAttribute("hidden", true);
			cardBar.setAttribute("hidden", true);
			cardFaceDown.removeAttribute("hidden");
			continue;
		}
		cardFaceDown.setAttribute("hidden", true);
		if (player.deckSize >= j + 1)
			cardGauge.removeAttribute("hidden");
		else
			cardGauge.setAttribute("hidden", true);
		if (j === player.hand.length) {
			cardBar.removeAttribute("hidden");
			cardBar.setAttribute('value', 1 - player.cardGauge / 500);
			cardHolder.setAttribute("hidden", true);
		} else if (j < player.hand.length) {
			cardBar.setAttribute("hidden", true);
			cardHolder.removeAttribute("hidden");
			if (player.hand[j] < 100)
				cardHolder.children[0].src = baseData.cards[player.hand[j]].url;
			else
				cardHolder.children[0].src = framedata.cards[player.hand[j]].url;
		} else {
			cardBar.setAttribute("hidden", true);
			cardHolder.setAttribute("hidden", true);
		}
	}
}

function renderPlayer(tag, objDiv, player, framedata, i)
{
	objDiv.innerHTML = "";
	renderObject(tag, player, framedata, i, 0, false);
	renderPlayerHud(player, framedata, i);
	for (let obj of player.objects) {
		let img = document.createElement("img");

		renderObject(img, obj, framedata, i, 0, false);
		if (obj.posAbsolute)
			window.guiObjects.appendChild(img);
		else
			objDiv.appendChild(img);
	}
}

function renderEffects(objDiv, effects, framedata, i, baseZ, invertZ)
{
	objDiv.innerHTML = "";
	for (let obj of effects) {
		let img = document.createElement("img");

		renderObject(img, obj, framedata, i, baseZ, invertZ);
		if (obj.posAbsolute)
			window.guiObjects.appendChild(img);
		else
			objDiv.appendChild(img);
	}
}

function playSounds(list, bank)
{
	for (let elem of list) {
		if (!bank[elem]) {
			console.log("Cannot find", elem, "in", bank === baseData.sfx ? "default" : bank === framedatas[0].sfx ? "P1's" : "P2's", "bank!");
			return;
		}

		bank[elem].currentTime = 0;
		bank[elem].volume = volumes.sfx;
		bank[elem].play();
	}
}

async function playFrame()
{
	if (currentFrame == null)
		return;
	if (currentFrame === loadedReplay.frames.length) {
		pauseGame();
		return;
	}
	videoSlider.value = currentFrame;

	let frame = loadedReplay.frames[currentFrame];

	window.guiObjects.innerHTML = "";
	backgrounds[forcedStage ?? loadedReplay.stageId].update(frame.camera);
	renderPlayer(window.p1, window.p1Obj, frame.p1, framedatas[0], 0);
	renderPlayer(window.p2, window.p2Obj, frame.p2, framedatas[1], 1);
	renderEffects(window.effects, frame.effects, effectsFramedata, -1, 0, false);
	renderEffects(window.infoEffects, frame.infoEffects, infoEffectsFramedata, -2, 15, true);
	renderWeatherCounter(frame);
	playSounds(frame.sounds, baseData.sfx);
	playSounds(frame.p1.sounds, framedatas[0].sfx);
	playSounds(frame.p2.sounds, framedatas[1].sfx);

	counterTransform.style.transform = `scale(${1 / frame.camera.scale}) translate(${-frame.camera.translate.x * frame.camera.scale}px, ${-frame.camera.translate.y * frame.camera.scale}px)`;
	gameScene.style.transform = `scale(${frame.camera.scale}) translate(${frame.camera.translate.x}px, ${frame.camera.translate.y}px)`;
	if (currentFrame === 60)
		await playMusic(loadedMusic);
	updateDuration();
	currentFrame++;
}

let gameInterval = null;
let gameSpeed = 1;
let playing = false;

function playGame()
{
	playing = true;
	if (gameInterval != null)
		clearInterval(gameInterval);
	gameInterval = setInterval(playFrame, gameSpeed * 1000 / 60);
	videoPlay.setAttribute("hidden", "");
	videoPause.removeAttribute("hidden");
	revealControls();
}

function pauseGame()
{
	playing = false;
	if (gameInterval != null)
		clearInterval(gameInterval);
	gameInterval = null;
	videoPlay.removeAttribute("hidden");
	videoPause.setAttribute("hidden", "");
	revealControls();
}
