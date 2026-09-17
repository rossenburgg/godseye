/**
 * Automatically marks the lobby user as "away" after a period of inactivity
 * or when the lobby window loses focus, and restores "available" when the
 * user returns.
 *
 * The WindowFocus/WindowBlur actions in lobby.xml drive the focus state.
 * Chat activity is reported via onLobbyUserActivity() from ChatInputPanel.
 */

var g_WindowFocus = true;
var g_AutoAwayTimeout;
const g_AutoAwayDelay = 5 * 60 * 1000;

function resetAutoAway()
{
	if (g_AutoAwayTimeout !== undefined)
		clearTimeout(g_AutoAwayTimeout);

	g_AutoAwayTimeout = setTimeout(() => {
		Engine.LobbySetPlayerPresence("away");
	}, g_AutoAwayDelay);
}

function onLobbyWindowFocus()
{
	g_WindowFocus = true;
	Engine.LobbySetPlayerPresence("available");
	resetAutoAway();
}

function onLobbyWindowBlur()
{
	g_WindowFocus = false;
	if (g_AutoAwayTimeout !== undefined)
	{
		clearTimeout(g_AutoAwayTimeout);
		g_AutoAwayTimeout = undefined;
	}
	Engine.LobbySetPlayerPresence("away");
}

function onLobbyUserActivity()
{
	Engine.LobbySetPlayerPresence("available");
	resetAutoAway();
}

// Safety net: while the window is blurred, make sure presence stays "away".
setInterval(() => {
	if (!g_WindowFocus)
		Engine.LobbySetPlayerPresence("away");
}, 60 * 1000);
