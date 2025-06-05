let backgrounds = {};
let basicOldBackground = {
	init: initOldBackground,
	update: updateOldBackground
}
let basicNewBackground = {
	init: initNewBackground,
	update: () => {}
}


function initOldBackground()
{
	gameBackground.innerHTML = "";
	for (let y = 0; y < 5; y++) {
		for (let x = 0; x < 6; x++) {
			if (!loadedStage.sprites[x + y * 6])
				continue;

			let img = document.createElement('img');

			img.src = loadedStage.sprites[x + y * 6];
			img.style.left = (x * 256) + "px";
			img.style.top = (y * 256) + "px";
			gameBackground.appendChild(img);
		}
	}
}

function updateOldBackground(camera)
{
	gameBackground.style.transform = `scale(${camera.scale}) translate(${-camera.bgTranslate.x}px, ${-camera.bgTranslate.y}px)`;
}


function initNewBackground(stageInitParams)
{
	gameBackground.innerHTML = "";
	for (let x = 0; x < stageInitParams[id].size[1]; x++) {
		for (let y = 0; y < stageInitParams[id].size[0]; y++) {
			let img = document.createElement('img');

			img.src = loadedStage.sprites[y + x * stageInitParams[id].size[0]];
			img.style.left = (x * 256) + "px";
			img.style.top = (y * 256) + "px";
			gameBackground.appendChild(img);
		}
	}
}

backgrounds[0] = basicOldBackground;
backgrounds[1] = basicOldBackground;
backgrounds[2] = basicOldBackground;
backgrounds[3] = basicOldBackground;
backgrounds[4] = basicOldBackground;
backgrounds[5] = basicOldBackground;
backgrounds[6] = basicOldBackground;
backgrounds[10] = basicOldBackground;
backgrounds[11] = basicOldBackground;
backgrounds[12] = basicOldBackground;
backgrounds[13] = basicOldBackground;
backgrounds[14] = basicOldBackground;
backgrounds[15] = basicOldBackground;
backgrounds[16] = basicOldBackground;
backgrounds[17] = basicOldBackground;
backgrounds[18] = basicOldBackground;
backgrounds[30] = basicNewBackground;
backgrounds[31] = basicNewBackground;
backgrounds[32] = basicNewBackground;
backgrounds[33] = basicNewBackground;
backgrounds[34] = basicNewBackground;
