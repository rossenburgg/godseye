/**
 * Formats a chat message sent by a player (i.e. not a chat notification),
 * accounting for chat format commands such as /me or /say and private messages.
 *
 * Plays an acoustic notification if the playername was mentioned
 */


class ChatMessageFormat
{
	constructor()
	{
		this.chatMessageFormatMe = new ChatMessageFormatMe();
		this.chatMessageFormatSay = new ChatMessageFormatSay();
		this.chatMessagePrivateWrapper = new ChatMessagePrivateWrapper();
	}

	/**
	 * Message properties: from, text, historic, optionally private
	 */
	format(message)
	{
		const defbot = ["Busy: Can't talk right now, busy doing some wiring at the moment. Will get intouch when im free.",
	"Busy: Sorry can't play right now, i'm coding. Already seeing series of errors on my pc, do not disturb", "Busy: I'm not available, squishing some bugs at the moment, already drunk 5 cup of coffee :(",
	"Busy: I'm not available", "Away: Psss! Taking a break, will get intouch when im free, for now im away from the pc.", "Automated Message: Uhm, maybe another time? Busy at the moment.", "Busy: N/A"
	];

	
	// const inspireNotice = "QuotesBot: Hey, type " + "'!quote'" + " to get famouse quotes and inspirational messages"
	// ;
	// const defbotInspire = ["When you have a dream, you've got to grab it and never let go. — Carol Burnett", "Nothing is impossible. The word itself says 'I'm possible!' — Audrey Hepburn",
	// "There is nothing impossible to they who will try. — Alexander the Great", "The bad news is time flies. The good news is you're the pilot. — Michael Altshuler",
	// "Life has got all those twists and turns. You've got to hold on tight and off you go. — Nicole Kidman", "Keep your face always toward the sunshine, and shadows will fall behind you. — Walt Whitman",
	// "Be courageous. Challenge orthodoxy. Stand up for what you believe in. When you are in your rocking chair talking to your grandchildren many years from now, be sure you have a good story to tell. — Amal Clooney",
	// "You make a choice: continue living your life feeling muddled in this abyss of self-misunderstanding, or you find your identity independent of it. You draw your own box. — Duchess Meghan",
	// "I just want you to know that if you are out there and you are being really hard on yourself right now for something that has happened ... it's normal. \n That is what is going to happen to you in life. No one gets through unscathed. We are all going to have a few scratches on us. Please be kind to yourselves and stand up for yourself, please. — Taylor Swift",
	// "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill"

	// ];

	// const random = Math.floor(Math.random() * defbot.length);
	// const random2 = Math.floor(Math.random() * defbotInspire.length);
	// 	let text = escapeText(message.text);
	// 	let naime = "Defc0n";
		
	// 	if (g_Nickname != message.from )
	// 	{
	// 		// Highlight nicknames, assume they do not contain escapaped characters
	// 		text = text.replace(g_Nickname, PlayerColor.ColorPlayerName(g_Nickname));

	// 		// Notify local player
	// 		if (!message.historic && text.toLowerCase().indexOf(g_Nickname.toLowerCase()) != -1)
	// 			soundNotification("nick");
				
	// 			/* if (text.includes(("defc0n" || naime))){
	// 				Engine.LobbySendMessage( defbot[random]), {once : true};
	// 			} */

	// 			if (text.includes("!quote" || "!quotes")){
	// 				Engine.LobbySendMessage( defbotInspire[random2]), {once : true};
	// 			}

	// 			if (text.includes("inspire","inspires", "Inspire")){
	// 				Engine.LobbySendMessage( inspireNotice, {once : true});
	// 			}

	// 			if (text.includes("!quote" || "!quotes") >= 5  ){
	// 				Engine.LobbySendMessage( "Limit Exceeded");
	// 				return;
	// 			}

				/*
				if (text.includes("!mutex ~Defc0n")){
					Engine.LobbySendMessage("~Defc0n has been muted");
				}

				if (text.includes("!unmutex ~Defc0n")){
					Engine.LobbySendMessage("~Defc0n has been unmuted");
					Engine.LobbySendMessage("Role:" + Engine.LobbyGetPlayerRole("~Defc0n"))
				}

				if (text.includes("!Role Stan`")){
					Engine.LobbySendMessage("Role: " + Engine.LobbyGetPlayerRole("stanleysweet"));
				}

				if (text.includes("!Role ~Defc0n")){
					Engine.LobbySendMessage("Role: " + Engine.LobbyGetPlayerRole("~Defc0n"));
				}

				if (text.includes("!mutelistx")){
					let muteList = ("~Defc0n");
					Engine.LobbySendMessage("Muted Players: " + muteList);
				}

				if (text.includes("!ghost Pen1s_Collider")){
					Engine.LobbySendMessage("Failed to ghost. Reason: name contains inapproriate words'" );
					// Engine.LobbySetNick("stanleysweet");
				}

		// 		*/
		// }

		let sender = PlayerColor.ColorPlayerName(message.from, undefined, Engine.LobbyGetPlayerRole(message.from));

		// Handle chat format commands
		let formattedMessage;
		let index = text.indexOf(" ");
		if (text.startsWith("/") && index != -1)
		{
			let command = text.substr(1, index - 1);
			let commandText = text.substr(index + 1);

			switch (command)
			{
			case "me":
			{
				formattedMessage = this.chatMessageFormatMe.format(sender, commandText);
				break;
			}
			case "say":
			{
				formattedMessage = this.chatMessageFormatSay.format(sender, commandText);
				break;
			}
			default:
			{
				formattedMessage = this.chatMessageFormatSay.format(sender, text);
				break;
			}
			}
		}
		else
			formattedMessage = this.chatMessageFormatSay.format(sender, text);

		if (message.level == "private-message")
			formattedMessage = this.chatMessagePrivateWrapper.format(formattedMessage);

		return formattedMessage;
	}
}
