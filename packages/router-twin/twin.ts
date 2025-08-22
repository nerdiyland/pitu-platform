import { RpcError } from "aws-iot-device-sdk-v2/dist/eventstream_rpc";
import * as greengrasscoreipc from "aws-iot-device-sdk-v2/dist/greengrasscoreipc";
export class RouterTwin {
  public static readonly THING_NAME = "pitu-caleya";
  public static readonly ROUTER_IP = '192.168.1.1';
  
  async start () {
    console.log('Connecting to broker');
    const client  = await this.getIpcClient();

    console.log('Subscribing to router telemetry');
    const subscription = client.subscribeToTopic({
      topic: 'pitu/router/telemetry'
    }, undefined);

    subscription.on('message', async (message) => {
      if(message.binaryMessage && message.binaryMessage.message) {
        const receivedMessage = message.binaryMessage?.message.toString();
        try {
          const parsedMessage = JSON.parse(receivedMessage);

          console.log('Deleting stuff from data');
          delete parsedMessage.accesscontrol;
          delete parsedMessage.cradle;
          delete parsedMessage.custom;
          delete parsedMessage.eventlog;
          delete parsedMessage.failover;
          delete parsedMessage.general.supportedLangList;
          delete parsedMessage.lcd;
          delete parsedMessage.led;
          delete parsedMessage.mediaserver;
          delete parsedMessage.ready;
          delete parsedMessage.router;
          delete parsedMessage.session;
          delete parsedMessage.sim.end;
          delete parsedMessage.sim.mep;
          delete parsedMessage.sim.pin;
          delete parsedMessage.sim.puk;
          delete parsedMessage.sim.SPN;
          delete parsedMessage.sim.sprintSimLock;
          delete parsedMessage.sms.end;
          delete parsedMessage.sms.msgs;
          delete parsedMessage.sms.sendMsg;
          delete parsedMessage.sms.trans;
          delete parsedMessage.ui;
          delete parsedMessage.webd;
          delete parsedMessage.wifi.aux;
          delete parsedMessage.wwan.dataUsage;

          await this.run(parsedMessage);
        } catch (e) {
          console.error('Received a message that cannot be parsed');
          console.error(e);
        }
      }
    }); 

    subscription.on('streamError', (error: RpcError) => {
      console.error('There was an error configuring the stream');
      console.error(error);
    });

    subscription.on('ended', () => {
      console.log('Subscription closed');
    });

    await subscription.activate();
    console.log('Subscription activated. Awaiting for messages');
  }
  
  async run (config: any) {
    // Publish shadow
    this.publishShadow(config);
  }

  private async publishShadow (data: any) {
    try {
      const ipcClient = await this.getIpcClient();

      await ipcClient.updateThingShadow({
        payload: JSON.stringify({
          state: {
            reported: data
          }
        }),
        thingName: 'pitu-caleya',
        shadowName: 'net-lte'
      });

      console.log("Router twin shadow updated successfully");
      
    } catch (e) {
      // parse the error depending on your use cases
      throw e
    }
  }
  async getIpcClient(){
    try {
      const ipcClient = greengrasscoreipc.createClient();
      await ipcClient.connect()
      .catch(error => {
        // parse the error depending on your use cases
        throw error;
      });
      return ipcClient
    } catch (err) {
      // parse the error depending on your use cases
      throw err
    }
  }
}