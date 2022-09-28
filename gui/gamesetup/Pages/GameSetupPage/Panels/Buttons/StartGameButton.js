class StartGameButton
{
	constructor(setupWindow)
	{
		this.setupWindow = setupWindow;
		this.gameStarted = false;

		this.buttonHiddenChangeHandlers = new Set();

		this.startGameButton = Engine.GetGUIObjectByName("startGameButton");
		this.startGameButton.caption = this.Caption;
		//this.startGameButton.caption = "Ask to get ready";
		this.startGameButton.onPress = this.onPress.bind(this);

		setupWindow.registerLoadHandler(this.onLoad.bind(this));
		setupWindow.controls.playerAssignmentsController.registerPlayerAssignmentsChangeHandler(this.update.bind(this));
	}

	registerButtonHiddenChangeHandler(handler)
	{
		this.buttonHiddenChangeHandlers.add(handler);
	}

	onLoad()
	{
		this.startGameButton.hidden = !g_IsController;
		for (let handler of this.buttonHiddenChangeHandlers)
			handler();
	}

	update()
	{
		let isEveryoneReady = this.isEveryoneReady();
		this.startGameButton.enabled = !this.gameStarted && isEveryoneReady;
		

		this.startGameButton.tooltip =
			!g_IsNetworked || isEveryoneReady ?
				this.ReadyTooltip :
				this.ReadyTooltipWaiting;
	}

	isEveryoneReady()
	{
		if (!g_IsNetworked)
			return true;

		//return list of players not ready 1 2 3 4 5 6 7 8			
		for (let guid in g_PlayerAssignments)			
			if (g_PlayerAssignments[guid].player != -1 &&
				g_PlayerAssignments[guid].status == this.setupWindow.controls.readyController.NotReady)				
				//warn(uneval("Player:"+g_PlayerAssignments[guid].player));
				//warn(uneval("Player:"+this.setupWindow.controls.readyController.NotReady));
				return false;

		return true;
	}

	onPress()
	{
		if (this.gameStarted)
			return;

		this.gameStarted = true;
		this.update();
		this.setupWindow.controls.gameSettingsController.launchGame();
	}
}

StartGameButton.prototype.Caption =
	translate("Start Game!");

StartGameButton.prototype.ReadyTooltip =
	translate("Start a new game with the current settings.");

StartGameButton.prototype.ReadyTooltipWaiting =
	translate("Start a new game with the current settings (disabled until all players are ready).");
