/**
 * This class manages the button that allows the player to go to see the civilizations info.
 */
class CivilizationLobbyButton
{
	constructor()
	{
		this.civInfo = {
			"civ": "",
			"page": "page_civinfo.xml"
		};
		this.civilizationLobbyButton = Engine.GetGUIObjectByName("civilizationLobbyButton");
		this.civilizationLobbyButton.onPress = this.onPress.bind(this);
		this.civilizationLobbyButton.caption = translate("Civilization");

		Engine.SetGlobalHotkey("structree", "Press", this.openPage.bind(this, "page_structree.xml"));
		Engine.SetGlobalHotkey("civinfo", "Press", this.openPage.bind(this, "page_civinfo.xml"));
	}

	onPress()
	{
		this.openPage(this.civInfo.page);
	}

	openPage(page)
	{
		Engine.OpenChildPage(
			page,
			{ "civ": this.civInfo.civ }
		).then(this.storeCivInfoPage.bind(this));
	}

	storeCivInfoPage(data)
	{
		if (!data)
			return;

		if (data.nextPage)
			Engine.OpenChildPage(
				data.nextPage,
				{ "civ": data.args && data.args.civ }
			).then(this.storeCivInfoPage.bind(this));
		else
			this.civInfo = {
				"civ": data.args && data.args.civ || "",
				"page": data.page || "page_civinfo.xml"
			};
	}
}
