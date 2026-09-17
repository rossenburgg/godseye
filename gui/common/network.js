/**
 * Number of milliseconds to display network warnings.
 */
var g_NetworkWarningTimeout = 3000;

/**
 * Currently displayed network warnings. At most one message per user.
 */
var g_NetworkWarnings = {};

/**
 * Message-types to be displayed.
 */
var g_NetworkWarningTexts = {

	"server-timeout": (msg, username) =>
		sprintf(translate("Losing connection to server (%(seconds)ss)"), {
			"seconds": Math.ceil(msg.lastReceivedTime / 1000)
		}),

	"client-timeout": (msg, username) =>
		sprintf(translate("%(player)s losing connection (%(seconds)ss)"), {
			"player": username,
			"seconds": Math.ceil(msg.lastReceivedTime / 1000)
		}),

	"server-latency": (msg, username) =>
		sprintf(translate("Bad connection to server (%(milliseconds)sms)"), {
			"milliseconds": msg.meanRTT
		}),

	"client-latency": (msg, username) =>
		sprintf(translate("Bad connection to %(player)s (%(milliseconds)sms)"), {
			"player": username,
			"milliseconds": msg.meanRTT
		})
};

var g_NetworkCommands = {
	"/kick": argument => kickPlayer(argument, false),
	"/ban": argument => kickPlayer(argument, true),
	"/kickspecs": argument => kickObservers(false),
	"/banspecs": argument => kickObservers(true),
	"/list": argument => addChatMessage({ "type": "clientlist" }),
	"/clear": argument => clearChatMessages(),
	"/letsgo (godseye)": argument => clearChatMessages(),
};

var g_ValidPorts = { "min": 1024, "max": 65535 };
// TODO: This check should be performed exclusively on the C++ side, currently this is sort of redundant.
function getValidPort(port)
{
	if (isNaN(+port) || +port < g_ValidPorts.min || +port > g_ValidPorts.max)
		return Engine.GetDefaultPort();

	return +port;
}

/**
 * Must be kept in sync with source/network/NetHost.h
 */
function getDisconnectReason(id)
{
	switch (id)
	{
	case 0: return translate("An unknown error occurred.");
	case 1: return translate("The connection request has timed out.");
	case 2: return translate("The host has ended the game.");
	case 3: return translate("Incorrect network protocol version.");
	case 4: return translate("Game is loading, please try again later.");
	case 5: return translate("Game has already started, no observers allowed.");
	case 6: return translate("You have been kicked.");
	case 7: return translate("You have been banned.");
	case 8: return translate("Player name in use. If you were disconnected, retry in few seconds.");
	case 9: return translate("Server full.");
	case 10: return translate("Secure lobby authentication failed. Join via lobby.");
	case 11: return translate("Error: Server failed to allocate a unique client identifier.");
	case 12: return translate("Error: Client commands were ready for an unexpected game turn.");
	case 13: return translate("Error: Client simulated an unexpected game turn.");
	case 14: return translate("Password is invalid.");
	case 15: return translate("Could not find an unused port for the enet STUN client.");
	case 16: return translate("Could not find the STUN endpoint.");
	case 17: return translate("Different game engine versions or different mods loaded.");

	default:
		warn("Unknown disconnect-reason ID received: " + id);
		return sprintf(translate("\\[Invalid value %(id)s]"), { "id": id });
	}
}

function getRequestTimeOutMessage()
{
	return (Engine.HasXmppClient() ? "" : translate("Please ensure that you entered the correct server name or IP address, and port number.\n\n")) +
		translate("If you haven't yet, try to connect again and to different hosts." +
		"\nIf the issue persists or occurs regularly, visit the official FAQ for detailed guidance and troubleshooting steps.");
}

function getMismatchMessage(mismatchType, clientMismatchInfo, serverMismatchInfo)
{
	switch (mismatchType)
	{
	case "engine": return sprintf(translate("Different engine versions detected client version: %(clientMismatch)s server version: %(serverMismatch)s"), {
		"clientMismatch": clientMismatchInfo,
		"serverMismatch": serverMismatchInfo
	});
	case "mod": return sprintf(translate("Different mods enabled, or mods enabled in a different order. Client mod: '%(clientMismatch)s' Server mod: '%(serverMismatch)s'"), {
		"clientMismatch": clientMismatchInfo,
		"serverMismatch": serverMismatchInfo
	});
	default: return sprintf(translate("Unrecognized handshake mismatch type: %(mismatchType)s"), {
		"mismatchType": mismatchType
	});
	}
}

/**
 * Show the disconnect reason in a message box.
 *
 * @param {Object} message
 * @param {boolean} wasConnected
 */
function reportDisconnect(message, wasConnected)
{
	if (message.reason === 0)
		reportConnectionRequestTimeOut();
	else if (message.reason == 16)
		reportMismatchingSoftwareVersions(message.mismatch_type, message.client_mismatch, message.server_mismatch);
	else
		messageBox(
			400, 200,
			(wasConnected ?
				translate("Lost connection to the server.") :
				translate("Failed to connect to the server.")
			) + "\n\n" + getDisconnectReason(message.reason),
			translate("Disconnected")
		);
}

async function reportConnectionRequestTimeOut()
{
	const buttonIndex = await messageBox(
		600, 230,
		translate("Failed to connect to the server.") + " " + getDisconnectReason(1) + "\n\n" + getRequestTimeOutMessage(),
		translate("Connection Error"),
		[translate("Close"), translate("Open FAQ")]
	);
	if (buttonIndex === 1)
		openURL("https://gitea.wildfiregames.com/0ad/0ad/wiki/FAQ#what-shall-i-do-when-joining-multiplayer-matches-fails-with-an-error-message");

	return;
}

function reportMismatchingSoftwareVersions(mismatchType, clientMismatch, serverMismatch)
{
	messageBox(
		400, 200,
		translate("Failed to connect to the server.") +
		"\n\n" + getMismatchMessage(mismatchType, clientMismatch, serverMismatch),
		translate("Disconnected")
	);
}

function kickError()
{
	addChatMessage({
		"type": "system",
		"text": translate("Only the host can kick clients!")
	});
}

function kickPlayer(username, ban)
{
	if (!g_IsController)
	{
		kickError();
		return;
	}
	if (!g_IsNetworked)
	{
		addChatMessage({
			"type": "system",
			"text": translate("Offline game! Can not kick or ban.")
		});
		return;
	}
	Engine.KickPlayer(username, ban);
}

function kickObservers(ban)
{
	if (!g_IsController)
	{
		kickError();
		return;
	}
	if (!g_IsNetworked)
	{
		addChatMessage({
			"type": "system",
			"text": translate("Offline game! No spectators to kick or ban.")
		});
		return;
	}
	for (const guid in g_PlayerAssignments)
		if (g_PlayerAssignments[guid].player == -1)
			Engine.KickPlayer(g_PlayerAssignments[guid].name, ban);
}

/**
 * Sort GUIDs of connected users sorted by playerindex, observers last.
 * Requires g_PlayerAssignments.
 */
function sortGUIDsByPlayerID()
{
	return Object.keys(g_PlayerAssignments).sort((guidA, guidB) => {

		const playerIdA = g_PlayerAssignments[guidA].player;
		const playerIdB = g_PlayerAssignments[guidB].player;

		if (playerIdA == -1) return +1;
		if (playerIdB == -1) return -1;

		return playerIdA - playerIdB;
	});
}

/**
 * Get a colorized list of usernames sorted by player slot, observers last.
 * Requires g_PlayerAssignments and colorizePlayernameByGUID.
 *
 * @returns {string}
 */
function getUsernameList()
{
	const usernames = sortGUIDsByPlayerID().map(guid => colorizePlayernameByGUID(guid));

	// Translation: Number of currently connected players/observers and their names
	return sprintf(translate("Users (%(num)s): %(users)s"), {
		"users": usernames.join(translate(", ")),
		"num": usernames.length
	});
}

/**
 * Execute a command locally. Requires addChatMessage.
 *
 * @param {string} input
 * @returns {boolean} whether a command was executed
 */
function executeNetworkCommand(input)
{
	if (input.indexOf("/") != 0)
		return false;

	const command = input.split(" ", 1)[0];
	const argument = input.substr(command.length + 1);

	if (g_NetworkCommands[command])
		g_NetworkCommands[command](argument);

	return !!g_NetworkCommands[command];
}

/**
 * Remember this warning for a few seconds.
 * Overwrite previous warnings for this user.
 *
 * @param msg - GUI message sent by NetServer or NetClient
 */
function addNetworkWarning(msg)
{
	if (!g_NetworkWarningTexts[msg.warntype])
	{
		warn("Unknown network warning type received: " + uneval(msg));
		return;
	}

	if (Engine.ConfigDB_GetValue("user", "overlay.netwarnings") != "true")
		return;

	g_NetworkWarnings[msg.guid || "server"] = {
		"added": Date.now(),
		"msg": msg
	};
}

/**
 * Colorizes and concatenates all network warnings.
 * Returns text and textWidth.
 */
function getNetworkWarnings()
{
	// Remove outdated messages
	for (const guid in g_NetworkWarnings)
		if (Date.now() > g_NetworkWarnings[guid].added + g_NetworkWarningTimeout ||
		    guid != "server" && !g_PlayerAssignments[guid])
			delete g_NetworkWarnings[guid];

	// Show local messages first
	const guids = Object.keys(g_NetworkWarnings).sort(guid => guid != "server");

	const messages = [];

	for (const guid of guids)
	{
		const msg = g_NetworkWarnings[guid].msg;

		// Add formatted text
		messages.push(g_NetworkWarningTexts[msg.warntype](msg, colorizePlayernameByGUID(guid)));
	}

	return messages;
}
