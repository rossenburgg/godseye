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

		this.mainMenu.onTick = this.tickAnimations.bind(this);
	}

	tickAnimations()
	{
		this.tickButtonAnims();
		this.tickBackgroundZoom();
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
				if (isTopLevel && this.tileBackgrounds[i] && this.bgBase)
					this.swapBackground(this.tileBackgrounds[i], 1.06);
			};
			button.onMouseLeave = () => {
				const anim = this.buttonAnims.get(button);
				anim.startScale = anim.scale;
				anim.target = 1.0;
				anim.startTime = Date.now();
				this.animatingButtons.add(button);
				if (isTopLevel && this.bgBase)
					this.swapBackground("DashboardBackground", 1.0);
			};
			left += tileW + gap;

			button.caption = item.caption;
			button.tooltip = item.tooltip;
			button.enabled = item.enabled === undefined || item.enabled();

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
	}

	closeSubmenu()
	{
		this.submenu.hidden = true;
		this.lastOpenItem = undefined;
	}
}
