var g_aboutFile = "gui/splashscreen/manual_godseye.txt";

function init(data)
{
	Engine.GetGUIObjectByName("manual_godseyeText").caption = Engine.TranslateLines(Engine.ReadFile(g_aboutFile));
	// Engine.GetGUIObjectByName("displayAboutText") = Engine.ConfigDB_GetValue("user", "gui.splashscreen.enable") === "true";
}

function closePage()
{
	Engine.ConfigDB_CreateAndWriteValueToFile("user", "gui.splashscreen.enable", String(Engine.GetGUIObjectByName("displaySplashScreen").checked), "config/user.cfg");
	Engine.ConfigDB_CreateAndWriteValueToFile("user", "gui.about.version", Engine.GetFileMTime(g_aboutFile), "config/user.cfg");
	Engine.PopGuiPage();
}
