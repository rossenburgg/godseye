function checkUsername(register)
{
	let oldpassword = Engine.GetGUIObjectByName("oldpassword").caption;
	if (!oldpassword)
		return translate("Please enter your old password");

        if (register && oldpassword.length < 8)
		return translate("Old password is incorrect");

        let password2 = Engine.GetGUIObjectByName("passwordRepeat").caption;
        if (password2 == oldpassword)
		return translate("You cannot use your old password as your new password");
	return "";
}

function checkPassword(register)
{
	let password = Engine.GetGUIObjectByName("password").caption;

	if (!password)
		return register ?
			translateWithContext("register", "Please enter your new password") :
			translateWithContext("login", "Please enter your password");

	if (register && password.length < 8)
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
