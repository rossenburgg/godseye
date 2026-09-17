/**
 * Resolver for the promise returned by init(). Resolving it closes this
 * child page (A28 pattern for pages opened with Engine.OpenChildPage).
 */
var g_CloseSecurityPage = null;

function init(data)
{
	Engine.GetGUIObjectByName("continue").caption = translate("Confirm");

	updateFeedback();

	return new Promise(resolve => {
		g_CloseSecurityPage = resolve;
	});
}

function updateFeedback()
{
	setFeedback(checkPassword(true) || checkPasswordConfirmation());
}

function checkPassword(updateFeedback)
{
	let password = Engine.GetGUIObjectByName("password").caption;

	if (updateFeedback && !password)
		return translate("Please enter your new password.");

	if (password.length < minimumPasswordLength)
		return translate("Please choose a longer password.");

	return "";
}

function checkPasswordConfirmation()
{
	let password = Engine.GetGUIObjectByName("password").caption;
	if (!password)
		return translate("Please enter your password again.");

	let passwordRepeat = Engine.GetGUIObjectByName("passwordRepeat").caption;
	if (password != passwordRepeat)
		return translate("Passwords do not match.");

	return "";
}

function continueButton()
{
	let feedback = checkPassword(false) || checkPasswordConfirmation();
	if (feedback)
	{
		setFeedback(feedback);
		return;
	}

	setFeedback(translate("Changing password…"));
	Engine.GetGUIObjectByName("continue").enabled = false;

	Engine.LobbyChangePassword(Engine.EncryptPassword(
		Engine.GetGUIObjectByName("password").caption,
		Engine.LobbyGetUsername()));
}

/**
 * Called when the server confirms the password change.
 */
function onPasswordChanged()
{
	let encryptedPassword = Engine.EncryptPassword(
		Engine.GetGUIObjectByName("password").caption,
		Engine.LobbyGetUsername());

	if (Engine.ConfigDB_GetValue("user", "lobby.rememberpassword") == "true")
		Engine.ConfigDB_CreateAndSaveValue("user", "lobby.password", encryptedPassword);
	else
		Engine.ConfigDB_RemoveValueAndSave("user", "lobby.password");

	setFeedback(translate("Password changed successfully."));
}
