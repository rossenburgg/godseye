/**
 * Dashboard-style main menu handler (PS5-inspired).
 * Lays out top-level items as a horizontal tile row; submenus open
 * as a second row beneath. Same public interface as the stock handler.
 */
export class MainMenuItemHandler
{
	constructor(closePageCallback, menuItems)
	{
		this.closePageCallback = closePageCallback;
		this.menuItems = menuItems;
		this.lastOpenItem = undefined;

		this.mainMenu = Engine.GetGUIObjectByName("mainMenu");
		this.mainMenuButtons = Engine.GetGUIObjectByName("mainMenuButtons");
		this.submenu = Engine.GetGUIObjectByName("submenu");
		this.submenuButtons = Engine.GetGUIObjectByName("submenuButtons");

		this.tileIcons = [
			"DashboardIconLearn",
			"DashboardIconCampaign",
			"DashboardIconSingleplayer",
			"DashboardIconMultiplayer",
			"DashboardIconSettings",
			"DashboardIconEditor",
			"DashboardIconCredits",
			"DashboardIconCivtree",
			"DashboardIconManual",
			"DashboardIconExit"
		];

		// GTA-style card art per tile.
		this.tileArt = [
			"DashboardArtLearn",
			"DashboardArtCampaign",
			"DashboardArtSingleplayer",
			"DashboardArtMultiplayer",
			"DashboardArtSettings",
			"DashboardArtEditor",
			"DashboardArtCredits",
			"DashboardArtCivtree",
			"DashboardArtManual",
			"DashboardArtExit"
		];

		// PS5-style hover: smooth 400ms ease-out, no overshoot.
		// Focus scale 1.5x (PS5 uses ~1.56x).
		// Must init before setupMenuButtons (it registers animations).
		this.buttonAnims = new Map();
		this.animatingButtons = new Set();

		// Per-tile background art: instant re-theme on hover (PS5-style).
		// (0ad GUI has no opacity property, so the swap is masked by a
		// smooth zoom punch instead of a cross-fade.)
		this.bgBase = Engine.GetGUIObjectByName("dashboardBackground");
		this.tileBackgrounds = [
			"DashboardBackgroundLearn",
			"DashboardBackgroundCampaign",
			"DashboardBackgroundSingleplayer",
			"DashboardBackgroundMultiplayer",
			"DashboardBackgroundSettings",
			"DashboardBackgroundEditor",
			"DashboardBackgroundCredits",
			"DashboardBackgroundCivtree",
			"DashboardBackgroundManual",
			"DashboardBackgroundExit"
		];
		this.bgZoom = { "scale": 1.0, "startScale": 1.0, "target": 1.0, "startTime": 0 };

		this.setupMenuButtons(this.mainMenuButtons.children, this.menuItems, true);
		this.setupHotkeys(this.menuItems);

		Engine.GetGUIObjectByName("closeMenuButton").onPress = this.closeSubmenu.bind(this);

		// PS5-style info panel + top-right utilities.
		this.tileInfoTitle = Engine.GetGUIObjectByName("tileInfoTitle");
		this.tileInfoDesc = Engine.GetGUIObjectByName("tileInfoDesc");
		this.hoveredButton = null; // any-level hover, for flicker-free idle resets
		this.infoPanelDefault = true;
		this.resetInfoPanel();

		const playerNameLabel = Engine.GetGUIObjectByName("playerNameLabel");
		if (playerNameLabel)
		{
			const playerName = Engine.ConfigDB_GetValue("user", "player.name") || "Player";
			playerNameLabel.caption = playerName;
		}

		const quickSettings = Engine.GetGUIObjectByName("quickSettingsButton");
		if (quickSettings)
			quickSettings.onPress = () => {
				// Find the Settings item by its Options submenu (robust to reorder).
				const idx = this.menuItems.findIndex(item =>
					item.submenu && item.submenu.some(sub => sub.caption === translate("Options")));
				if (idx >= 0)
					this.pressButton(this.menuItems[idx], idx, true); // toggles like the tile
			};

		// Lobby widget: who's online (opt-in). The handler owns the XMPP
		// connection; the Settings toggle only persists the preference.
		this.lobbyWidgetOptIn = false; // last seen toggle state
		this.lobbyWidgetState = "off"; // off | nocreds | connecting | connected | error
		this.lobbyWidgetTick = 0; // roster refresh countdown (ticks)

		this.mainMenu.onTick = this.tickAnimations.bind(this);
	}

	resetInfoPanel()
	{
		if (this.tileInfoTitle)
			this.tileInfoTitle.caption = translate("Choose your path");
		if (this.tileInfoDesc)
			this.tileInfoDesc.caption = translate("Hover a tile to see what lies ahead.");
		this.infoPanelDefault = true;
	}

	updateInfoPanel(item)
	{
		if (this.tileInfoTitle)
			this.tileInfoTitle.caption = this.resolveCaption(item);
		if (this.tileInfoDesc)
			this.tileInfoDesc.caption = item.tooltip;
		this.infoPanelDefault = false;
	}

	// Menu item captions are usually strings, but some (like the feedback
	// toggle) are functions so they can reflect live state each time they draw.
	resolveCaption(item)
	{
		return typeof item.caption == "function" ? item.caption() : item.caption;
	}

	tickAnimations()
	{
		// The stock user-report panel ("Help improve 0 A.D.") lives in the base
		// game's userreport.xml, outside our menupanel override. Hide it once here:
		// the first tick runs after the whole page (including userreport.xml) is
		// loaded, and the stock init code never unhides it, so this is stable.
		if (!this.userReportHidden)
		{
			this.userReportHidden = true;
			const userReport = Engine.GetGUIObjectByName("userReport");
			if (userReport)
				userReport.hidden = true;
		}
		this.tickButtonAnims();
		this.tickBackgroundZoom();
		this.tickSubmenuSlide();
		this.tickLobbyWidget();
		// Deferred idle reset: only when the mouse has truly left every button.
		// (Avoids flicker when moving directly between neighboring tiles.)
		if (!this.hoveredButton)
		{
			if (!this.infoPanelDefault)
				this.resetInfoPanel();
			// Background: while a submenu is open, keep its parent tile's art
			// (PS5 keeps the game backdrop across its hub). Otherwise base.
			const parentIdx = !this.submenu.hidden && this.lastOpenItem
				? this.menuItems.indexOf(this.lastOpenItem) : -1;
			if (parentIdx >= 0)
			{
				if (this.bgZoom.target !== 1.06)
					this.swapBackground(this.tileBackgrounds[parentIdx], 1.06);
			}
			else if (this.bgBase && this.bgZoom.target !== 1.0)
				this.swapBackground("DashboardBackground", 1.0);
		}
	}

	/**
	 * Opt-in lobby widget: keeps a background XMPP session while the main
	 * menu is open and shows who's online in the multiplayer lobby.
	 * Runs off the persisted "godseye.lobby_widget" preference so the
	 * Settings toggle needs no direct line to this handler.
	 */
	tickLobbyWidget()
	{
		const widget = Engine.GetGUIObjectByName("lobbyWidget");
		if (!widget)
			return;

		const rosterAvailable = typeof Engine.GetPlayerList == "function" &&
			typeof Engine.StartXmppClient == "function";
		const optIn = rosterAvailable &&
			Engine.ConfigDB_GetValue("user", "godseye.lobby_widget") === "true";

		// Toggle changed: connect or disconnect to match.
		if (optIn !== this.lobbyWidgetOptIn)
		{
			this.lobbyWidgetOptIn = optIn;
			if (optIn)
				this.lobbyWidgetConnect();
			else
				this.lobbyWidgetDisconnect();
			this.lobbyWidgetTick = 0; // refresh immediately
		}

		widget.hidden = !optIn;
		if (widget.hidden)
			return;

		// Roster refresh roughly every 10 seconds (ticks run per frame).
		if (this.lobbyWidgetTick <= 0)
		{
			this.lobbyWidgetTick = 600;
			this.lobbyWidgetRefresh();
		}
		else
			--this.lobbyWidgetTick;
	}

	lobbyWidgetWantsConnection()
	{
		return this.lobbyWidgetOptIn &&
			!!Engine.ConfigDB_GetValue("user", "lobby.login") &&
			!!Engine.ConfigDB_GetValue("user", "lobby.password");
	}

	lobbyWidgetIsConnected()
	{
		try { return typeof Engine.IsXmppClientConnected == "function" && Engine.IsXmppClientConnected(); }
		catch (e) { return false; }
	}

	lobbyWidgetConnect()
	{
		if (!this.lobbyWidgetWantsConnection())
		{
			this.lobbyWidgetState = "nocreds";
			return;
		}
		try
		{
			if (typeof Engine.HasXmppClient == "function" && Engine.HasXmppClient())
			{
				if (!this.lobbyWidgetIsConnected() && typeof Engine.ConnectXmppClient == "function")
					Engine.ConnectXmppClient();
			}
			else
				Engine.StartXmppClient(
					Engine.ConfigDB_GetValue("user", "lobby.login"),
					Engine.ConfigDB_GetValue("user", "lobby.password"));
			this.lobbyWidgetState = "connecting";
		}
		catch (e)
		{
			this.lobbyWidgetState = "error";
		}
	}

	lobbyWidgetDisconnect()
	{
		// Disconnect is enough for the toggle; the Game Lobby button uses a
		// full Stop so the stock flow starts from a clean slate.
		if (typeof Engine.DisconnectXmppClient == "function")
			try { Engine.DisconnectXmppClient(); } catch (e) {}
		else if (typeof Engine.StopXmppClient == "function")
			try { Engine.StopXmppClient(); } catch (e) {}
		this.lobbyWidgetState = "off";
	}

	lobbyWidgetRefresh()
	{
		const title = Engine.GetGUIObjectByName("lobbyWidgetTitle");
		const count = Engine.GetGUIObjectByName("lobbyWidgetCount");
		const names = Engine.GetGUIObjectByName("lobbyWidgetNames");
		if (!title || !count || !names)
			return;

		title.caption = translate("LOBBY");

		if (this.lobbyWidgetState == "nocreds")
		{
			count.caption = translate("Not connected");
			names.caption = translate("Log into the lobby once (remember password) to see who's online.");
			return;
		}
		if (this.lobbyWidgetState == "error")
		{
			count.caption = translate("Connection failed");
			names.caption = "";
			return;
		}

		// Self-heal: re-establish a dropped session on each refresh.
		if (this.lobbyWidgetWantsConnection() && !this.lobbyWidgetIsConnected())
			this.lobbyWidgetConnect();

		let players = [];
		try { players = Engine.GetPlayerList() || []; }
		catch (e) { players = []; }
		// Normalize: the roster may be strings or {name/nick} objects.
		const nicks = players
			.map(p => typeof p == "string" ? p : (p && (p.name || p.nick || p.username)) || "")
			.filter(n => !!n);

		if (!nicks.length)
		{
			if (this.lobbyWidgetIsConnected())
			{
				count.caption = translate("0 online");
				// Debug: reveal the raw roster shape so normalization can be fixed.
				try
				{
					const first = players[0];
					const shape = first === undefined ? "undefined" :
						typeof first != "object" ? typeof first :
						"keys(" + Object.keys(first).join(",") + ")";
					log("Godseye roster: n=" + players.length + " shape=" + shape +
						" first=" + JSON.stringify(first).slice(0, 500));
					names.caption = players.length ? "shape: " + shape : "";
				}
				catch (e) { names.caption = ""; }
			}
			else
			{
				count.caption = translate("Connecting...");
				names.caption = "";
			}
			return;
		}
		this.lobbyWidgetState = "connected";
		count.caption = nicks.length + " " + translate("online");
		const shown = nicks.slice(0, 8);
		names.caption = shown.join("\n") +
			(nicks.length > 8 ? "\n+" + (nicks.length - 8) + " " + translate("more") : "");
	}

	/**
	 * Submenu slides up gently on open (250ms ease-out).
	 */
	tickSubmenuSlide()
	{
		if (!this.submenuAnim || this.submenu.hidden)
		{
			this.submenuAnim = null;
			return;
		}
		const t = Math.min((Date.now() - this.submenuAnim.startTime) / 250, 1.0);
		const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
		const off = 4 * (1 - eased); // starts 4% lower, settles into place
		this.submenu.size = {
			"rleft": 0, "rtop": 60 + off, "rright": 100, "rbottom": 74 + off
		};
		if (t >= 1.0)
			this.submenuAnim = null;
	}

	/**
	 * Smooth zoom punch that masks the instant background sprite swap.
	 * 350ms ease-out, settles at 1.06 while a tile is hovered.
	 */
	swapBackground(spriteName, zoomTarget)
	{
		if (!this.bgBase)
			return;
		this.bgBase.sprite = spriteName;
		this.bgZoom.startScale = this.bgZoom.scale;
		this.bgZoom.target = zoomTarget;
		this.bgZoom.startTime = Date.now();
	}

	tickBackgroundZoom()
	{
		if (!this.bgBase)
			return;
		const z = this.bgZoom;
		if (z.scale === z.target)
			return;

		const duration = 350;
		const t = Math.min((Date.now() - z.startTime) / duration, 1.0);
		const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
		z.scale = z.startScale + (z.target - z.startScale) * eased;

		// Centered zoom via relative size (matches tile animation pattern).
		const m = (z.scale - 1.0) * 50; // margin % on each side
		this.bgBase.size = {
			"rleft": -m, "rtop": -m, "rright": 100 + m, "rbottom": 100 + m
		};

		if (t >= 1.0)
			z.scale = z.target;
	}

	tickButtonAnims()
	{
		if (this.animatingButtons.size === 0)
			return;

		const now = Date.now();
		const duration = 400; // PS5 signature: 400ms

		for (const button of this.animatingButtons)
		{
			const anim = this.buttonAnims.get(button);
			const t = Math.min((now - anim.startTime) / duration, 1.0);
			// Ease-out cubic: 1 - (1-t)^3. Smooth glide, no overshoot.
			const eased = 1 - Math.pow(1 - t, 3);
			anim.scale = anim.startScale + (anim.target - anim.startScale) * eased;

			// Apply scale to button size (centered)
			const o = anim.origSize;
			const w = o.rright - o.rleft;
			const h = o.rbottom - o.rtop;
			const cx = (o.rleft + o.rright) / 2;
			const cy = (o.rtop + o.rbottom) / 2;
			const nw = w * anim.scale;
			const nh = h * anim.scale;
			button.size = {
				"rleft": cx - nw / 2,
				"rright": cx + nw / 2,
				"rtop": cy - nh / 2,
				"rbottom": cy + nh / 2
			};

			if (t >= 1.0)
			{
				anim.scale = anim.target;
				if (anim.target === 1.0)
				{
					button.size = anim.origSize; // snap to exact
					button.z = 10;
				}
				this.animatingButtons.delete(button);
			}
		}
	}

	setupMenuButtons(buttons, menuItems, isTopLevel)
	{
		// Horizontal layout: tiles in a centered row.
		// Use rleft/rright for percentage positioning.
		const tileW = isTopLevel ? 8 : 7;
		const gap = 1.2;
		const totalW = menuItems.length * tileW + (menuItems.length - 1) * gap;
		let left = 50 - totalW / 2;

		buttons.forEach((button, i) => {
			const item = menuItems[i];
			button.hidden = !item;
			if (button.hidden)
				return;

			const origSize = {
				"rleft": left,
				"rright": left + tileW,
				"rtop": 0,
				"rbottom": 100
			};
			button.size = origSize;
			// PS5-style hover: smooth 400ms ease-out to 1.5x.
			this.buttonAnims.set(button, {
				"scale": 1.0,
				"startScale": 1.0,
				"target": 1.0,
				"startTime": 0,
				"origSize": origSize
			});
			button.onMouseEnter = () => {
				const anim = this.buttonAnims.get(button);
				anim.startScale = anim.scale;
				anim.target = 1.5;
				anim.startTime = Date.now();
				button.z = 100;
				this.animatingButtons.add(button);
				this.hoveredButton = button;
				this.updateInfoPanel(item);
				if (isTopLevel && this.tileBackgrounds[i] && this.bgBase)
					this.swapBackground(this.tileBackgrounds[i], 1.06);
			};
			button.onMouseLeave = () => {
				const anim = this.buttonAnims.get(button);
				anim.startScale = anim.scale;
				anim.target = 1.0;
				anim.startTime = Date.now();
				button.z = 10; // drop behind immediately so the newly hovered card draws on top
				this.animatingButtons.add(button);
				// Idle reset (panel + background) is deferred to tickAnimations so
				// moving between buttons doesn't flicker. See tickAnimations.
				if (this.hoveredButton === button)
					this.hoveredButton = null;
			};
			left += tileW + gap;

			button.caption = this.resolveCaption(item);
			button.tooltip = item.tooltip;
			// Label drawn on top of the card art (button caption is hidden behind the art image).
			const label = Engine.GetGUIObjectByName("mainMenuTileCaption[" + i + "]");
			if (label)
				label.caption = this.resolveCaption(item);
			const labelShadow = Engine.GetGUIObjectByName("mainMenuTileCaptionShadow[" + i + "]");
			if (labelShadow)
				labelShadow.caption = this.resolveCaption(item);
			button.enabled = item.enabled === undefined || item.enabled();
			// Dim disabled tiles (e.g. Continue Campaign with no save) so they read as unavailable.
			if (isTopLevel)
			{
				const dim = Engine.GetGUIObjectByName("mainMenuTileDim[" + i + "]");
				if (dim)
					dim.hidden = button.enabled;
			}

			if (isTopLevel && this.tileIcons[i])
			{
				const icon = Engine.GetGUIObjectByName("mainMenuTileIcon[" + i + "]");
				if (icon)
					icon.sprite = this.tileArt[i] || this.tileIcons[i];
			}

			button.onPress = this.pressButton.bind(this, item, i, isTopLevel);
		});

		if (buttons.length < menuItems.length)
			error("GUI page has space for " + buttons.length + " menu buttons, but " + menuItems.length + " items are provided!");
	}

	pressButton(item, i, isTopLevel)
	{
		if (!isTopLevel)
		{
			this.closeSubmenu();
			if (item.onPress)
				item.onPress(this.closePageCallback);
			return;
		}

		if (this.submenu.hidden || this.lastOpenItem !== item)
			this.performButtonAction(item, i);
		else
		{
			this.closeSubmenu();
			this.lastOpenItem = undefined;
		}
	}

	performButtonAction(item, i)
	{
		this.lastOpenItem = item;

		if (item.onPress)
			item.onPress(this.closePageCallback);
		else if (item.submenu)
			this.openSubmenu(i);
	}

	setupHotkeys(menuItems)
	{
		for (const i in menuItems)
		{
			const item = menuItems[i];
			if (item.onPress && item.hotkey)
				Engine.SetGlobalHotkey(item.hotkey, "Press", () => {
					this.closeSubmenu();
					item.onPress();
				});

			if (item.submenu)
				this.setupHotkeys(item.submenu);
		}
	}

	openSubmenu(i)
	{
		const sub = this.menuItems[i].submenu;
		if (!sub || !sub.length)
			return;

		this.setupMenuButtons(this.submenuButtons.children, sub, false);
		this.submenu.hidden = false;
		this.submenuAnim = { "startTime": Date.now() }; // gentle slide-up
	}

	closeSubmenu()
	{
		this.submenu.hidden = true;
		this.lastOpenItem = undefined;
	}
}
