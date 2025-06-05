let dataDb;
let dataLoaded = localStorage.getItem("loaded");

window.addEventListener("load", () => {
	const DBOpenRequest = window.indexedDB.open('sokuData', 3);

	DBOpenRequest.onerror = console.error;
	DBOpenRequest.onsuccess = (event) => {
		console.log("Database initiliazed");
		dataDb = DBOpenRequest.result;
		if (!dataLoaded)
			notInit.removeAttribute("hidden");
		else
			initEngine();
	};
	DBOpenRequest.onupgradeneeded = (event) => {
		dataDb = event.target.result;
		dataDb.onerror = console.error;
		try {
			dataDb.deleteObjectStore('sokuData');
		} catch (err) {}

		const objectStore = dataDb.createObjectStore('sokuData');

		objectStore.createIndex('data', 'data', { unique: false });
		objectStore.createIndex('compressed', 'compressed', { unique: false });
		console.log("Database created");
	};
	computeSize();
});

function loadFile(path)
{
	if (path.charAt(0) !== '/')
		path = '/' + path;

	if (path in cache)
		return cache[path];
	return new Promise((resolve, reject) => {
		dataDb.transaction('sokuData').objectStore('sokuData').get(path).onsuccess = event => {
			let cursor = event.target.result;

			if (!cursor)
				return reject(new Error("Cannot find " + path));

			let data = cursor.compressed ? pako.ungzip(cursor.data) : cursor.data;

			cache[path] = data;
			resolve(data);
		};
	});
}

async function loadFileUrl(path)
{
	let data = await loadFile(path);
	let blob = new Blob([data]);

	return URL.createObjectURL(blob);
}