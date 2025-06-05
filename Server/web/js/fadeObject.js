let MAX_FADE_TIMER = 60;
let fade = {
	current: 'menu',
	timer: MAX_FADE_TIMER
}

function updateFade()
{
	if (fade.new === fade.current)
		delete fade.new;
	if ('new' in fade) {
		fade.timer++;
		if (fade.timer >= MAX_FADE_TIMER) {
			fade.timer = MAX_FADE_TIMER;
			document.getElementById(fade.current).setAttribute('hidden', true);
			document.getElementById(fade.new).removeAttribute('hidden');
			fade.current = fade.new;
			delete fade.new;
		}
	} else if (fade.timer > 0)
		fade.timer--;
	window.fadeObject.style.opacity = fade.timer / MAX_FADE_TIMER;
	if (fade.timer === 0)
		window.fadeObject.style.display = "none";
	else
		window.fadeObject.style.display = "";
}

setInterval(updateFade, 1000 / 60);
