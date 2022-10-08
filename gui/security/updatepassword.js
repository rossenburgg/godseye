function checkUpdatedcrendentials(changepassword)
{

	let hasXmppClient = Engine.HasXmppClient();

	if (hasXmppClient = true) {
		warn("You have xmpp enabled");
	}


	let oldpassword = Engine.GetGUIObjectByName("oldpassword").caption;
	if (!oldpassword)
		return translate("Please enter your old password");

        if (changepassword && oldpassword.length < 8)
		return translate("Old password is incorrect");

        let password2 = Engine.GetGUIObjectByName("passwordRepeat").caption;
        if (password2 == oldpassword)
		return translate("You cannot use your old password as your new password");
	return "";
}

function checkPassword(changepassword)
{
	let password = Engine.GetGUIObjectByName("password").caption;

	if (!password)
		return changepassword ?
			translateWithContext("confirmnewpassword", "Please enter your new password") :
			translateWithContext("newpassword", "Please enter your password");

	if (changepassword && password.length < 8)
		return translate("Please choose a longer password");

	return "";
}

function checkPasswordConfirmation()
{
	let password1 = Engine.GetGUIObjectByName("password").caption;
	if (!password1)
		return translate("Please enter your new password");

	let password2 = Engine.GetGUIObjectByName("passwordRepeat").caption;
	if (password1 != password2)
		return translate("New passwords do not match");

       
        

	return "";
}


function getEncryptedPassword()
{
	let typedUnencryptedPassword = Engine.GetGUIObjectByName("password").caption;
	let storedEncryptedPassword = Engine.ConfigDB_GetValue("user", "lobby.password");

	if (typedUnencryptedPassword == storedEncryptedPassword.substr(0, 10))
		return storedEncryptedPassword;

	return Engine.EncryptPassword(
		typedUnencryptedPassword,
		Engine.GetGUIObjectByName("username").caption);
}

function saveCredentials()
{

	if (Engine.ConfigDB_GetValue("user", "lobby.rememberpassword") == "true")
		Engine.ConfigDB_CreateAndWriteValueToFile("user", "lobby.password", getEncryptedPassword(), "config/user.cfg");
	else
	{
		Engine.ConfigDB_RemoveValue("user", "lobby.password");
		Engine.ConfigDB_WriteFile("user", "config/user.cfg");
	}
}


function init() {
	g_LobbyMessages.passwordupdated = onPasswordUpdated;

	Engine.GetGUIObjectByName("continue").caption = translate("Confirm");

	updateFeedback();

}

function updateFeedback()
{
	setFeedback(checkUpdatedcrendentials(true) || checkPassword(true) || checkPasswordConfirmation() || checkTerms());
}

function onUsernameEdit()
{
	updateFeedback();
}

function continueButton()
{
	
	setFeedback(translate("Please wait..."));

	Engine.StartRegisterXmppClient(
		Engine.GetGUIObjectByName("username").caption,
		getEncryptedPassword());

	Engine.ConnectXmppClient();
}

function onPasswordUpdated()
{
	saveCredentials();

	setFeedback(translate("Registered"));

	Engine.StopXmppClient();

	Engine.PopGuiPage();
	Engine.PushGuiPage("page_prelobby_login.xml");
}
