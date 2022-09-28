/**
 * Available backgrounds, added by the files in backgrounds/.
 */
var g_BackgroundLayerData = [];
var currentSubmenuType; // contains submenu type
var MARGIN = 4; // menu border size
var g_ShowSplashScreens;

/**
 * Available backdrops
 */
var g_BackgroundLayerData = [];

/**
 * Chosen backdrop
 */
var g_BackgroundLayerset;

var g_T0 = Date.now();
var g_LastTickTime = Date.now();
const g_EngineInfo = Engine.GetEngineInfo();
var oneNotFound = false;

/**
 * 
 * @param {*} forceOverwrite - On version change overwrite fgod settings.
 */
 function setDefaultUserConfs(forceOverwrite)
 {
	 let values = {
		 "hotkey": { 
			 close: "Shift+Escape",
			 fgodupdate: "Alt+U",
			 fgodwebsite: "Alt+W",
			 fgodmanual: "Alt+Shift+F",
			 options: "Alt+O",
			 focustextinput: "tab",
			 "lobby.newgame": "Alt+N",
			 "restartGame": "Alt+Shift+E",
			 "session.allyequalizeresources": "Alt+Shift+E",
			 "session.devcommands.toggle": "Alt+Shift+D",
			 "session.gui.diplomacy.toggle": "Alt+D",
			 "session.gui.objectives.toggle": "Alt+Shift+O",
			 "session.gui.barter.toggle": "Alt+B",
			 "session.gui.gamespeed.toggle": "Alt+Shift+G",
			 "session.messagemenu": "Ctrl+Y",
			 "session.messagemenu_en": "Ctrl+Z",
			 "session.selectplayer.prev": "Alt+Q",
			 "session.selectplayer.1": "Alt+1",
			 "session.selectplayer.2": "Alt+2",
			 "session.selectplayer.3": "Alt+3",
			 "session.selectplayer.4": "Alt+4",
			 "session.selectplayer.5": "Alt+5",
			 "session.selectplayer.6": "Alt+6",
			 "session.selectplayer.7": "Alt+7",
			 "session.selectplayer.8": "Alt+8",
			 "session.selectplayer.0": "Alt+0" },
		 "session": {
			 sendresonresign: "true",
			 showstats: "true",
			 showobservers: "true"
		 },
		 "gui": {
		 startintolobby: "false"
 
		 },"gui.lobby": {
		 morebuttonsbar: "visible"
			 
		 },"load": {
		 gamessort: "date:-1,mapName:1,mapType:1,description:1"
 
		 },"lobby": {
		 autologin: "true",
		 highlightbuddies: "true",       
		 autoawaytime: "5"               ,   
		 presenceselection: "available_awaytime" ,
		 secureauth: "false",
		 history: "20"
 
		 },"lobby.statuscolors.games": {
		 init: "0 219 0",
		 waiting: "255 127 0",
		 running: "219 0 0",
		 incompatible: "128 128 128"
 
		 },"lobby.statuscolors.games.buddy": {
		 init: "80 219 219",
		 waiting: "255 127 255",
		 running: "230 80 230",
		 incompatible: "160 160 160"
 
		 },"lobby.statuscolors.players": {
		 available: "0 219 0",
		 away: "229 76 13",
		 playing: "200 0 0",
		 offline: "0 0 0",
		 unknown: "178 178 178"
 
		 },"lobby.statuscolors.players.buddy": {
		 available: "102 226 255",
		 away: "249 156 249",
		 playing: "230 80 230",
		 offline: "44 44 88",
		 unknown: "89 89 178"
		 },"lobby.userplayer": {
		 color: "102 103 255"
 
		 },"lobby.sort": {
		 players: "buddy:-1,status:1,name:1,rating:-1",
		 games: "buddy:-1,name:1,mapType:1,mapSize:1,gameRating:-1,mapName:1,nPlayers:-1"
 
		 },"replay": {
		 sort: "months:-1,players:1,mapName:1,mapSize:1,popCapacity:1,duration:1"
		 }
	 };
	 
	 Object.keys(values).forEach(key => {
		 Object.keys(values[key]).forEach(key2 => {
			 if (forceOverwrite || !Engine.ConfigDB_GetValue("user", key + "." + key2))
			 {
				 // warn("Setting default value for user config " + key + "." + key2 + " = " + uneval(values[key][key2]));
				 Engine.ConfigDB_CreateAndWriteValueToFile(key + "." + key2, values[key][key2]);
				 oneNotFound = true;
			 }
		 })
	 });
 
 }

 
/**
 * This is the handler that coordinates all other handlers.
 */
var g_MainMenuPage;

function init(data, hotloadData)
{
	g_MainMenuPage =
		new MainMenuPage(
			data,
			hotloadData,
			g_MainMenuItems,
			g_BackgroundLayerData,
			g_ProjectInformation,
			g_CommunityButtons);
}

function getHotloadData()
{
	return g_MainMenuPage.getHotloadData();
}
