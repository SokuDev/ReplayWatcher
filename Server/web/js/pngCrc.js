let pngCrcTable = [];

pngCrcTable.length = 256;
for (let n = 0; n < 256; n++) {
	let c = n;

	for (let k = 0; k < 8; k++) {
		if (c & 1)
			c = 0xEDB88320 ^ ((c >> 1) & 0x7FFFFFFF);
		else
			c = (c >> 1) & 0x7FFFFFFF;
	}
	pngCrcTable[n] = c;
}

function pngCrc32(stream, offset, length, crc = 0)
{
	let c = crc ^ 0xFFFFFFFF;

	for (let i = 0; i < length; i++)
		c = pngCrcTable[(c ^ stream[offset + i]) & 255] ^ ((c >> 8) & 0xFFFFFF);
	return c ^ 0xFFFFFFFF;
}