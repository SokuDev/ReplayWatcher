import struct
import json
from turtledemo.forest import start


class ReplayReader:
	def __init__(self, data):
		self.data = data
		self.index = 0

	def readBool(self):
		index = self.index
		self.index += 1
		return struct.unpack("<?", self.data[index:index+1])[0]

	def readChar(self):
		index = self.index
		self.index += 1
		return struct.unpack("<b", self.data[index:index+1])[0]

	def readUChar(self):
		index = self.index
		self.index += 1
		return struct.unpack("<B", self.data[index:index+1])[0]

	def readShort(self):
		index = self.index
		self.index += 2
		return struct.unpack("<h", self.data[index:index+2])[0]

	def readUShort(self):
		index = self.index
		self.index += 2
		return struct.unpack("<H", self.data[index:index+2])[0]

	def readInt(self):
		index = self.index
		self.index += 4
		return struct.unpack("<i", self.data[index:index+4])[0]

	def readUInt(self):
		index = self.index
		self.index += 4
		return struct.unpack("<I", self.data[index:index+4])[0]

	def readFloat(self):
		index = self.index
		self.index += 4
		return struct.unpack("<f", self.data[index:index+4])[0]

	def isEnd(self):
		return self.index >= len(self.data)

	def readReplayPlayerHeaderV2(self):
		char = {"character": self.readUInt(), "palette": self.readUChar(), "deck": []}
		for i in range(self.readInt()):
			char["deck"].append(self.readUShort())
		return char

	def readReplayHeaderV2(self):
		return {
			"musicId": self.readUChar(),
			"stageId": self.readUChar(),
			"p1": self.readReplayPlayerHeaderV2(),
			"p2": self.readReplayPlayerHeaderV2()
		}

	def readVector2f(self):
		return {
			'x': self.readFloat(),
			'y': self.readFloat()
		}

	def readVector3f(self):
		return {
			'x': self.readFloat(),
			'y': self.readFloat(),
			'z': self.readFloat()
		}

	def readColor(self):
		value = self.readUInt()

		return {
			'value': value,
			'r': (value >> 16) & 0xFF,
			'g': (value >> 8)  & 0xFF,
			'b': (value >> 0)  & 0xFF,
			'a': (value >> 24) & 0xFF,
		}

	def readRenderInfo(self):
		return {
			"color": self.readColor(),
			"shader": self.readInt(),
			"shaderColor": self.readColor(),
			"scale": self.readVector2f(),
			"rotation": self.readVector3f()
		}

	def readReplayFrameObjectV2(self):
		return {
			"direction": self.readChar(),
			"posAbsolute": self.readBool(),
			"position": self.readVector2f(),
			"rotationCenter": self.readVector2f(),
			"renderInfo": self.readRenderInfo(),
			"actionId": self.readUShort(),
			"sequenceId": self.readUShort(),
			"poseId": self.readUShort(),
			"layer": self.readChar()
		}

	def readReplayCharacterDataV2(self):
		data = self.readReplayFrameObjectV2()
		data["comboDamage"] = self.readUShort()
		data["comboLimit"] = self.readUShort()
		data["hp"] = self.readUShort()
		data["redHp"] = self.readUShort()
		data["spirit"] = self.readUShort()
		data["maxSpirit"] = self.readUShort()
		data["timeWithBrokenOrb"] = self.readUShort()
		data["deckSize"] = self.readUChar()
		data["score"] = self.readUChar()
		data["hand"] = list(filter(lambda r: r != 255, [self.readUChar(), self.readUChar(), self.readUChar(), self.readUChar(), self.readUChar()]))
		data["cardGauge"] = self.readUShort()
		data["sounds"] = [None] * self.readUChar()
		data["objects"] = [None] * self.readUShort()
		return data

	def readReplayFrameV2(self):
		start = self.index
		frame = {
			"p1": self.readReplayCharacterDataV2(),
			"p2": self.readReplayCharacterDataV2(),
			"activeWeather": self.readUChar(),
			"displayedWeather": self.readUChar(),
			"weatherTimer": self.readUShort(),
			"sounds": [None] * self.readUChar(),
			"camera": {
				"translate": self.readVector2f(),
				"bgTranslate": self.readVector2f(),
				"scale": self.readFloat()
			},
			"effects": [None] * self.readUShort(),
			"infoEffects": [None] * self.readUShort()
		}
		for i in range(len(frame["p1"]["objects"])):
			frame["p1"]["objects"][i] = self.readReplayFrameObjectV2()
		for i in range(len(frame["p2"]["objects"])):
			frame["p2"]["objects"][i] = self.readReplayFrameObjectV2()
		for i in range(len(frame["effects"])):
			frame["effects"][i] = self.readReplayFrameObjectV2()
		for i in range(len(frame["infoEffects"])):
			frame["infoEffects"][i] = self.readReplayFrameObjectV2()
		for i in range(len(frame["sounds"])):
			frame["sounds"][i] = self.readUChar()
		for i in range(len(frame["p1"]["sounds"])):
			frame["p1"]["sounds"][i] = self.readUChar()
		for i in range(len(frame["p2"]["sounds"])):
			frame["p2"]["sounds"][i] = self.readUChar()
		print("frame start offset", start, "read", self.index - start, "bytes ({}:{}:{}, {}:{}, {}:{})".format(len(frame["effects"]), len(frame["infoEffects"]), len(frame["sounds"]), len(frame["p1"]["objects"]), len(frame["p1"]["sounds"]), len(frame["p2"]["objects"]), len(frame["p2"]["sounds"])))
		return frame

	def readReplayV2(self):
		replay = self.readReplayHeaderV2()
		replay["frames"] = []
		while not self.isEnd():
			try:
				print("Reading frame", len(replay["frames"]), end=" ")
				replay["frames"].append(self.readReplayFrameV2())
			except:
				raise
		return replay

def loadReplay(data):
	return ReplayReader(data).readReplayV2()

if __name__ == '__main__':
	import sys
	loadReplay(open(sys.argv[1], "rb").read())