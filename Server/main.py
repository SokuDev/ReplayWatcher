import os.path
import subprocess
import tempfile
from time import time
from zipfile import ZipFile, ZIP_DEFLATED
from flask import Flask, jsonify, abort, send_file, request, render_template, redirect, url_for, flash, Response, send_from_directory
import hashlib

replay_zip = "replays.zip"
app = Flask(__name__)
game_path="../game"
with ZipFile(replay_zip, mode="a", compression=ZIP_DEFLATED, allowZip64=True, compresslevel=9):
	pass
cleanup_time = 24 * 3600
re2_folder = '/tmp'


@app.route('/')
def index():
	return redirect('/web/html/index.html', 301)


@app.route("/web/<path:path>")
def serve_static_file(path):
	res = send_from_directory('web', path)
	if not path.endswith(".js") and not path.endswith(".css") and not path.endswith(".html"):
		res.headers.update({ 'Cache-Control': 'public, max-age=3600, immutable' })
	return res


def cleanup_replays():
	now = time()
	for file in os.listdir(re2_folder):
		if not file.endswith('.re2'):
			continue
		stat = os.stat(f'{re2_folder}/{file}')
		if now - stat.st_atime > cleanup_time:
			# os.unlink(f'{re2_folder}/{file}')
			print(f'Removed {re2_folder}/{file}')


def convert_replay_re2(replay_hash):
	print("Converting", replay_hash)
	process = subprocess.run(["wine", game_path + "/th123.exe", f'{re2_folder}/{replay_hash}.rep'], stderr=subprocess.DEVNULL, executable='/usr/bin/wine')
	if process.returncode != 0:
		return False
	subprocess.run(["gzip", "--best", f'{re2_folder}/{replay_hash}.re2'], stderr=subprocess.DEVNULL, executable='/usr/bin/gzip')
	return True


def add_to_zip(path, replay_hash):
	with ZipFile(replay_zip, mode="a", compression=ZIP_DEFLATED, allowZip64=True, compresslevel=9) as zipHandle:
		with zipHandle.open(replay_hash, "w") as fileHandle, open(path, "rb") as fd:
			fileHandle.write(fd.read())

def is_in_zip(replay_hash):
	with ZipFile(replay_zip, mode="r") as zipHandle:
		return replay_hash in zipHandle.namelist()


def extract_from_zip(replay_hash):
	with ZipFile(replay_zip, mode="r") as zipHandle:
		with zipHandle.open(replay_hash, "r") as fileHandle, open(f'{re2_folder}/{replay_hash}.rep', "wb") as fd:
			fd.write(fileHandle.read())


@app.route("/convert_replay", methods=['POST'])
def convert_replay():
	if 'file' not in request.files:
		return abort(400)
	name = tempfile.mktemp() + ".rep"
	request.files['file'].save(name)
	with open(name, "rb") as file:
		sha = hashlib.sha256(usedforsecurity=False)
		while True:
			data = file.read(4096)
			if not data:
				break
			sha.update(data)
		v = sha.hexdigest()
	if os.path.exists(f'{re2_folder}/{v}.re2.gz'):
		os.unlink(name)
	else:
		new_name = f'{re2_folder}/{v}.rep'
		os.rename(name, new_name)
		result = convert_replay_re2(v)
		if not result:
			os.unlink(new_name)
			return abort(500)
		add_to_zip(new_name, v)
		os.unlink(new_name)
	cleanup_replays()
	res = send_file(f'{re2_folder}/{v}.re2.gz')
	res.headers.add("X-Hash", v)
	return res


@app.route("/converted_replay/<replay>")
def get_converted_replay(replay):
	replay = replay.lower()
	if os.path.exists(f'{re2_folder}/{replay}.re2.gz'):
		cleanup_replays()
		return send_file(f'{re2_folder}/{replay}.re2.gz')
	if not is_in_zip(replay):
		return abort(404)
	extract_from_zip(replay)
	result = convert_replay_re2(replay)
	os.unlink(f'{re2_folder}/{replay}.rep')
	if not result:
		return abort(500)
	cleanup_replays()
	return send_file(f'{re2_folder}/{replay}.re2.gz')


if __name__ == '__main__':
	app.run('127.0.0.1', 10800, True)
