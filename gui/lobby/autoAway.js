
/**
 * Configuration auto away.
 */
 var g_AutoAway = {
	"timeMinutes": +Engine.ConfigDB_GetValue("user", "lobby.autoawaytime"),
	"time": false,
	"background": false,
	"timeInBackground": false,
	"timerHandler": 0,
	"applied": false
};


/**
 * Different states for presence and auto-away feature.
 * Called as function due to configurable g_AutoAway.timeMinutes.
 */
 var g_AutoAwayStates = [
	{
		"name": "available",
		"desc": () => translate("Available"),
		"func": () => setPlayerPresence("available", false, false, false)
	},
	{
		"name": "away",
		"desc": () => translate("Away"),
		"func": () => setPlayerPresence("away", false, false, false)
	},
	{
		"name": "available_awaytime",
		"desc": () => sprintf(translate("Away after %(minutes)s %(minute)s"),
		{
			"minutes": g_AutoAway.timeMinutes,
			"minute": translatePlural("minute", "minutes", g_AutoAway.timeMinutes)
		}),
		"func": () => setPlayerPresence("available", true, false, false)
	}
];


/**
 * Apply lobby presence for player.
 * 500ms timeouts between multiple presence changes. After timeout applies latest presence change.
 * 
 * @param {string} presence - Presence string for user. ("available", "away", "busy")
 * @param {bool} awayTime - Optional auto away when time g_AutoAway.timeMinutes inactive.
 * @param {bool} awayBackground - Optional auto away when window looses focus.
 * @param {bool} awayTimeInBackground - Optional auto away when time inactive while window is unfocused.
 */
 function setPlayerPresence(presence, awayTime, awayBackground, awayTimeInBackground)
 {
	 g_AutoAway.time = awayTime;
	 g_AutoAway.background = awayBackground;
	 g_AutoAway.timeInBackground = awayTimeInBackground;
	 resetAutoAway();
 
	 // When timeout, store presence.
	 if (g_Presence.timer)
		 g_Presence.setNew = presence;
	 else
	 {
		 applyPlayerPresence(presence);
		 g_Presence.setNew = "";
		 // Start timeout for next presence apply.
		 g_Presence.timer = setTimeout(() => {
			 if (g_Presence.setNew)
				 applyPlayerPresence(g_Presence.setNew);
			 g_Presence.timer = 0;
			 }, g_Presence.timeoutMilliSeconds);
	 }
 }
 
 function handleInputAfterGui(ev)
 {
	 // Wait for window focus to reset auto away.
	 if (g_WindowFocus) // ev.type != "mousemotion" && 
		 resetAutoAway();
 
	 return false;
 }
 
 function setAutoAway()
 {
	 Engine.LobbySetPlayerPresence("away");
	 g_AutoAway.applied = true;
 }
 
 function resetAutoAway()
 {
	 if (g_AutoAway.applied)
	 {
		 Engine.LobbySetPlayerPresence("available");
		 g_AutoAway.applied = false;
	 }
 
	 if (g_AutoAway.timerHandler)
		 clearTimeout(g_AutoAway.timerHandler);
 
	 if (g_AutoAway.time && (!g_AutoAway.timeInBackground || !g_WindowFocus))
		 g_AutoAway.timerHandler = setTimeout(setAutoAway, 1000 * 60 * g_AutoAway.timeMinutes);
 
	 if (g_AutoAway.background && !g_AutoAway.timeInBackground && !g_WindowFocus)
		 setAutoAway();
 }
 
 

/**
 * List of more buttons bar below the chat input.
 */
 var g_MoreButtonsBarFuncs = {
	"Replays": () => Engine.PushGuiPage("page_replaymenu.xml", { "ingame": g_InGame, "dialog": true, "callback": "startReplay" }),
	"Last Summary": { "func": showLastGameSummary, "tooltip": "Show complete last " + setStringTags("summary", { "color": "yellow" }) + " (if not disconnected during game)." },
	"Civilizations": { "func": openCivInfo, "tooltip": colorizeHotkey("Press %(hotkey)s to open structure tree.", "structree") },
	"Options": { "func": openGameOptions, "tooltip": colorizeHotkey("Press %(hotkey)s to open options.", "options") }
};

function openCivInfo()
{
	Engine.PushGuiPage(g_CivInfo.page, { "civ": g_CivInfo.code, "callback": "storeCivInfoPage" });
}

function openGameOptions()
{
	Engine.PushGuiPage("page_options.xml", {
		"selectedCategory": g_OptionsPage || "Lobby",
		"callback": "initUserConfigurables"
	})
}


var g_WindowFocus = true;

var g_Presence = {
	"timer": 0,
	"setNew": "",
	"timeoutMilliSeconds": 500
};


 // additional button handlers
function showLastGameSummary()
{
	let replays = Engine.GetReplays(false).filter(replay =>
		replay.attribs.settings.PlayerData.filter(player => player && !player.AI).length > 1 ).sort((a, b) =>
			b.attribs.timestamp - a.attribs.timestamp
		);

	let simData = {};
	if (replays)
		for (let i in replays)
		{
			simData = Engine.GetReplayMetadata(replays[i].directory);
			if (simData)
				break;
		}

	if (!replays || !simData)
	{
		messageBox(500, 200, translate("No summary data available."), translate("Error"));
		return;
	}

	Engine.PushGuiPage("page_summary.xml", {
		"sim": simData,
		"gui": {
			"replayDirectory": replays[0].directory,
			"isInLobby": true,
			"ingame": g_InGame,
			"dialog": true },
		"callback": "startReplay"
	});
}


function storeCivInfoPage(data)
{
	g_CivInfo.code = data.civ;
	g_CivInfo.page = data.page;
}



/**
 * Commands that can be entered by clients via chat input.
 * A handler returns true if the user input should be sent as a chat message.
 */
 var g_ChatCommands = {
	"away": {
		"description": translate("Set your state to 'Away'."),
		"handler": args => {
			Engine.LobbySetPlayerPresence("away");
			let presenceDropdown = Engine.GetGUIObjectByName("presenceDropdown");
			g_SavedAwayOption = presenceDropdown.selected;
			presenceDropdown.selected = g_AutoAwayStates.findIndex(opt => opt.name == "away");
			return false;
		}
	},
	"back": {
		"description": translate("Set your state to 'Online'."),
		"handler": args => {
			Engine.LobbySetPlayerPresence("available");
			Engine.GetGUIObjectByName("presenceDropdown").selected = g_SavedAwayOption;
			return false;
		}
	},
	"kick": {
		"description": translate("Kick a specified user from the lobby. Usage: /kick nick reason"),
		"handler": args => {
			Engine.LobbyKick(args[0] || "", args[1] || "");
			return false;
		},
		"moderatorOnly": true
	},
	"ban": {
		"description": translate("Ban a specified user from the lobby. Usage: /ban nick reason"),
		"handler": args => {
			Engine.LobbyBan(args[0] || "", args[1] || "");
			return false;
		},
		"moderatorOnly": true
	},
	"help": {
		"description": translate("Show this help."),
		"handler": args => {
			let isModerator = Engine.LobbyGetPlayerRole(g_Username) == "moderator";
			let text = translate("Chat commands:");
			for (let command in g_ChatCommands)
				if (!g_ChatCommands[command].moderatorOnly || isModerator)
					// Translation: Chat command help format
					text += "\n" + sprintf(translate("%(command)s - %(description)s"), {
						"command": coloredText(command, g_ChatCommandColor),
						"description": g_ChatCommands[command].description
					});

			addChatMessage({
				"from": "system",
				"text": text
			});
			return false;
		}
	},

	"me": {
		"description": translate("Send a chat message about yourself. Example: /me goes swimming."),
		"handler": args => true
	},
	"say": {
		"description": translate("Send text as a chat message (even if it starts with slash). Example: /say /help is a great command."),
		"handler": args => true
	},
	"clear": {
		"description": translate("Clear all chat scrollback."),
		"handler": args => {
			clearChatMessages();
			return false;
		}
	},
	"quit": {
		"description": translate("Return to the main menu."),
		"handler": args => {
			leaveLobby();
			return false;
		}
	}
};