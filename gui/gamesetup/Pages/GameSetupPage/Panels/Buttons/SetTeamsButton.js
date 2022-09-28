const g_TeamsConfigList = [ "   ", "4v4", "3v3", "FFA", "1v1", "2v2",   "1v1v1", "2v2v2", "1v1v1v1", "2v2v2v2" ];

class SetTeamsButton
{
	constructor(setupWindow)
	{	
		//this.gameSettingsController = setupWindow.controls.gameSettingsController;
		//this.playercount = GameSettingControls.PlayerCount;
		this.gameSettingsController = setupWindow.controls.gameSettingsController;
		this.playercount = GameSettingControls.PlayerCount;
		// Init teamSetButton with values
		this.teamSetButton = Engine.GetGUIObjectByName("teamButton");
		this.teamSetButton.list = g_TeamsConfigList;
		this.teamSetButton.list_data = g_TeamsConfigList;
		this.teamSetButton.selected = 0;
		this.teamSetButton.onSelectionChange = this.onSelectionChange.bind(this);
		this.teamSetButton.tooltip = this.Tooltip;		
	}

	onSelectionChange() 
	{
		// skip if not host
		if (!g_IsController)
			return true;
		//skip if scenario game type
		if (g_GameSettings.map.type == "scenario" ||!g_IsController )
			return true;

		switch(this.teamSetButton.list_data[this.teamSetButton.selected])
		{
		case "1v1":
			this.setPlayerNumbers(2);
			this.setTeams([0,1]);
			break;
		case "2v2":
			this.setPlayerNumbers(4);
			this.setTeams([0,0,1,1]);
			break;
		case "3v3":
			this.setPlayerNumbers(6);
			this.setTeams([0,0,0,1,1,1]);
			break;
		case "4v4":
			this.setPlayerNumbers(8);					
			this.setTeams([0,0,0,0,1,1,1,1]);
			break;
		case "1v1v1":
			this.setPlayerNumbers(3);
			this.setTeams([0,1,2]);
			break;
		case "2v2v2":
			this.setPlayerNumbers(6);
			this.setTeams([0,0,1,1,2,2]);
			break;
		case "1v1v1v1":
			this.setPlayerNumbers(4);
			this.setTeams([0,1,2,3]);
			break;
		case "2v2v2v2":
			this.setPlayerNumbers(8);
			this.setTeams([0,0,1,1,2,2,3,3]);
			break;
		case "FFA":						
			this.resetTeams();
		}
		//send changes over network
		this.gameSettingsController.setNetworkInitAttributes();



	}

	setTeams(teams)
	{
		for (let i = 0; i < g_GameSettings.playerCount.nbPlayers; ++i)
			g_GameSettings.playerTeam.setValue(i, teams[i]);		
	}

	setPlayerNumbers(itemIdx)
	{
		g_GameSettings.playerCount.setNb(itemIdx);
	}
	resetTeams()
	{
		for (let i = 0; i < g_GameSettings.playerCount.nbPlayers; ++i)
		g_GameSettings.playerTeam.setValue(i, -1);	
	}
}

SetTeamsButton.prototype.Tooltip =
	translate("Set your team game setup");
