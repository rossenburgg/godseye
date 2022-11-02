from vidstream import AudioSender
from vidstream import AudioReceiver

import threading
import socket

ip = socket.gethostbyname(socket.gethostname()) #autoget ip address from reciever ips/pc
senderip = ""

receiver = AudioReceiver(senderip, 9999) # will be replaced with an actual ip of players
receive_thread = threading.Thread(target=receiver.start_server)

sender = AudioSender(ip , 2022)
sender_thread = threading.Thread(target=sender.start_stream)


receive_thread.start()
sender_thread.start()