var g_manualFile = "gui/splashscreen/manual_godseye.txt";

async function init(data, hotloadData)
{
	Engine.GetGUIObjectByName("manual_godseyeText").caption = Engine.TranslateLines(Engine.ReadFile(g_manualFile));

	// Keep the page open until the user presses OK (Escape works too via the cancel hotkey).
	// Returning from init closes this child page and resolves Engine.OpenChildPage.
	await new Promise(resolve => {
		Engine.GetGUIObjectByName("btnOK").onPress = resolve;
	});
}
