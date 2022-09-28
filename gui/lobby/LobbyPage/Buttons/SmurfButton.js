/**
 * This class manages the button that enables the player to add or remove smurfs.
 */
 class SmurfButton
 {
	 constructor(xmppMessages)
	 {
		 this.smurfChangedHandlers = new Set();
		 this.playerName = undefined;
 
		 this.toggleSmurfButton = Engine.GetGUIObjectByName("toggleSmurfButton");
		 this.toggleSmurfButton.onPress = this.onPress.bind(this);
 
		 let rebuild = this.rebuild.bind(this);
		 xmppMessages.registerXmppMessageHandler("system", "connected", rebuild);
		 xmppMessages.registerXmppMessageHandler("system", "disconnected", rebuild);
 
		 this.rebuild();
	 }
 
	 registerSmurfChangeHandler(handler)
	 {
		 this.smurfChangedHandlers.add(handler);
	 }
 
	 onPlayerSelectionChange(playerName)
	 {
		 this.playerName = playerName;
		 this.rebuild();
	 }
 
	 rebuild()
	 {
		 this.toggleSmurfButton.caption =
			 g_Smurfs.indexOf(this.playerName) != -1 ?
				 this.UnmarkString :
				 this.MarkString;
 
		 this.toggleSmurfButton.enabled = Engine.IsXmppClientConnected() && !!this.playerName && this.playerName != g_Nickname;
	 }
 
	 /**
	  * Toggle the smurf state of the selected player.
	  */
	 onPress()
	 {
		 if (!this.playerName || this.playerName == g_Nickname || this.playerName.indexOf(g_SmurfListDelimiter) != -1)
			 return;
 
		 let index = g_Smurfs.indexOf(this.playerName);
		 if (index != -1)
			 g_Smurfs.splice(index, 1);
		 else
			 g_Smurfs.push(this.playerName);
 
		 Engine.ConfigDB_CreateAndWriteValueToFile(
			 "user",
			 "lobby.smurfs",
			 g_Smurfs.filter(nick => nick).join(g_SmurfListDelimiter) || g_SmurfListDelimiter,
			 "config/user.cfg");
 
		 this.rebuild();
 
		 for (let handler of this.smurfChangedHandlers)
			 handler();
	 }
 }
 
 SmurfButton.prototype.MarkString = translate("Mark as Smurf");
 SmurfButton.prototype.UnmarkString = translate("Unmark as Smurf");
 