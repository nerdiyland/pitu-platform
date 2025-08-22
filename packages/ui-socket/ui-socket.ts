import { RpcError } from "aws-iot-device-sdk-v2/dist/eventstream_rpc";
import * as greengrasscoreipc from "aws-iot-device-sdk-v2/dist/greengrasscoreipc";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
export class UiSocket {
  public static readonly THING_NAME = 'pitu-caleya';
  
  async start () {
    console.log('Connecting to broker');
    const ggClient  = await this.getIpcClient();

    console.log('Subscribing to router telemetry');

    // Create server
    const server = createServer();
    const io = new Server(server, {
      cors: {
        origin: '*'
      }
    });
    io.on('connection', async (client) => {
      console.log('Client connected');

      console.log(`Subscribing to shadow updates`);
      const subscription = ggClient.subscribeToTopic({
        topic: `$aws/things/${UiSocket.THING_NAME}/shadow/name/+/update/accepted`
      }, undefined);

      const decoder = new TextDecoder();
      subscription.on('message', async (message) => {
        if (message.binaryMessage) {
          const topic = message.binaryMessage!.context!.topic!;
          const payloadStr = message.binaryMessage.message!;

          const payload = decoder.decode(payloadStr! as any);

          client.emit(topic, payload);
        } else {
          const topic = message.jsonMessage!.context!.topic!;
          const payload = message.jsonMessage!.message!;
  
          client.emit(topic, JSON.stringify(payload));
        }
      }); 

      subscription.on('streamError', (error: RpcError) => {
        console.error('There was an error configuring the stream');
        console.error(error);
      });
  
      subscription.on('ended', () => {
        console.log('Subscription closed');
      });
  
      console.log(`Subscription activated`);
      await subscription.activate();

      console.log(`Subscribing to local socket updates`);
      client.onAny(async (event, ...args) => {
        const payload = args[0];
        console.log(`Event received on ${event} topic. Payload: ${JSON.stringify(payload)}.`);
        await ggClient.publishToTopic({
          topic: event,
          publishMessage: {
            jsonMessage: {
              context: event,
              message: payload
            }
          }
        });
      });

      const availableShadowsResponse = await ggClient.listNamedShadowsForThing({
        thingName: UiSocket.THING_NAME,
        pageSize: 100,
      });
  
      // Send initial update
      const availableShadows = availableShadowsResponse.results;
      await Promise.all(availableShadows.map(async (shadow, index) => {
        console.log(`Submitting shadow ${shadow} update`);
        return new Promise(resolve => {
          setTimeout(async () => {
            await this.sendShadowUpdate(shadow, client, ggClient);
            resolve(null);
          }, 1000 * index);
        })
      }))
        
    });

    server.listen(9999);
  }

  async sendShadowUpdate (shadowName: string, client: Socket, ggClient: greengrasscoreipc.Client, data?: any) {

    if (!data) {
      console.log(`Fetching shadow ${shadowName}`);
      const shadowResponse = await ggClient.getThingShadow({
        thingName: UiSocket.THING_NAME,
        shadowName,
      });
  
      console.log(`Submitting update for shadow ${shadowName}`);
      const shadowState = shadowResponse.payload.toString();
      data = shadowState;
    }
    client.emit(`shadows:${shadowName}`, data);
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