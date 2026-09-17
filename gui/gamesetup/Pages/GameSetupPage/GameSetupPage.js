/**
 * This class owns all handlers of the game setup page, excluding controllers that apply to all subpages and handlers for specific subpages.
 */
SetupWindowPages.GameSetupPage = class
{
	constructor(setupWindow, isSavedGame)
	{
		Engine.ProfileStart("GameSetupPage");

		// This class instance owns all game setting GUI controls such as dropdowns and checkboxes visible in this page.
		this.gameSettingControlManager = new GameSettingControlManager(setupWindow, isSavedGame);

		// These classes manage GUI buttons.
		{
			const startGameButton = new StartGameButton(setupWindow);
			const getReadyButton = new GetReadyButton(setupWindow);
			const readyButton = new ReadyButton(setupWindow);
			this.panelButtons = {
				"civInfoButton": new CivInfoButton(),
				"lobbyButton": new LobbyButton(),
				"savedGameLabel": new SavedGameLabel(isSavedGame),
				"cancelButton": new CancelButton(setupWindow, startGameButton, readyButton),
				"getReadyButton": getReadyButton,
				"readyButton": readyButton,
				"startGameButton": startGameButton
			};
		}

		// These classes manage GUI Objects.
		{
			const gameSettingTabs = new GameSettingTabs(setupWindow, this.panelButtons.lobbyButton);
			const gameSettingsPanel = new GameSettingsPanel(
				setupWindow, gameSettingTabs, this.gameSettingControlManager);

			this.panels = {
				"chatPanel": new ChatPanel(setupWindow, this.gameSettingControlManager, gameSettingsPanel),
				"gameSettingWarning": new GameSettingWarning(setupWindow),
				"gameDescription": new GameDescription(setupWindow, gameSettingTabs),
				"gameSettingsPanel": gameSettingsPanel,
				"gameSettingsTabs": gameSettingTabs,
				"mapPreview": new MapPreview(setupWindow, isSavedGame),
				"resetCivsButton": new ResetCivsButton(setupWindow, isSavedGame),
				//"resetTeamsButton": new ResetTeamsButton(setupWindow, isSavedGame),
				"teamButton": new SetTeamsButton(setupWindow),
				"soundNotification": new SoundNotification(setupWindow),
				"tipsPanel": new TipsPanel(gameSettingsPanel),
				"onscreenToolTip": new Tooltip()
			};
		}

		setupWindow.controls.gameSettingsController.registerLoadingChangeHandler((loading) => this.onLoadingChange(loading));

		Engine.ProfileStop();
	}

	onLoadingChange(loading)
	{
		Engine.GetGUIObjectByName("gameSetupPage").hidden = loading;
	}
};
