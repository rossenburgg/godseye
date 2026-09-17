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

		this.setupMenuButtons(this.mainMenuButtons.children, this.menuItems, true);
		this.setupHotkeys(this.menuItems);

		Engine.GetGUIObjectByName("closeMenuButton").onPress = this.closeSubmenu.bind(this);
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
			// PS5-style hover: tile scales up when hovered.
			// Store original for restore on mouse leave.
			button.onMouseEnter = () => {
				const w = origSize.rright - origSize.rleft;
				const h = origSize.rbottom - origSize.rtop;
				const cx = (origSize.rleft + origSize.rright) / 2;
				const cy = (origSize.rtop + origSize.rbottom) / 2;
				const scale = 1.18;
				const nw = w * scale;
				const nh = h * scale;
				button.size = {
					"rleft": cx - nw / 2,
					"rright": cx + nw / 2,
					"rtop": cy - nh / 2,
					"rbottom": cy + nh / 2
				};
				button.z = 100;
			};
			button.onMouseLeave = () => {
				button.size = origSize;
				button.z = 10;
			};
			left += tileW + gap;

			button.caption = item.caption;
			button.tooltip = item.tooltip;
			button.enabled = item.enabled === undefined || item.enabled();

			if (isTopLevel && this.tileIcons[i])
			{
				const icon = Engine.GetGUIObjectByName("mainMenuTileIcon[" + i + "]");
				if (icon)
					icon.sprite = this.tileIcons[i];
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
