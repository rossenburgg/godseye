/**
 * This class is concerned with displaying players who are online and
 * triggering handlers when selecting or doubleclicking on a player.
 */
class PlayerList
{
	constructor(xmppMessages, buddyButton, smurfButton, gameList)
	{
		this.gameList = gameList;
		this.selectedPlayer = undefined;
		this.statusOrder = Object.keys(this.PlayerStatuses);

		// Avoid repeated array construction for performance
		this.buddyStatusList = [];
		this.smurfStatusList = [];
		this.playerList = [];
		this.presenceList = [];
		this.nickList = [];
		this.ratingList = [];

		this.playersFilter = Engine.GetGUIObjectByName("playersFilter");
		this.playersFilter.onPress = this.selectPlayer.bind(this);
		this.playersFilter.onTab = this.autocomplete.bind(this);
		this.playersFilter.tooltip = colorizeAutocompleteHotkey();

		this.selectionChangeHandlers = new Set();
		this.mouseLeftDoubleClickItemHandlers = new Set();
		this.mouseRightDoubleClickItemHandlers = new Set();

		this.playersBox = Engine.GetGUIObjectByName("playersBox");
		this.playersBox.onSelectionChange = this.onPlayerListSelection.bind(this);
		this.playersBox.onSelectionColumnChange = this.rebuildPlayerList.bind(this);
		this.playersBox.onMouseLeftClickItem = this.onMouseLeftClickItem.bind(this);
		this.playersBox.onMouseLeftDoubleClickItem = this.onMouseLeftDoubleClickItem.bind(this);
		this.playersBox.onMouseRightDoubleClickItem = this.onMouseRightDoubleClickItem.bind(this);

		buddyButton.registerBuddyChangeHandler(this.onBuddyChange.bind(this));
		smurfButton.registerSmurfChangeHandler(this.onSmurfChange.bind(this));
		xmppMessages.registerPlayerListUpdateHandler(this.rebuildPlayerList.bind(this));
		this.registerSelectionChangeHandler(buddyButton.onPlayerSelectionChange.bind(buddyButton));
		this.registerSelectionChangeHandler(smurfButton.onPlayerSelectionChange.bind(smurfButton));
		this.registerMouseLeftDoubleClickItemHandler(buddyButton.onPress.bind(buddyButton));
		this.registerMouseRightDoubleClickItemHandler(smurfButton.onPress.bind(smurfButton));

		this.rebuildPlayerList();
	}


	selectPlayer()
	{
		let index = this.playersBox.list.indexOf(this.playersFilter.caption);
		
		if (index != -1)
			this.playersBox.selected = index;
	}

	autocomplete()
	{
		autoCompleteText(
			this.playersFilter,
			Engine.GetPlayerList().map(player => player.name));
	}

	registerSelectionChangeHandler(handler)
	{
		this.selectionChangeHandlers.add(handler);
	}

	registerMouseLeftDoubleClickItemHandler(handler)
	{
		this.mouseLeftDoubleClickItemHandlers.add(handler);
	}

	registerMouseRightDoubleClickItemHandler(handler)
	{
		this.mouseRightDoubleClickItemHandlers.add(handler);
	}

	onBuddyChange()
	{
		this.rebuildPlayerList();
	}

	onSmurfChange()
	{
		this.rebuildPlayerList();
	}


	onMouseLeftDoubleClickItem()
	{
		for (let handler of this.mouseLeftDoubleClickItemHandlers)
			handler();
	}


	onMouseRightDoubleClickItem()
	{
		for (let handler of this.mouseRightDoubleClickItemHandlers)
			handler();
	}
	onMouseLeftClickItem()
	{
		// In case of clicking on the same player again
		this.gameList.selectGameFromPlayername(this.selectedPlayer);
	}



	onPlayerListSelection()
	{
		if (this.playersBox.selected == this.playersBox.list.indexOf(this.selectedPlayer))
			return;

		this.selectedPlayer = this.playersBox.list[this.playersBox.selected];

		this.gameList.selectGameFromPlayername(this.selectedPlayer);

		for (let handler of this.selectionChangeHandlers)
			handler(this.selectedPlayer);
	}

	parsePlayer(sortKey, player)
	{
		player.isBuddy = g_Buddies.indexOf(player.name) != -1;
		player.isSmurf = g_Smurfs.indexOf(player.name) != -1;

		switch (sortKey)
		{
		case 'buddy':
			player.sortValue = (player.isBuddy ? 1 : 2) + this.statusOrder.indexOf(player.presence) + player.name.toLowerCase();
			break;
			case 'smurf':
			player.sortValue = (player.isSmurf ? 1 : 2) + this.statusOrder.indexOf(player.presence) + player.name.toLowerCase();
			break;
		case 'rating':
			player.sortValue = +player.rating;
			break;
		case 'status':
			player.sortValue = this.statusOrder.indexOf(player.presence) + player.name.toLowerCase();
			break;
		case 'name':
		default:
			player.sortValue = player.name.toLowerCase();
			break;
		}
	}

	/**
	 * Do a full update of the player listing, including ratings from cached C++ information.
	 * Important: This should only be performed once if
	 * there have been multiple messages received changing this list.
	 */
	rebuildPlayerList()
	{
		Engine.ProfileStart("rebuildPlayersList");

		Engine.ProfileStart("getPlayerList");
		let playerList = Engine.GetPlayerList();
		Engine.ProfileStop();

		Engine.ProfileStart("parsePlayers");
		playerList.forEach(this.parsePlayer.bind(this, this.playersBox.selected_column));
		Engine.ProfileStop();

		Engine.ProfileStart("sortPlayers");
		playerList.sort(this.sortPlayers.bind(this, this.playersBox.selected_column_order));
		Engine.ProfileStop();

		Engine.ProfileStart("prepareList");
		let length = playerList.length;
		this.buddyStatusList.length = length;
		this.smurfStatusList.length = length;
		this.playerList.length = length;
		this.presenceList.length = length;
		this.nickList.length = length;
		this.ratingList.length = length;

		playerList.forEach((player, i) => {
			// TODO: COList.cpp columns should support horizontal center align
			let rating = player.rating ? ("     " + player.rating).substr(-5) : "     -";

			let presence = this.PlayerStatuses[player.presence] ? player.presence : "unknown";
			if (presence == "unknown")
				warn("Unknown presence:" + player.presence);

			let statusTags = this.PlayerStatuses[presence].tags;
			
			this.buddyStatusList[i] = player.isBuddy ? setStringTags(g_BuddySymbol, statusTags) : "";
			this.smurfStatusList[i] = player.isSmurf ? setStringTags(g_SmurfSymbol, statusTags) : "";
			this.playerList[i] = PlayerColor.ColorPlayerName(player.name, "", player.role);
			this.presenceList[i] = setStringTags(this.PlayerStatuses[presence].status, statusTags);
			this.ratingList[i] = setStringTags(rating, statusTags);
			this.nickList[i] = escapeText(player.name);
		});
		Engine.ProfileStop();

		Engine.ProfileStart("copyToGUI");
		this.playersBox.list_buddy = this.buddyStatusList;
		this.playersBox.list_smurf = this.smurfStatusList;
		this.playersBox.list_name = this.playerList;
		this.playersBox.list_status = this.presenceList;
		this.playersBox.list_rating = this.ratingList;
		this.playersBox.list = this.nickList;
		Engine.ProfileStop();

		Engine.ProfileStart("selectionChange");
		this.playersBox.selected = this.playersBox.list.indexOf(this.selectedPlayer);
		Engine.ProfileStop();

		Engine.ProfileStop();
	}

	sortPlayers(sortOrder, player1, player2)
	{
		if (player1.sortValue < player2.sortValue)
			return -sortOrder;

		if (player1.sortValue > player2.sortValue)
			return +sortOrder;

		return 0;
	}
}

/**
 * The playerlist will be assembled using these values.
 */
PlayerList.prototype.PlayerStatuses = {
	"available": {
		"status": translate("Online"),
		"tags": {
			"color": "0 255 0"
		}
	},
	"away": {
		"status": translate("Away"),
		"tags": {
			"color": "227 100 20"
		}
	},
	"playing": {
		"status": translate("Busy"),
		"tags": {
			"color": "217 29 37"
		}
	},
	"offline": {
		"status": translate("Offline"),
		"tags": {
			"color": "0 0 0"
		}
	},
	"unknown": {
		"status": translateWithContext("lobby presence", "Unknown"),
		"tags": {
			"color": "178 178 178"
		}
	}
};
