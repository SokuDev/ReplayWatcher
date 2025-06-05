async function crawlFolder(file, path)
{
	let iter = file.entries();
	let elem = await iter.next();

	console.log("Crawling", path);
	while (!elem.done) {
		let f = elem.value[1];
		let p = path + "/" + f.name;

		if (f.kind == 'directory') {
			await crawlFolder(f, p);
			elem = await iter.next();
			continue;
		}

		let file = await f.getFile();
		let buffer = await file.arrayBuffer();
		let g = pako.gzip(buffer);
		let t = await dataDb.transaction('sokuData', 'readwrite');
		let s = t.objectStore('sokuData');
		let r;

		window.loadDataProgress.value++;
		window.loadDataData.textContent = `${Math.floor(window.loadDataProgress.value / window.loadDataProgress.max * 1000) / 10}% ` + p;
		if (buffer.byteLength <= g.length)
			r = s.put({data: new Uint8Array(buffer), compressed: false}, p);
		else
			r = s.put({data: g, compressed: true}, p);
		await new Promise((resolve, reject) => {
			r.onsuccess = resolve;
			r.onerror = reject;
		});
		console.log(r);
		if (!r.result)
			throw new Error("Failed inserting " + p);
		elem = await iter.next();
	}
}

async function countFiles(file)
{
	let iter = file.entries();
	let elem = await iter.next();
	let count = 0;

	while (!elem.done) {
		let f = elem.value[1];

		if (f.kind == 'directory')
			count += await countFiles(f);
		else
			count++;
		elem = await iter.next();
	}
	return count;
}

async function loadSokuData()
{
	let f = await window.showDirectoryPicker();

	start = new Date();
	if (f.kind !== 'directory')
		alert("Invalid folder provided");
	f = await f.getDirectoryHandle("data");
	if (f.kind !== 'directory')
		alert("Invalid folder provided");

	let nbFiles = await countFiles(f);

	notInit.setAttribute("hidden", true);
	loadData.removeAttribute("hidden");
	loadDataProgress.max = nbFiles;
	loadDataProgress.value = 0;
	loadDataData.textContent = "0%";
	await crawlFolder(f, '/data');
	loadDataProgress.setAttribute("hidden", true);
	loadDataData.textContent = "Finalizing...";
	await loadFileUrl('data/scene/logo/kitou.png');
	localStorage.setItem("loaded", true);
	loadData.setAttribute("hidden", true);
	end = new Date();

	t = end - start;
	minutes = Math.floor(t / 60000);
	seconds = Math.floor(t / 1000 % 60)
	window.time.textContent = 'Loading time: ' + minutes + "m" + seconds + "s";
	initEngine();
}
