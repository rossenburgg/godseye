/**
 * This class manages the button that allows the player to go to the forum.
 */
class AboutButton
{
	constructor()
	{
		this.aboutButton = Engine.GetGUIObjectByName("aboutButton");
		this.aboutButton.onPress = this.onPress.bind(this);
		this.aboutButton.caption = translate("Security");
	}

	onPress()
	{
		Engine.PushGuiPage("pageAbout.xml");
	}
}
