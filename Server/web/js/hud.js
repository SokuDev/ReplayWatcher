async function loadHudFile(root, path, idPrefix = "")
{
	const base = path.split('/').slice(0, -1).join('/');
	const decoder = new TextDecoder('shift-jis');
	const framedata = decoder.decode(await loadFile(path));
	const parser = new DOMParser();
	const doc = parser.parseFromString(framedata, "application/xml").children[0];

	for (let child of doc.children) {
		if (child.tagName === "number") {
			continue;
		}

		let subchild = child.children[0];
		let img = document.createElement('img');
		let div = document.createElement('div');
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const p = base + "/" + subchild.attributes.name.value.split('.')[0] + ".png";
		const url = await loadFileUrl(p);
		let dummy = document.createElement('img');

		div.style.position = 'absolute';
		div.style.left = (+child.attributes.xposition.value + +subchild.attributes.xposition.value) + "px";
		div.style.transformOrigin = -+subchild.attributes.xposition.value + 'px center';
		if (child.attributes.mirror.value === "1")
			div.style.transform = 'scaleX(-1)';
		div.style.top = (+child.attributes.yposition.value + +subchild.attributes.yposition.value) + "px";

		await new Promise((resolve, reject) => {
			dummy.onload = () => {
				try {
					canvas.width = +subchild.attributes.width.value;
					canvas.height = +subchild.attributes.height.value;
					ctx.drawImage(
						dummy,
						+subchild.attributes.xposition.value, +subchild.attributes.yposition.value,
						+subchild.attributes.width.value, +subchild.attributes.height.value,
						0, 0,
						+subchild.attributes.width.value, +subchild.attributes.height.value
					);
					img.src = canvas.toDataURL();
					img.width = subchild.attributes.width.value;
					img.height = subchild.attributes.height.value;
					resolve();
				} catch (err) {
					reject(err);
				}
			};
			dummy.onerror = e => {
				let err = new Error('Failed loading ' + p);

				err.event = e;
				reject(err);
			};
			dummy.src = url;
		});
		div.setAttribute('id', idPrefix + child.id);

		if (child.tagName === 'slidervert') {
			let redraw = () => {
				let h = +subchild.attributes.height.value - +subchild.attributes.height.value * div.getAttribute("value");
				let y = +subchild.attributes.yposition.value + h;

				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(
					dummy,
					+subchild.attributes.xposition.value, +subchild.attributes.height.value - h,
					+subchild.attributes.width.value, h,
					0, +subchild.attributes.height.value - h,
					+subchild.attributes.width.value, h
				);
				img.src = canvas.toDataURL();
			};
			const vertObserver = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					if (mutation.type != "attributes")
						return;
					if (div.getAttribute("oldValue") != div.getAttribute("value")) {
						div.setAttribute("oldValue", div.getAttribute("value"));
						redraw();
					}
				});
			});

			div.style.width = "0px";
			div.setAttribute("value", 0);
			div.setAttribute("oldValue", 0);
			redraw();
			vertObserver.observe(div, { attributes: true });
		} else if (child.tagName === 'sliderhorz') {
			let redraw = () => {
				let w = +subchild.attributes.width.value * div.getAttribute("value");
				let left = +subchild.attributes.width.value - w;

				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(
					dummy,
					+subchild.attributes.xposition.value + left, +subchild.attributes.yposition.value,
					w, +subchild.attributes.height.value,
					left, 0,
					w, +subchild.attributes.height.value
				);
				img.src = canvas.toDataURL();
			}
			const horizObserver = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					if (mutation.type != "attributes")
						return;
					if (div.getAttribute("oldValue") != div.getAttribute("value")) {
						div.setAttribute("oldValue", div.getAttribute("value"));
						redraw();
					}
				});
			});

			div.style.width = "0px";
			div.setAttribute("value", 0);
			div.setAttribute("oldValue", 0);
			redraw();
			horizObserver.observe(div, { attributes: true });
		}
		div.appendChild(img);
		root.appendChild(div);
	}
}
