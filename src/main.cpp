#include <SokuLib.hpp>
#include <windows.h>
#include <cstdio>
#include <process.h>
#include <shlobj.h>
#include <shlwapi.h>
#include <sys/stat.h>
#include <fstream>

#pragma pack(push, 1)
struct Object {
	char direction;
	bool posAbsolute;
	SokuLib::Vector2f pos;
	SokuLib::Vector2f rotationCenter;
	SokuLib::RenderInfo renderInfo;
	unsigned short actionId;
	unsigned short sequenceId;
	unsigned short poseId;
	char layer;
};

struct CharacterState {
	char direction;
	bool posAbsolute;
	SokuLib::Vector2f pos;
	SokuLib::Vector2f rotationCenter;
	SokuLib::RenderInfo renderInfo;
	unsigned short actionId;
	unsigned short sequenceId;
	unsigned short poseId;
	char layer;
	unsigned short comboDamage;
	unsigned short comboLimit;
	unsigned short hp;
	unsigned short redHp;
	unsigned short spirit;
	unsigned short maxSpirit;
	unsigned short brokeOrbTimer;
	unsigned char cardsLeft;
	unsigned char score;
	unsigned char hand[5];
	unsigned short cardGauge;
	unsigned char soundCount;
	unsigned short objectCount;
};

struct GameFramePacket {
	CharacterState leftState;
	CharacterState rightState;
	SokuLib::Weather displayedWeather;
	unsigned short weatherTimer;
	unsigned char soundCount;
	SokuLib::Vector2f cameraTranslate;
	SokuLib::Vector2f cameraBGTranslate;
	float cameraScale;
	unsigned short effectCount;
	unsigned short infoEffectCount;
	Object objects[0];
};
#pragma pack(pop)

static void fillState(const SokuLib::v2::Player &source, size_t objSize, CharacterState &destination, size_t soundCount)
{
	destination.renderInfo = source.renderInfos;
	destination.direction = source.direction;
	destination.actionId = source.frameState.actionId;
	destination.sequenceId = source.frameState.sequenceId;
	destination.poseId = source.frameState.poseId;
	destination.comboDamage = source.comboDamage;
	destination.comboLimit = source.comboLimit;
	destination.hp = source.hp;
	destination.pos = source.position;
	destination.rotationCenter = source.center;
	destination.redHp = source.redHP;
	destination.spirit = source.currentSpirit;
	destination.maxSpirit = source.maxSpirit;
	destination.brokeOrbTimer = source.timeWithBrokenOrb;
	destination.cardsLeft = source.deckInfo.queue.size();
	destination.score = source.score;
	destination.layer = source.teamId == SokuLib::v2::firstPlayerRendered ? 1 : 0;
	destination.posAbsolute = false;
	memset(destination.hand, 0xFF, sizeof(destination.hand));
	if (SokuLib::activeWeather != SokuLib::WEATHER_MOUNTAIN_VAPOR)
		for (int i = 0; i < source.handInfo.hand.size(); i++)
			destination.hand[i] = source.handInfo.hand[i].id;
	else
		for (int i = 0; i < 5; i++)
			destination.hand[i] = 99;
	destination.cardGauge = (SokuLib::activeWeather != SokuLib::WEATHER_MOUNTAIN_VAPOR ? source.handInfo.cardGauge : -1);
	destination.soundCount = soundCount;
	destination.objectCount = objSize;
}

template<typename T>
static void fillState(const T &object, Object &destination)
{
	destination.renderInfo = object.renderInfos;
	destination.posAbsolute = object.isGui;
	destination.pos = object.position;
	destination.rotationCenter = object.center;
	destination.direction = object.direction;
	destination.actionId = object.frameState.actionId;
	destination.sequenceId = object.frameState.sequenceId;
	destination.poseId = object.frameState.poseId;
	if (object.layer < 0)
		destination.layer = object.layer - 1;
	else
		destination.layer = object.layer + 1;
}

char replay_path_pointer_fake[MAX_PATH];
wchar_t *replay_path_pointer_actual;

HANDLE(__stdcall *actual_CreateFileA)
	(LPCSTR lpFileName, DWORD dwDesiredAccess, DWORD dwShareMode, LPSECURITY_ATTRIBUTES lpSecurityAttributes, DWORD dwCreationDisposition,
	 DWORD dwFlagsAndAttributes, HANDLE hTemplateFile)
= CreateFileA;

HANDLE __stdcall my_CreateFileA(char *lpFileName, DWORD dwDesiredAccess, DWORD dwShareMode, LPSECURITY_ATTRIBUTES lpSecurityAttributes,
				DWORD dwCreationDisposition, DWORD dwFlagsAndAttributes, HANDLE hTemplateFile) {
	if (lpFileName && !strcmp(lpFileName, replay_path_pointer_fake)) {
		return CreateFileW(
			replay_path_pointer_actual, dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwCreationDisposition, dwFlagsAndAttributes, hTemplateFile);
	}
	return actual_CreateFileA(lpFileName, dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwCreationDisposition, dwFlagsAndAttributes, hTemplateFile);
}

wchar_t **wargv;

static int (SokuLib::Logo::*s_origCLogo_OnProcess)();
static int (SokuLib::Title::*s_origCTitle_OnProcess)();
static int (SokuLib::Battle::*s_origCBattle_OnProcess)();
static int (SokuLib::Loading::*s_origCLoading_OnProcess)();

static wchar_t next_file[MAX_PATH];
static wchar_t next_file2[MAX_PATH];
static HANDLE dir_it = INVALID_HANDLE_VALUE;
static bool dir_last;

static bool s_autoShutdown;
static bool s_muteMusic;
static std::ofstream stream;
static std::array<std::vector<unsigned char>, 3> soundsPlayed;

void initCurrentFile()
{
	if (stream.is_open())
		return;
	stream.open(next_file2, std::fstream::binary);
	printf("Open %S: %s\n", next_file2, strerror(errno));
	if (!stream) {
		MessageBoxW(SokuLib::window, (L"Cannot open " + std::wstring(next_file2)).c_str(), L"Error", MB_ICONERROR);
		abort();
	}
	printf("Chr %i vs %i, decks %u vs %u\n", SokuLib::gameParams.leftPlayerInfo.character, SokuLib::gameParams.rightPlayerInfo.character, SokuLib::gameParams.leftPlayerInfo.effectiveDeck.size(), SokuLib::gameParams.rightPlayerInfo.effectiveDeck.size());
#define writeToStreamSize(s, size) stream.write(reinterpret_cast<char *>(s), size)
#define writeToStream(s) writeToStreamSize(&s, sizeof(s))
	writeToStream(SokuLib::gameParams.musicId);
	writeToStream(SokuLib::gameParams.stageId);
	writeToStream(SokuLib::leftPlayerInfo.character);
	writeToStream(SokuLib::leftPlayerInfo.palette);
	writeToStream(SokuLib::leftPlayerInfo.effectiveDeck.m_size);
	for (unsigned short i : SokuLib::leftPlayerInfo.effectiveDeck)
		writeToStream(i);
	writeToStream(SokuLib::rightPlayerInfo.character);
	writeToStream(SokuLib::rightPlayerInfo.palette);
	writeToStream(SokuLib::rightPlayerInfo.effectiveDeck.m_size);
	for (unsigned short i : SokuLib::rightPlayerInfo.effectiveDeck)
		writeToStream(i);
}

int loadNextReplay()
{
	int ret = 0;

	if (!next_file[0])
		return 0;
	replay_path_pointer_actual = next_file;
	WideCharToMultiByte(CP_ACP, 0, replay_path_pointer_actual, -1, replay_path_pointer_fake, MAX_PATH, NULL, NULL);
	reinterpret_cast<void (*)(int)>(0x43e200)(0);
	reinterpret_cast<void (*)(int)>(0x43e230)(0);
	if (SokuLib::inputMgr.readReplay(replay_path_pointer_fake)) {
		// 入力があったように見せかける。END
		*(BYTE *) ((DWORD)&SokuLib::inputMgrs + 0x74) = 0xFF;
		// リプモードにチェンジ
		SokuLib::setBattleMode(SokuLib::BATTLE_MODE_VSPLAYER, SokuLib::BATTLE_SUBMODE_REPLAY);
		ret = SokuLib::SCENE_LOADING;
	} else {
		printf("Failed loading %S\n", next_file);
		if (dir_last || dir_it == INVALID_HANDLE_VALUE)
			ExitProcess(1);
	}
	if (dir_it != INVALID_HANDLE_VALUE) {
		WIN32_FIND_DATAW find_data;
		if (FindNextFileW(dir_it, &find_data)) {
			StrCpyW(next_file2, next_file);
			*wcsrchr(next_file2, L'.') = 0;
			StrCatW(next_file2, L".re2");
			StrCpyW(next_file, wargv[1]);
			StrCatW(next_file, L"\\");
			StrCatW(next_file, find_data.cFileName);
		} else {
			dir_last = true;
			StrCpyW(next_file2, next_file);
			*wcsrchr(next_file2, L'.') = 0;
			StrCatW(next_file2, L".re2");
		}
	}
	if (ret)
		return ret;
	return 0;
}

int __fastcall CLogo_OnProcess(SokuLib::Logo *This) {
	int ret = loadNextReplay();

	if (ret)
		return ret;
	return (This->*s_origCLogo_OnProcess)();
}

int __fastcall CTitle_OnProcess(SokuLib::Title *This) {
	if (dir_last)
		return -1;

	int ret = loadNextReplay();

	if (ret)
		return ret;
	return (This->*s_origCTitle_OnProcess)();
}

int __fastcall CLoading_OnProcess(SokuLib::Loading *This)
{
	initCurrentFile();
	return (This->*s_origCLoading_OnProcess)();
}

int __fastcall CBattle_OnProcess(SokuLib::Battle *This) {
	int ret = SokuLib::SCENE_BATTLE;
	size_t frame = 0;
	auto &battle = SokuLib::getBattleMgr();

	soundsPlayed[0].clear();
	soundsPlayed[1].clear();
	soundsPlayed[2].clear();
	while (ret == SokuLib::SCENE_BATTLE) {
		auto &p1 = *(SokuLib::v2::Player *)&battle.leftCharacterManager;
		auto &p2 = *(SokuLib::v2::Player *)&battle.rightCharacterManager;
		const auto &p1l = p1.objectList->getList();
		const auto &p2l = p2.objectList->getList();
		auto nbObjects = p1l.size() + p2l.size() + SokuLib::v2::effectEffectManager->effects.size() + SokuLib::v2::InfoManager::instance->effects.effects.size();
		size_t allocSize = sizeof(GameFramePacket) +
			nbObjects * sizeof(Object) +
			soundsPlayed[0].size() + soundsPlayed[1].size() + soundsPlayed[2].size();
		char *buffer = new char[allocSize];
		auto packet = reinterpret_cast<GameFramePacket *>(buffer);
		int current = 0;

		if (p2.frameState.actionId >= SokuLib::ACTION_5A) {
			if (p1.frameState.actionId < SokuLib::ACTION_5A)
				SokuLib::v2::firstPlayerRendered = 1;
		} else if (p1.frameState.actionId >= SokuLib::ACTION_5A)
			SokuLib::v2::firstPlayerRendered = 0;
		fillState(p1, p1l.size(), packet->leftState, soundsPlayed[1].size());
		fillState(p2, p2l.size(), packet->rightState, soundsPlayed[2].size());
		packet->weatherTimer = SokuLib::weatherCounter;
		packet->displayedWeather = SokuLib::displayedWeather;
		packet->soundCount = soundsPlayed[0].size();
		packet->cameraTranslate = SokuLib::camera.translate;
		packet->cameraBGTranslate = SokuLib::camera.backgroundTranslate;
		packet->cameraScale = SokuLib::camera.scale;
		packet->effectCount = SokuLib::v2::effectEffectManager->effects.size();
		packet->infoEffectCount = SokuLib::v2::InfoManager::instance->effects.effects.size();
		for (auto obj : p1l)
			fillState(*obj, packet->objects[current++]);
		for (auto obj : p2l)
			fillState(*obj, packet->objects[current++]);
		for (auto obj : SokuLib::v2::effectEffectManager->effects)
			fillState(*obj, packet->objects[current++]);
		for (auto obj : SokuLib::v2::InfoManager::instance->effects.effects)
			fillState(*obj, packet->objects[current++]);

		auto ptr = reinterpret_cast<unsigned char *>(&packet->objects[current++]);

		for (auto &v : soundsPlayed)
			for (auto c : v) {
				*ptr = c;
				ptr++;
			}
		if ((int)ptr - (int)buffer != allocSize) {
			printf("Wrote %i bytes for frame %i but expected to write %i\n", allocSize, frame, (int)ptr - (int)buffer);
			ExitProcess(1);
		}
		stream.write(buffer, allocSize);
		delete[] buffer;
		soundsPlayed[0].clear();
		soundsPlayed[1].clear();
		soundsPlayed[2].clear();
		frame++;
		ret = (This->*s_origCBattle_OnProcess)();
	}
	stream.close();
	if (dir_last || dir_it == INVALID_HANDLE_VALUE)
		return -1;
	else
		return SokuLib::SCENE_TITLE;
}

// 設定ロード
void LoadSettings(LPCSTR profilePath) {
	// 自動シャットダウン
	s_autoShutdown = true;
	s_muteMusic = true;
}

void onSoundPlayed()
{
	int sound;

	__asm MOV [sound], EAX;
	soundsPlayed[0].push_back(sound);
}

void onPlayerSoundPlayed(SokuLib::v2::Player *This, int sound)
{
	soundsPlayed[This->teamId + 1].push_back(sound);
}

void __declspec(naked) onPlayerSoundPlayed_hook()
{
	__asm {
		PUSH EAX
		PUSH ECX
		CALL onPlayerSoundPlayed
		ADD ESP, 8
		RET
	}
}

HWND __stdcall noWindow(DWORD dwExStyle, LPCSTR lpClassName, LPCSTR lpWindowName, DWORD dwStyle, int X, int Y, int nWidth, int nHeight, HWND hWndParent, HMENU hMenu, HINSTANCE hInstance, LPVOID lpParam)
{
	return nullptr;
}

extern "C" __declspec(dllexport) bool CheckVersion(const BYTE hash[16]) {
	return true;
}

extern "C" __declspec(dllexport) bool Initialize(HMODULE hMyModule, HMODULE hParentModule) {
	DWORD old;
	int argc;
	struct _stat64 s;

	wargv = CommandLineToArgvW(GetCommandLineW(), &argc);

	if (argc != 2)
		return true;
	if (_wstat64(wargv[1], &s))
		return true;
	if (s.st_mode & S_IFDIR) {
		WIN32_FIND_DATAW find_data;
		wchar_t buf[MAX_PATH];
		StrCpyW(buf, wargv[1]);
		StrCatW(buf, L"\\*.rep");
		dir_it = FindFirstFileW(buf, &find_data);
		if (dir_it == INVALID_HANDLE_VALUE) {
			return true;
		}
		StrCpyW(next_file, wargv[1]);
		StrCatW(next_file, L"\\");
		StrCatW(next_file, find_data.cFileName);
	} else if (StrStrIW(wargv[1], L".rep")) {
		StrCpyW(next_file, wargv[1]);
	} else {
		return true;
	}
	StrCpyW(next_file2, next_file);
	*wcsrchr(next_file2, L'.') = 0;
	StrCatW(next_file2, L".re2");

	char profilePath[1024 + MAX_PATH];

	GetModuleFileName(hMyModule, profilePath, 1024);
	PathRemoveFileSpec(profilePath);
	PathAppend(profilePath, "ReplayExport.ini");
	LoadSettings(profilePath);

	::VirtualProtect((PVOID)RDATA_SECTION_OFFSET, RDATA_SECTION_SIZE, PAGE_EXECUTE_WRITECOPY, &old);
	s_origCLogo_OnProcess = SokuLib::union_cast<int (SokuLib::Logo::*)()>(TamperDword(&SokuLib::VTable_Logo.onProcess, CLogo_OnProcess));
	s_origCTitle_OnProcess = SokuLib::union_cast<int (SokuLib::Title::*)()>(TamperDword(&SokuLib::VTable_Title.onProcess, CTitle_OnProcess));
	s_origCBattle_OnProcess = SokuLib::union_cast<int (SokuLib::Battle::*)()>(TamperDword(&SokuLib::VTable_Battle.onProcess, CBattle_OnProcess));
	s_origCLoading_OnProcess = SokuLib::union_cast<int (SokuLib::Loading::*)()>(TamperDword(&SokuLib::VTable_Loading.onProcess, CLoading_OnProcess));
	//SokuLib::TamperDword(&SokuLib::DLL::user32.CreateWindowExA, noWindow);
	::VirtualProtect((PVOID)RDATA_SECTION_OFFSET, RDATA_SECTION_SIZE, old, &old);

	// allow running multiple instances until we can switch a
	// running game to a replay
	VirtualProtect((PVOID)TEXT_SECTION_OFFSET, TEXT_SECTION_SIZE, PAGE_EXECUTE_WRITECOPY, &old);
	*(char *)0x7FB5C8 = 0xB8;
	VirtualProtect((PVOID)TEXT_SECTION_OFFSET, TEXT_SECTION_SIZE, old, &old);
	new SokuLib::Trampoline(0x43E1E9, onSoundPlayed, 7);
	new SokuLib::Trampoline(0x46498B, onPlayerSoundPlayed_hook, 6);

	::FlushInstructionCache(GetCurrentProcess(), NULL, 0);
	return true;
}

extern "C" int APIENTRY DllMain(HMODULE hModule, DWORD fdwReason, LPVOID lpReserved) {
	return TRUE;
}
