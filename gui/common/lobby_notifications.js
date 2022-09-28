/**
 * Indicates if lobby dialog is opened.
 */
var g_LobbyDialogOpened = false;

/**
 * Function name for call when notification happens in lobby.
 */
var g_UpdateLobbyNotification = notify => {};

/**
 * Notification sign used in menus.
 */
var g_NofiticationSign = "*";

/**
 * Lobby net messages, that triggers a notification.
 */
var g_LobbyNetMessageTypeNotification = {
	"system": {
		"disconnected": msg => true
	},
	"chat": {
        // "subject": msg => true,
        "role": msg => msg.nick == Engine.LobbyGetNick(),
        "room-message": msg => msg.text.toUpperCase().search(matchPlayerName(Engine.LobbyGetNick().toUpperCase())) != -1,
        "kicked": msg => msg.nick == Engine.LobbyGetNick(),
        "banned": msg => msg.nick == Engine.LobbyGetNick(),
        "private-message": msg => true
	}
};

function handleNetLobbyMessagesInBackground()
{
    if (!g_LobbyDialogOpened)
    {
        let msg = Engine.LobbyGuiPollNewMessage(); // Only poll new messages no historic.
        if (msg && g_LobbyNetMessageTypeNotification[msg.type] &&
            g_LobbyNetMessageTypeNotification[msg.type][msg.level] &&
            g_LobbyNetMessageTypeNotification[msg.type][msg.level](msg))
        {
            g_UpdateLobbyNotification(true);
            soundNotification("nick");
        }
    }
}

function setLobbyDialogClosed()
{
    g_LobbyDialogOpened = false;
}
