/**
 * Horizontal size of a tab button.
 */
var g_TabButtonWidth = 138;

/**
 * Horizontal space between two tab buttons.
 */
var g_TabButtonDist = 5;

var getScorePanelsData = () => [
	{
		"label": translate("Score"),
		"headings": [
			{ "identifier": "playername", "caption": translate("Player name"), "yStart": 26, "width": 200 },
			{ "identifier": "totalScore", "caption": translate("Total score"), "yStart": 0, "width": 120 },
			{ "identifier": "economyScore", "caption": translate("Economy score"), "yStart": 0, "width": 120 },
			{ "identifier": "militaryScore", "caption": translate("Military score"), "yStart": 0, "width": 120 },
			{ "identifier": "explorationScore", "caption": translate("Exploration score"), "yStart": 0, "width": 120 },
			{ "identifier": "fightActivity", "caption": translate("Fight Activity Ratio"), "yStart": 0, "width": 120 }
		],
		"titleHeadings": [],
		"counters": [
			{ "width": 120, "fn": calculateScoreTotal },
			{ "width": 120, "fn": calculateEconomyScore },
			{ "width": 120, "fn": calculateMilitaryScore },
			{ "width": 120, "fn": calculateExplorationScore },
			{ "width": 120, "fn": calculateFightActivityRatio }
		],
		"teamCounterFn": calculateScoreTeam
	},
	{
		"label": translate("Buildings"),
		"headings": [
			{ "identifier": "playername", "caption": translate("Player name"), "yStart": 26, "width": 200 },
			{ "identifier": "Structure", "caption": translate("Total"), "yStart": 34, "width": 90 },
			{ "identifier": "House", "caption": translate("Houses"), "yStart": 34, "width": 90 },
			{ "identifier": "Economic", "caption": translate("Economic"), "yStart": 34, "width": 90 },
			{ "identifier": "Outpost", "caption": translate("Outposts"), "yStart": 34, "width": 90 },
			{ "identifier": "Military", "caption": translate("Military"), "yStart": 34, "width": 90 },
			{ "identifier": "Fortress", "caption": translate("Fortresses"), "yStart": 34, "width": 90 },
			{ "identifier": "CivCentre", "caption": translate("Civ centers"), "yStart": 34, "width": 90 },
			{ "identifier": "Wonder", "caption": translate("Wonders"), "yStart": 34, "width": 90 }
		],
		"titleHeadings": [
			{
				"caption": sprintf(translate("Structure Statistics (%(constructed)s / %(destroyed)s / %(captured)s / %(lost)s)"),
					{
						"constructed": getColoredTypeTranslation("constructed"),
						"destroyed": getColoredTypeTranslation("destroyed"),
						"captured": getColoredTypeTranslation("captured"),
						"lost": getColoredTypeTranslation("lost")
					}),
				"yStart": 16,
				"width": 90 * 8
			},	// width = 720
		],
		"counters": [
			{ "width": 90, "fn": calculateBuildings },
			{ "width": 90, "fn": calculateBuildings },
			{ "width": 90, "fn": calculateBuildings },
			{ "width": 90, "fn": calculateBuildings },
			{ "width": 90, "fn": calculateBuildings },
			{ "width": 90, "fn": calculateBuildings },
			{ "width": 90, "fn": calculateBuildings },
			{ "width": 90, "fn": calculateBuildings }
		],
		"teamCounterFn": calculateBuildingsTeam
	},
	{
		"label": translate("Units"),
		"headings": [
			{ "identifier": "playername", "caption": translate("Player name"), "yStart": 26, "width": 200 },
			{ "identifier": "Unit", "caption": translate("Total"), "yStart": 34, "width": 90 },
			{ "identifier": "Infantry", "caption": translate("Infantry"), "yStart": 34, "width": 90 },
			{ "identifier": "Worker", "caption": translate("Worker"), "yStart": 34, "width": 90 },
			{ "identifier": "Cavalry", "caption": translate("Cavalry"), "yStart": 34, "width": 90 },
			{ "identifier": "Champion", "caption": translate("Champion"), "yStart": 34, "width": 90 },
			{ "identifier": "Hero", "caption": translate("Heroes"), "yStart": 34, "width": 90 },
			{ "identifier": "Siege", "caption": translate("Siege"), "yStart": 34, "width": 90 },
			{ "identifier": "Ship", "caption": translate("Navy"), "yStart": 34, "width": 90 },
			{ "identifier": "Trader", "caption": translate("Traders"), "yStart": 34, "width": 90 }
		],
		"titleHeadings": [
			{
				"caption": sprintf(translate("Unit Statistics (%(trained)s / %(killed)s / %(captured)s / %(lost)s)"),
					{
						"trained": getColoredTypeTranslation("trained"),
						"killed": getColoredTypeTranslation("killed"),
						"captured": getColoredTypeTranslation("captured"),
						"lost": getColoredTypeTranslation("lost")
					}),
				"yStart": 16,
				"width": 90 * 9
			},	// width = 810
		],
		"counters": [
			{ "width": 90, "fn": calculateUnitsWithCaptured },
			{ "width": 90, "fn": calculateUnits },
			{ "width": 90, "fn": calculateUnits },
			{ "width": 90, "fn": calculateUnits },
			{ "width": 90, "fn": calculateUnits },
			{ "width": 90, "fn": calculateUnits },
			{ "width": 90, "fn": calculateUnitsWithCaptured },
			{ "width": 90, "fn": calculateUnits },
			{ "width": 90, "fn": calculateUnits },
			{ "width": 90, "fn": calculateUnits }
		],
		"teamCounterFn": calculateUnitsTeam
	},
	{
		"label": translate("Resources"),
		"headings": [
			{ "identifier": "playername", "caption": translate("Player name"), "yStart": 26, "width": 200 },
			{ "identifier": "total", "caption": translate("Total"), "yStart": 34, "width": 110 },
			...g_ResourceData.GetResources().map(res => ({
				"identifier": res.code,
				"caption": resourceNameFirstWord(res.code),
				"yStart": 34,
				"width": 110
			})),
			{
				"identifier": "tributes",
				"caption": translate("Tributes"),
				"headerCaption": sprintf(translate("Tributes \n(%(sent)s / %(received)s)"),
					{
						"sent": getColoredTypeTranslation("sent"),
						"received": getColoredTypeTranslation("received")
					}),
				"yStart": 0,
				"width": 110
			},
			{ "identifier": "treasuresCollected", "caption": translate("Treasures collected"), "yStart": 0, "width": 85 },
			{ "identifier": "loot", "caption": translate("Loot"), "yStart": 0, "width": 85 },
			{ "identifier": "livestock", "caption": translate("Livestock bred"), "yStart": 0, "width": 85 }
		],
		"titleHeadings": [
			{
				"caption": sprintf(translate("Resource Statistics (%(gathered)s / %(used)s)"),
					{
						"gathered": getColoredTypeTranslation("gathered"),
						"used": getColoredTypeTranslation("used")
					}),
				"yStart": 16,
				"width": 110 * g_ResourceData.GetCodes().length + 110
			},
		],
		"counters": [
			{ "width": 110, "fn": calculateTotalResources },
			...g_ResourceData.GetCodes().map(code => ({
				"fn": calculateResources,
				"width": 110
			})),
			{ "width": 110, "fn": calculateTributeSent },
			{ "width": 85, "fn": calculateTreasureCollected },
			{ "width": 85, "fn": calculateLootCollected },
			{ "width": 85, "fn": calculateLivestockTrained }
		],
		"teamCounterFn": calculateResourcesTeam
	},
	{
		"label": translate("Market"),
		"headings": [
			{ "identifier": "playername", "caption": translate("Player name"), "yStart": 26, "width": 200 },
			{ "identifier": "tradeIncome", "caption": translate("Trade income"), "yStart": 0, "width": 120 },
			{ "identifier": "barterEfficency", "caption": translate("Barter efficiency"), "yStart": 0, "width": 120, "format": "PERCENTAGE" },
			...g_ResourceData.GetResources().map(res => {
				return {
					"identifier": res.code,
					"caption":
						// Translation: use %(resourceWithinSentence)s if needed
						sprintf(translate("%(resourceFirstWord)s exchanged"), {
							"resourceFirstWord": resourceNameFirstWord(res.code),
							"resourceWithinSentence": resourceNameWithinSentence(res.code)
						}),
					"yStart": 0,
					"width": 120
				};
			})
		],
		"titleHeadings": [],
		"counters": [
			{ "width": 120, "fn": calculateTradeIncome },
			{ "width": 120, "fn": calculateBarterEfficiency },
			...g_ResourceData.GetCodes().map(code => ({
				"width": 120,
				"fn": calculateResourceExchanged
			}))
		],
		"teamCounterFn": calculateMarketTeam
	},
	{
		"label": translate("Miscellaneous"),
		"headings": [
			{ "identifier": "playername", "caption": translate("Player name"), "yStart": 26, "width": 200 },
			{ "identifier": "killDeath", "caption": translate("Kill / Death ratio"), "yStart": 0, "width": 110, "format": "DECIMAL2" },
			{ "identifier": "population", "caption": translate("Population"), "yStart": 0, "width": 110, "hideInSummary": true },
			{ "identifier": "mapControlPeak", "caption": translate("Map control (peak)"), "yStart": 0, "width": 110, "format": "PERCENTAGE" },
			{ "identifier": "mapControl", "caption": translate("Map control (finish)"), "yStart": 0, "width": 110, "format": "PERCENTAGE" },
			{ "identifier": "mapExploration", "caption": translate("Map exploration"), "yStart": 0, "width": 110, "format": "PERCENTAGE" },
			{ "identifier": "vegetarianRatio", "caption": translate("Vegetarian ratio"), "yStart": 0, "width": 110, "format": "PERCENTAGE" },
			{ "identifier": "civilianization", "caption": translate("Civilianization"), "yStart": 0, "width": 110, "format": "PERCENTAGE" },
			{
				"identifier": "bribes",
				"caption": translate("Bribes"),
				"headerCaption": sprintf(translate("Bribes\n(%(succeeded)s / %(failed)s)"),
					{
						"succeeded": getColoredTypeTranslation("succeeded"),
						"failed": getColoredTypeTranslation("failed")
					}),
				"yStart": 0,
				"width": 110
			}
		],
		"titleHeadings": [],
		"counters": [
			{ "width": 110, "fn": calculateKillDeathRatio },
			{ "width": 110, "fn": calculatePopulationCount, "hideInSummary": true },
			{ "width": 110, "fn": calculateMapPeakControl },
			{ "width": 110, "fn": calculateMapFinalControl },
			{ "width": 110, "fn": calculateMapExploration },
			{ "width": 110, "fn": calculateVegetarianRatio },
			{ "width": 110, "fn": calculateCivilianization },
			{ "width": 110, "fn": calculateBribes }
		],
		"teamCounterFn": calculateMiscellaneousTeam
	},


	{
		"label": translate("Techs (GodsEye)"),
		"headings": [
			{ "identifier": "playername", "caption": translate("Player name"), "yStart": 26, "width": 200 },
			{ "identifier": "killDeath", "caption": translate("Total"), "yStart": 0, "width": 110 },
			{ "identifier": "population", "caption": translate("Population"), "yStart": 0, "width": 110, "hideInSummary": true },
			{ "identifier": "mapControlPeak", "caption": translate("Map control (peak)"), "yStart": 0, "width": 110, "format": "PERCENTAGE" },
			{ "identifier": "mapControl", "caption": translate("Map control (finish)"), "yStart": 0, "width": 110, "format": "PERCENTAGE" },
			{ "identifier": "mapExploration", "caption": translate("Map exploration"), "yStart": 0, "width": 110, "format": "PERCENTAGE" },
			{ "identifier": "vegetarianRatio", "caption": translate("Vegetarian ratio"), "yStart": 0, "width": 110, "format": "PERCENTAGE" },
			{ "identifier": "civilianization", "caption": translate("Civilianization"), "yStart": 0, "width": 110, "format": "PERCENTAGE" },
			{
				"identifier": "bribes",
				"caption": translate("Bribes"),
				"headerCaption": sprintf(translate("Bribes\n(%(succeeded)s / %(failed)s)"),
					{
						"succeeded": getColoredTypeTranslation("succeeded"),
						"failed": getColoredTypeTranslation("failed")
					}),
				"yStart": 0,
				"width": 110
			}
		],
		"titleHeadings": [],
		"counters": [
			{ "width": 110, "fn": calculateKillDeathRatio },
			{ "width": 110, "fn": calculatePopulationCount, "hideInSummary": true },
			{ "width": 110, "fn": calculateMapPeakControl },
			{ "width": 110, "fn": calculateMapFinalControl },
			{ "width": 110, "fn": calculateMapExploration },
			{ "width": 110, "fn": calculateVegetarianRatio },
			{ "width": 110, "fn": calculateCivilianization },
			{ "width": 110, "fn": calculateBribes }
		],
		"teamCounterFn": calculateMiscellaneousTeam
	}
];

var g_ChartPanelsData = [
	{
		"label": translate("Charts")
	}
];

function getColoredTypeTranslation(type)
{
	return g_SummaryTypes[type].color ?
		coloredText(g_SummaryTypes[type].caption, g_SummaryTypes[type].color) :
		g_SummaryTypes[type].caption;
}

function resetGeneralPanel()
{
	for (let h = 0; h < g_MaxHeadingTitle; ++h)
	{
		Engine.GetGUIObjectByName("titleHeading[" + h + "]").hidden = true;
		Engine.GetGUIObjectByName("Heading[" + h + "]").hidden = true;
		for (let p = 0; p < g_MaxPlayers; ++p)
		{
			Engine.GetGUIObjectByName("valueData[" + p + "][" + h + "]").hidden = true;
			for (let t = 0; t < g_MaxTeams; ++t)
			{
				Engine.GetGUIObjectByName("valueDataTeam[" + t + "][" + p + "][" + h + "]").hidden = true;
				Engine.GetGUIObjectByName("valueDataTeam[" + t + "][" + h + "]").hidden = true;
			}
		}
	}
}

function updateGeneralPanelHeadings(allHeadings)
{
	const headings = allHeadings.filter(heading => !heading.hideInSummary);

	let left = 50;
	for (const h in headings)
	{
		let headerGUIName = "playerNameHeading";
		if (h > 0)
			headerGUIName = "Heading[" + (h - 1) + "]";

		const headerGUI = Engine.GetGUIObjectByName(headerGUIName);
		headerGUI.caption = headings[h].headerCaption || headings[h].caption;
		headerGUI.size = (left - 4) + " " + headings[h].yStart + " " + (left + headings[h].width + 4) + " 69";
		headerGUI.hidden = false;

		if (headings[h].width < g_LongHeadingWidth)
			left += headings[h].width;
	}
}

function updateGeneralPanelTitles(titleHeadings)
{
	let left = 250;
	for (const th in titleHeadings)
	{
		if (th >= g_MaxHeadingTitle)
			break;

		if (titleHeadings[th].xOffset)
			left += titleHeadings[th].xOffset;

		const headerGUI = Engine.GetGUIObjectByName("titleHeading[" + th + "]");
		headerGUI.caption = titleHeadings[th].caption;
		headerGUI.size = left + " " + titleHeadings[th].yStart + " " + (left + titleHeadings[th].width) + " 100%";
		headerGUI.hidden = false;

		if (titleHeadings[th].width < g_LongHeadingWidth)
			left += titleHeadings[th].width;
	}
}

function updateGeneralPanelCounter(allCounters)
{
	const counters = allCounters.filter(counter => !counter.hideInSummary);
	let rowPlayerObjectWidth = 0;

	for (let p = 0; p < g_MaxPlayers; ++p)
	{
		let left = 240;
		let counterObject;

		for (const w in counters)
		{
			counterObject = Engine.GetGUIObjectByName("valueData[" + p + "][" + w + "]");
			counterObject.size = left + " 0 " + (left + counters[w].width) + " 100%";
			counterObject.hidden = false;
			left += counters[w].width;
		}

		if (rowPlayerObjectWidth == 0)
			rowPlayerObjectWidth = left;

		let counterTotalObject;
		for (let t = 0; t < g_MaxTeams; ++t)
		{
			left = 240;
			for (const w in counters)
			{
				counterObject = Engine.GetGUIObjectByName("valueDataTeam[" + t + "][" + p + "][" + w + "]");
				counterObject.size = left + " 0 " + (left + counters[w].width) + " 100%";
				counterObject.hidden = false;

				if (g_Teams[t])
				{
					const yStart = 25 + g_Teams[t].length * (g_PlayerBoxYSize + g_PlayerBoxGap) + 3;
					counterTotalObject = Engine.GetGUIObjectByName("valueDataTeam[" + t + "][" + w + "]");
					const yStartTotal = 14 + g_Teams[t].length * (g_PlayerBoxYSize + g_PlayerBoxGap) + 10;
					counterTotalObject.size = (left + 20) + " " + yStartTotal + " " + (left + counters[w].width) + " " + (yStartTotal + 52);
					counterTotalObject.hidden = false;
				}

				left += counters[w].width;
			}
		}
	}
	return rowPlayerObjectWidth;
}

function updateGeneralPanelTeams()
{
	const withoutTeam = !g_Teams[-1] ? 0 : g_Teams[-1].length;

	if (!g_Teams || withoutTeam > 0)
		Engine.GetGUIObjectByName("noTeamsBox").hidden = false;

	if (!g_Teams)
		return;

	let yStart = g_TeamsBoxYStart + withoutTeam * (g_PlayerBoxYSize + g_PlayerBoxGap) + (withoutTeam ? 30 : 0);
	for (const i in g_Teams)
	{
		if (i == -1)
			continue;

		const teamBox = Engine.GetGUIObjectByName("teamBoxt["+i+"]");
		teamBox.hidden = false;
		teamBox.size.top = yStart;

		yStart += 30 + g_Teams[i].length * (g_PlayerBoxYSize + g_PlayerBoxGap) + 32;

		Engine.GetGUIObjectByName("teamNameHeadingt[" + i + "]").caption = "Team " + (+i + 1);

		const teamHeading = Engine.GetGUIObjectByName("teamHeadingt[" + i + "]");
		const yStartTotal = 14 + g_Teams[i].length * (g_PlayerBoxYSize + g_PlayerBoxGap) + 10;
		teamHeading.size = "50 " + yStartTotal + " 100% " + (yStartTotal + 52);
		teamHeading.caption = translate("Team total");
	}

	// If there are no players without team, hide "player name" heading
	if (!withoutTeam)
		Engine.GetGUIObjectByName("playerNameHeading").caption = "";
}

function initPlayerBoxPositions()
{
	for (let h = 0; h < g_MaxPlayers; ++h)
	{
		const playerBox = Engine.GetGUIObjectByName("playerBox[" + h + "]");
		playerBox.size.top += h * (g_PlayerBoxYSize + g_PlayerBoxGap);
		playerBox.size.bottom = playerBox.size.top + g_PlayerBoxYSize;

		for (let i = 0; i < g_MaxTeams; ++i)
		{
			const playerBoxt = Engine.GetGUIObjectByName("playerBoxt[" + i + "][" + h + "]");
			playerBoxt.size.top += h * (g_PlayerBoxYSize + g_PlayerBoxGap);
			playerBoxt.size.bottom = playerBoxt.size.top + g_PlayerBoxYSize;
		}
	}
}
