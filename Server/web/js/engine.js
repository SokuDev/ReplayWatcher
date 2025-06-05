async function initEngine()
{
	loadBackground.src = await loadFileUrl('data/scene/logo/kitou.png');
	gearLoad.src = await loadFileUrl('data/scene/logo/gear.png');
	gearLoad2.src = await loadFileUrl('data/scene/logo/gear.png');

	menu.removeAttribute("hidden");
	gameContainer.removeAttribute("hidden");
	computeSize();
	await playMusic('data/bgm/op2');
}

function computeSize()
{
	let elements = document.querySelectorAll('.game');

	for (let i = 0; i < elements.length; i++) {
		let { width: cw, height: ch } = elements[i].parentNode.getBoundingClientRect();

		elements[i].style.transform = `scale(${cw / 640}, ${ch / 480})`;
	}
}

window.onresize = computeSize;
