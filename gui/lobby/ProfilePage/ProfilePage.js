/**
 * The profile page enables the player to lookup statistics of an arbitrary player.
 */
class ProfilePage
{
	constructor(xmppMessages)
	{
		this.requestedPlayer = undefined;
		this.closePageHandlers = new Set();

		this.profilePage = Engine.GetGUIObjectByName("profilePage");

		this.fetchInput = Engine.GetGUIObjectByName("fetchInput");
		this.fetchInputLabel = Engine.GetGUIObjectByName("fetchInputLabel");
		resizeGUIObjectToCaption(this.fetchInputLabel, { "horizontal": "right" });
		this.fetchInput.size.left = this.fetchInputLabel.size.right;

		this.fetchInput.onPress = this.onPressLookup.bind(this);
		this.fetchInput.onTab = this.autocomplete.bind(this);
		this.fetchInput.tooltip = colorizeAutocompleteHotkey();

		Engine.GetGUIObjectByName("viewProfileButton").onPress = this.onPressLookup.bind(this);
		Engine.GetGUIObjectByName("profileBackButton").onPress = this.onPressClose.bind(this, true);

		this.profilePlayernameText = Engine.GetGUIObjectByName("profilePlayernameText");
		this.profileRankText = Engine.GetGUIObjectByName("profileRankText");
		this.profileHighestRatingText = Engine.GetGUIObjectByName("profileHighestRatingText");
		this.profileTotalGamesText = Engine.GetGUIObjectByName("profileTotalGamesText");
		this.profileWinsText = Engine.GetGUIObjectByName("profileWinsText");
		this.profileLossesText = Engine.GetGUIObjectByName("profileLossesText");
		this.profileRatioText = Engine.GetGUIObjectByName("profileRatioText");
		this.profileErrorText = Engine.GetGUIObjectByName("profileErrorText");
		this.profileWindowArea = Engine.GetGUIObjectByName("profileWindowArea");

		xmppMessages.registerXmppMessageHandler("game", "profile", this.onProfile.bind(this));

		this.viewProfileButton = Engine.GetGUIObjectByName("viewProfileButton");
		resizeGUIObjectToCaption(this.viewProfileButton, { "horizontal": "center" }, { "horizontal": 24 });
		this.profileBackButton = Engine.GetGUIObjectByName("profileBackButton");
		resizeGUIObjectToCaption(this.profileBackButton, { "horizontal": "center" }, { "horizontal": 24 });
	}

	registerClosePageHandler(handler)
	{
		this.closePageHandlers.add(handler);
	}

	openPage()
	{
		this.profilePage.hidden = false;
		Engine.SetGlobalHotkey("cancel", "Press", this.onPressClose.bind(this));
	}

	onPressLookup()
	{
		this.requestedPlayer = this.fetchInput.caption;
		Engine.SendGetProfile(this.requestedPlayer);
	}

	autocomplete()
	{
		const listPlayerNames = Engine.GetPlayerList().map(player => escapeText(player.name));
		// Remove duplicates with the board list. The board list has lower case names.
		const listPlayerNamesLower = listPlayerNames.map(playerName => playerName.toLowerCase());
		for (const entry of Engine.GetBoardList())
		{
			const escapedName = escapeText(entry.name);
			if (!listPlayerNamesLower.includes(escapedName))
				listPlayerNames.push(escapedName);
		}
		autoCompleteText(this.fetchInput, listPlayerNames);
	}

	onPressClose()
	{
		this.profilePage.hidden = true;

		for (const handler of this.closePageHandlers)
			handler();
	}

	onProfile()
	{
		const attributes = Engine.GetProfile()[0];
		if (this.profilePage.hidden || this.requestedPlayer != attributes.player)
			return;

		const profileFound = attributes.rating != "-2";
		this.profileWindowArea.hidden = !profileFound;
		this.profileErrorText.hidden = profileFound;

		if (!profileFound)
		{
			this.profileErrorText.caption =
				sprintf(translate("Player \"%(nick)s\" not found."), {
					"nick": escapeText(attributes.player)
				});
			return;
		}

		this.profilePlayernameText.caption = escapeText(attributes.player);
		this.profileRankText.caption = attributes.rank;
		this.profileHighestRatingText.caption = attributes.highestRating;
		this.profileTotalGamesText.caption = attributes.totalGamesPlayed;
		this.profileWinsText.caption = attributes.wins;
		this.profileLossesText.caption = attributes.losses;
		this.profileRatioText.caption = ProfilePanel.FormatWinRate(attributes);
	}
}
