class GetReadyButton
{
	constructor(setupWindow)
	{
		this.readyController = setupWindow.controls.readyController;

		this.hidden = undefined;

		this.setupWindow = setupWindow;
		this.gameStarted = false;

		this.buttonHiddenChangeHandlers = new Set();

		this.getReadyButton = Engine.GetGUIObjectByName("getReadyButton");
		this.getReadyButton.caption = this.Caption;	
		this.getReadyButton.onPress = this.onPress.bind(this);

		
		setupWindow.registerLoadHandler(this.onLoad.bind(this));
		setupWindow.controls.playerAssignmentsController.registerPlayerAssignmentsChangeHandler(this.onPlayerAssignmentsChange.bind(this));
		setupWindow.controls.playerAssignmentsController.registerPlayerAssignmentsChangeHandler(this.update.bind(this));
	}

	/*
	registerButtonHiddenChangeHandler(handler)
	{
		this.buttonHiddenChangeHandlers.add(handler);
	}
	*/
	onLoad()
	{
		//show button only if you host the game and not single game
		this.getReadyButton.hidden = !g_IsController || !g_IsNetworked
		
		//for (let handler of this.buttonHiddenChangeHandlers)
		//	handler();
	}

	onPlayerAssignmentsChange()
	{
		this.update();
	}


	update()
	{
		let isEveryoneReady = this.isEveryoneRead();
		//this.getReadyButton.enabled = !playerAssignment  || playerAssignment.player == -1 || !isEveryoneReady ;
						
		if (isEveryoneReady && g_IsController) {
			this.getReadyButton.hidden = false; 
		} else {
			this.getReadyButton.hidden = true;				
		}
	}

	isEveryoneRead()
	{
		if (!g_IsNetworked)
			return false;
		//Get array of names who are not ready
		let names = this.playersUnready();

		if (names.length) {	return true; } else { return false; }
	}
/*
	isEveryoneReady()
	{
		//if (!g_IsNetworked)
		//	return true;

		for (let guid in g_PlayerAssignments)			
			if (g_PlayerAssignments[guid].player != -1 &&
				g_PlayerAssignments[guid].status == this.setupWindow.controls.readyController.Ready)				
				return false;

		return true;
	}
*/
	onPress()
	{
		//warn(uneval("this.getReadyButton pushed - need code to notify others"));
		let names = this.playersUnready();
		
		if (names.length) {			
			let msg =  "Not ready: " + names.join(", ") + " please ready up";
			Engine.SendNetworkChat(msg);		
			
			if (msg.includes("!readyup")) {
				Engine.SendNetworkChat(msg);
			}
			
			return true;
		}		
		this.update();
	}

	playersUnready()
	{		
		return Object.keys(g_PlayerAssignments).filter(guid => !(g_PlayerAssignments[guid].status ||
			g_PlayerAssignments[guid].player == -1 ||
			guid == Engine.GetPlayerGUID() )).map(guid => g_PlayerAssignments[guid].name);
	}

}

GetReadyButton.prototype.Caption =
	translate("Ask to ready up!");

GetReadyButton.prototype.ReadyTooltip =
	translate("Ask players to get ready up!.");


