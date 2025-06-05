let localCache = {};

async function fetchFile(path)
{
	let response = await fetch("../hisoutensoku/" + path);

	if (!response.ok)
		throw new Error("Cannot find " + path);

	let data = new Uint8Array(await response.arrayBuffer());

	localCache[path] = {
		data: data,
		url: URL.createObjectURL(new Blob([data]))
	};
}

async function loadFile(path)
{
	if (!(path in localCache))
		await fetchFile(path);
	return localCache[path].data;
}

async function loadFileUrl(path)
{
	if (!(path in localCache))
		await fetchFile(path);
	return localCache[path].url;
}

window.addEventListener("load", () => {
	initEngine();
});