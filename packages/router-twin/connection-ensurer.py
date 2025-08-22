#!/usr/bin/python3
import requests
import json
import time
import datetime

from awsiot.greengrasscoreipc.clientv2 import GreengrassCoreIPCClientV2
from awsiot.greengrasscoreipc.model import (
	PublishMessage,
	BinaryMessage
)

ip = "192.168.1.1"
pwd = "<YOUR-ROUTER-PASSWORD>"

url_session = "http://{}/sess_cd_tmp".format(ip)
url_js_token = "http://{}/js/NetgearStrings.js".format(ip)
url_config = "http://{}/Forms/config".format(ip)
url_json = "http://{}/api/model.json".format(ip)
url_json_success = "http://{}/success.json".format(ip)
url_success = "http://{}/index.html".format(ip)
timeout = 3
first_run = True 

def router_reachable(r):
	global first_run
	try:
		s = r.get(url_session, timeout=timeout)
		first_run = False
		if s.status_code != 200:
			raise ValueError("Wrong status code")
		print("Connect OK.")
	except:
		print("MR1100 unreachable. Wrong IP?")
		exit(1)

def login(r):
	print("Logging user in")
	try:
		print("Starting session")
		s = r.get(url_session, timeout=timeout)
	except:
		print("Connection failed. Wrong IP?")
		time.sleep(2)

	try:
		print("Obtaining token")
		js = json.loads(r.get(url_json, timeout=timeout).text)
		global token
		token = js['session']['secToken']
		print("Token obtained")

		data = {
			'token': token,
			'err_redirect': '/index.html?loginfailed',
			'ok_redirect': '/index.html',
			'session.password': pwd,
		}
	except:
		print("Token computation failed.")
	
	login_success = False

	try:
		print("Attempting login")
		redirect_url = r.post(url_config, data=data, timeout=timeout).url
		if redirect_url == url_success:
			print("Login ok")
			login_success = True
		else:
			print("Failed to authenticate, incorrect password?")
			exit(1)

		return login_success
	except:
		print("Connection failed.")


def get_status(r):
	try:
		json_model = json.loads(r.get(url_json, timeout=10).text)
		return json_model
	except:
		print("Cannot retrieve connection status.")


def reconnect(r):
	try:
		disconnect = {
			'token': token,
			'err_redirect': '/error.json',
			'ok_redirect': '/success.json',
			'wwan.autoconnect': 'Never',
		}
		connect = {
			'token': token,
			'err_redirect': '/error.json',
			'ok_redirect': '/success.json',
			'wwan.autoconnect': 'HomeNetwork',
		}

		push = r.post(url_config, data=disconnect, timeout=timeout)
		push2 = r.post(url_config, data=connect, timeout=timeout)
		if push.url != url_json_success:
			print("Failed to disconnect.")
		elif push2.url != url_json_success:
			print("Failed to reconnect.")
	except:
		print("Connection failed.")
	
def publish_status(status):
	print("Connecting to Greengrass...")
	topic="pitu/router/telemetry"
	ipc_client = GreengrassCoreIPCClientV2()
	publish_binary_message_to_topic(ipc_client, topic, status)
	print('Successfully published to topic: ' + topic)

def publish_binary_message_to_topic(ipc_client, topic, message):
	binary_message = BinaryMessage(message=bytes(message, 'utf-8'))
	publish_message = PublishMessage(binary_message=binary_message)
	return ipc_client.publish_to_topic(topic=topic, publish_message=publish_message)


def main():
	print("Starting system")
	r = requests.Session()

	if first_run:
		print("Reaching out to router")
		router_reachable(r)

	print("Logging user in")
	login(r)

	print("Verifying status")
	raw_status = get_status(r)
	status = raw_status['wwan']['connection']

	print("Publishing status")
	publish_status(json.dumps(raw_status))
	
	if status != "Connected":
		print("System is not connected.")
		# reconnected = False
		# while not reconnected:
		# 	reconnect(r)
		# 	time.sleep(5)
		# 	status = get_status(r)
		# 	if status == "Connected":
		# 		timestamp = datetime.datetime.now()
		# 		s = "Reconnect successful {}".format(timestamp)
		# 		reconnected = True
		# 		print(s)
		# 	else:
		# 		print("Reconnect failed")
	else:
		print("System is connected")
	time.sleep(30)

if __name__ == '__main__':
	print("Starting loop")
	while True:
		print("Iterating")
		try:
			main()
		except SystemExit as e:
			print("Exit requested")
			print(e)
			exit(1)
		except:
			time.sleep(2)
			main()
