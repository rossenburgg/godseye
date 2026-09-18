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

		// Portrait card art per tile (art over navy strip).
		this.tileArt = [
			"DashboardCardArtLearn",
			"DashboardCardArtCampaign",
			"DashboardCardArtSingleplayer",
			"DashboardCardArtMultiplayer",
			"DashboardCardArtSettings",
			"DashboardCardArtEditor",
			"DashboardCardArtCredits",
			"DashboardCardArtCivtree",
			"DashboardCardArtManual",
			"DashboardCardArtExit"
		];

		// Dashboard: PS5-style focus zoom. Top-level cards are large portraits,
		// so their zoom stays subtle (1.12x); small submenu cards keep 1.5x.
		this.hoverScaleTop = 1.12;
		this.hoverScaleSub = 1.5;
		// Must init before setupMenuButtons (it registers animations).
		// Card descriptions in the mockup's navy/gold language (two lines each).
		this.tileSubtitles = [
			"Master the basics\nof warfare.",
			"Rewrite history's\ngreatest battles.",
			"Challenge the\nPetra AI.",
			"Face commanders\nfrom around the world.",
			"Tune your\nwar machine.",
			"Craft your own\nbattlefields.",
			"Honor those\nwho built it.",
			"Study every\ncivilization.",
			"Read the art\nof war.",
			"Leave the\nbattlefield."
		];
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

		this.hoveredButton = null; // any-level hover, for flicker-free idle resets
		this.submenuBackdrop = Engine.GetGUIObjectByName("submenuBackdrop");

		const playerPlateName = Engine.GetGUIObjectByName("playerPlateName");
		if (playerPlateName)
		{
			const playerName = Engine.ConfigDB_GetValue("user", "player.name") || "Player";
			playerPlateName.caption = playerName;
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

		// Tagline readout: hovering a card shows its title down here.
		this.dashboardTagline = Engine.GetGUIObjectByName("dashboardTagline");
		// Section header stays above hovered cards (declared after the grid too,
		// belt and suspenders: z when the engine honors it, order when it doesn't).
		const sectionTick = Engine.GetGUIObjectByName("dashboardSectionTick");
		const sectionLabel = Engine.GetGUIObjectByName("dashboardSectionLabel");
		if (sectionTick)
			sectionTick.z = 200;
		if (sectionLabel)
			sectionLabel.z = 200;

		// Vista parallax: 4 banner layers drifting on slow cosine waves, back layers
		// barely move and front layers move more (stock 0 A.D. background trick).
		// Amplitudes are in % of screen width; layers span -6%..106% so the
		// drift never exposes an edge.
		this.vistaLayers = [0, 1, 2, 3].map(i => Engine.GetGUIObjectByName("vistaLayer" + i));
		this.vistaCfg = [
			{ "amp": 0.5, "freq": 0.050 },
			{ "amp": 1.5, "freq": 0.050 },
			{ "amp": 3, "freq": 0.045 },
			{ "amp": 5, "freq": 0.040 },
		];
		this.vistaT0 = Date.now();

		this.mainMenu.onTick = this.tickAnimations.bind(this);
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
		this.tickVistaParallax();
		this.tickSubmenuSlide();
		this.tickLobbyWidget();
		// Deferred idle reset: only when the mouse has truly left every button.
		// (Avoids flicker when moving directly between neighboring tiles.)
		if (!this.hoveredButton)
		{
			// Background: while a submenu is open, keep its parent tile's art.
			// Otherwise base.
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
			{
				// Mirror the stock login page: StartXmppClient takes
				// (username, encryptedPassword, room, nick, history), and the
				// connection itself is opened by ConnectXmppClient.
				// lobby.password is stored encrypted; pass it through as-is.
				const login = Engine.ConfigDB_GetValue("user", "lobby.login");
				Engine.StartXmppClient(
					login,
					Engine.ConfigDB_GetValue("user", "lobby.password"),
					Engine.ConfigDB_GetValue("user", "lobby.room"),
					login,
					+Engine.ConfigDB_GetValue("user", "lobby.history"));
				Engine.ConnectXmppClient();
			}
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
				names.caption = "";
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
			"rleft": 17.5, "rtop": 42 + off, "rright": 82.5, "rbottom": 58 + off
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

	tickVistaParallax()
	{
		if (!this.vistaLayers[0])
			return;
		const t = (Date.now() - this.vistaT0) / 1000;
		for (let i = 0; i < this.vistaLayers.length; i++)
		{
			const cfg = this.vistaCfg[i];
			const d = cfg.amp * Math.cos(cfg.freq * t);
			this.vistaLayers[i].size = {
				"rleft": -6 + d, "rtop": 0, "rright": 106 + d, "rbottom": 30
			};
		}
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
			anim.yOff = anim.yOffStart + (anim.yOffTarget - anim.yOffStart) * eased;

			// Apply scale (centered) + lift to button size.
			// Lift is in % of the button row height; -1.0 reads as a clear rise.
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
				"rtop": cy - nh / 2 + anim.yOff,
				"rbottom": cy + nh / 2 + anim.yOff
			};

			// Hover ring: settle from 104% down to 100% so its arrival has a curve.
			if (anim.frameOver)
			{
				const ft = Math.min((now - anim.frameStart) / 250, 1.0);
				const fe = 1 - Math.pow(1 - ft, 3);
				const pad = -2 * (1 - fe);
				anim.frameOver.size = {
					"rleft": pad,
					"rtop": pad,
					"rright": 100 - pad,
					"rbottom": 100 - pad
				};
				if (ft >= 1.0)
					anim.frameOver = null;
			}

			if (t >= 1.0)
			{
				anim.scale = anim.target;
				anim.yOff = anim.yOffTarget;
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
		// Top level: 2 rows x 5 portrait cards (mockup layout), centered.
		// Submenus: single centered row (unchanged).
		const cols = isTopLevel ? 5 : menuItems.length;
		const tileW = isTopLevel ? 11.5 : 7;
		const gapX = isTopLevel ? 1.4 : 1.2;
		const totalW = cols * tileW + (cols - 1) * gapX;
		const startLeft = 50 - totalW / 2;
		// Row geometry is relative to the mainMenuButtons container (30-78.6%
		// of the screen); each row is 47.5% of it with a 5% gutter.
		const rowH = isTopLevel ? 47.5 : 100;
		const gapY = 5;

		buttons.forEach((button, i) => {
			const item = menuItems[i];
			button.hidden = !item;
			if (button.hidden)
				return;

			const row = isTopLevel ? Math.floor(i / 5) : 0;
			const col = isTopLevel ? i % 5 : i;
			const origSize = {
				"rleft": startLeft + col * (tileW + gapX),
				"rright": startLeft + col * (tileW + gapX) + tileW,
				"rtop": row * (rowH + gapY),
				"rbottom": row * (rowH + gapY) + rowH
			};
			button.size = origSize;
			// PS5-style hover: smooth 400ms ease-out to the focus scale.
			this.buttonAnims.set(button, {
				"scale": 1.0,
				"startScale": 1.0,
				"target": 1.0,
				"yOff": 0.0,
				"yOffStart": 0.0,
				"yOffTarget": 0.0,
				"frameOver": null,
				"frameStart": 0,
				"startTime": 0,
				"origSize": origSize
			});
			button.onMouseEnter = () => {
				const anim = this.buttonAnims.get(button);
				anim.startScale = anim.scale;
				anim.target = isTopLevel ? this.hoverScaleTop : this.hoverScaleSub;
				anim.yOffStart = anim.yOff;
				anim.yOffTarget = isTopLevel ? -1.0 : 0.0;
				anim.startTime = Date.now();
				button.z = 100;
				this.animatingButtons.add(button);
				this.hoveredButton = button;
				// Tagline readout: show the hovered card's title.
				if (isTopLevel && this.dashboardTagline)
					this.dashboardTagline.caption = this.resolveCaption(item).toUpperCase();
				if (isTopLevel && this.tileBackgrounds[i] && this.bgBase)
					this.swapBackground(this.tileBackgrounds[i], 1.06);
				// Gold frame glow on hover (mockup card language).
				if (isTopLevel)
				{
					const frameOver = Engine.GetGUIObjectByName("mainMenuTileFrameOver[" + i + "]");
					if (frameOver)
					{
						frameOver.hidden = false;
						anim.frameOver = frameOver;
						anim.frameStart = Date.now();
					}
				}
			};
			button.onMouseLeave = () => {
				const anim = this.buttonAnims.get(button);
				anim.startScale = anim.scale;
				anim.target = 1.0;
				anim.yOffStart = anim.yOff;
				anim.yOffTarget = 0.0;
				anim.startTime = Date.now();
				button.z = 10; // drop behind immediately so the newly hovered card draws on top
				this.animatingButtons.add(button);
				// Idle reset (panel + background) is deferred to tickAnimations so
				// moving between buttons doesn't flicker. See tickAnimations.
				if (this.hoveredButton === button)
					this.hoveredButton = null;
				// Tagline readout: restore the default once no card is hovered.
				if (!this.hoveredButton && this.dashboardTagline)
					this.dashboardTagline.caption = translate("FORGE YOUR LEGEND");
				if (isTopLevel)
				{
					const frameOver = Engine.GetGUIObjectByName("mainMenuTileFrameOver[" + i + "]");
					if (frameOver)
						frameOver.hidden = true;
					anim.frameOver = null;
				}
			};
			button.caption = this.resolveCaption(item);
			button.tooltip = item.tooltip;
			// Label drawn on top of the card art (button caption is hidden behind the art image).
			const label = Engine.GetGUIObjectByName("mainMenuTileCaption[" + i + "]");
			if (label)
				label.caption = this.resolveCaption(item);
			const labelShadow = Engine.GetGUIObjectByName("mainMenuTileCaptionShadow[" + i + "]");
			if (labelShadow)
				labelShadow.caption = this.resolveCaption(item);
			if (isTopLevel && this.tileSubtitles[i])
			{
				const subtitle = Engine.GetGUIObjectByName("mainMenuTileSubtitle[" + i + "]");
				if (subtitle)
					subtitle.caption = translate(this.tileSubtitles[i]);
			}
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
		// Dim the menu and park the card grid so hover can't leak through.
		if (this.submenuBackdrop)
			this.submenuBackdrop.hidden = false;
		this.mainMenuButtons.hidden = true;
		this.submenu.hidden = false;
		this.submenuAnim = { "startTime": Date.now() }; // gentle slide-up
	}

	closeSubmenu()
	{
		this.submenu.hidden = true;
		if (this.submenuBackdrop)
			this.submenuBackdrop.hidden = true;
		this.mainMenuButtons.hidden = false;
		this.lastOpenItem = undefined;
	}
}
