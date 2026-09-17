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

		// Spring physics for PS5-style hover animations.
		// Stiffness 350, damping 22: snappy with a hint of overshoot.
		// Animation state stored here (GUI objects have no userData).
		this.buttonAnims = new Map();
		this.animatingButtons = new Set();
		this.lastTick = Date.now();
		this.mainMenu.onTick = this.tickAnimations.bind(this);
	}

	tickAnimations()
	{
		if (this.animatingButtons.size === 0)
			return;

		const now = Date.now();
		const dt = Math.min((now - this.lastTick) / 1000, 0.05); // clamp to 50ms
		this.lastTick = now;

		const stiffness = 350;
		const damping = 22;

		for (const button of this.animatingButtons)
		{
			const anim = this.buttonAnims.get(button);
			// Spring: F = -k(x - target) - c*v
			const F_spring = -stiffness * (anim.scale - anim.target);
			const F_damp = -damping * anim.velocity;
			const a = F_spring + F_damp;
			anim.velocity += a * dt;
			anim.scale += anim.velocity * dt;

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

			// Stop when settled
			if (Math.abs(anim.scale - anim.target) < 0.001 && Math.abs(anim.velocity) < 0.001)
			{
				anim.scale = anim.target;
				anim.velocity = 0;
				button.size = anim.origSize; // snap to exact
				if (anim.target === 1.0)
					button.z = 10;
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
			// PS5-style hover: spring-physics scale animation.
			this.buttonAnims.set(button, {
				"scale": 1.0,
				"velocity": 0.0,
				"target": 1.0,
				"origSize": origSize
			});
			button.onMouseEnter = () => {
				this.buttonAnims.get(button).target = 1.18;
				button.z = 100;
				this.animatingButtons.add(button);
				this.lastTick = Date.now();
			};
			button.onMouseLeave = () => {
				this.buttonAnims.get(button).target = 1.0;
				this.animatingButtons.add(button);
				this.lastTick = Date.now();
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
