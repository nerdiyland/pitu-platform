import { BillingMode, DynamoDB, KeyType, ScalarAttributeType } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import * as greengrasscoreipc from "aws-iot-device-sdk-v2/dist/greengrasscoreipc";
import bodyParser from "body-parser";
import express from "express";
import { readFileSync, writeFileSync } from "fs";
import { v4 as uuid } from "uuid";

const dataPath = process.env.DATA_PATH!;
export class Api {
  public static readonly THING_NAME = 'pitu-caleya';

  public readonly ddbClient: DynamoDB;

  constructor () {
    this.ddbClient = new DynamoDB({
      endpoint: "http://localhost:8000",
      credentials: {
        accessKeyId: "1234",
        secretAccessKey: "1234"
      }
    });
  }
  
  async start () {
    console.log('Starting API');
    console.log('Connecting to broker');
    const ggClient  = await this.getIpcClient();
    console.log('Subscribing to router telemetry');

    // Create server
    const app = express();

    // Create settings table
    // try {
    //   console.log('Creating settings table');
    //   await this.ddbClient.createTable({
    //     TableName: 'device-settings',
    //     AttributeDefinitions: [
    //       {
    //         AttributeType: ScalarAttributeType.S,
    //         AttributeName: 'shadowName'
    //       },
    //       {
    //         AttributeType: ScalarAttributeType.S,
    //         AttributeName: 'path',
    //       }
    //     ],
    //     KeySchema: [
    //       {
    //         AttributeName: 'shadowName',
    //         KeyType: KeyType.HASH
    //       },
    //       {
    //         AttributeName: 'path',
    //         KeyType: KeyType.RANGE
    //       },
    //     ],
    //     BillingMode: BillingMode.PAY_PER_REQUEST,
    //     DeletionProtectionEnabled: true,
    //   });
    // } catch (e) {
    //   console.log('Failed creating table locally. Maybe it already exists?');
    //   console.log(e);
    // }

    app.options(/.*/, (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', '*');
      res.header('Access-Control-Allow-Methods', '*');
      res.send();
    });

    // scan data
    app.get("/data/:entity", async (req, res) => {
      const { entity } = req.params;
      console.log(`Scan request on ${entity}`);
      const data = await this.scan(entity);
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', '*');
      res.header('Access-Control-Allow-Methods', '*');
      res.send(data);
    });

    // create application/json parser
    var jsonParser = bodyParser.json()

    // Save data
    app.post("/data/:entity", jsonParser, async (req, res) => {
      const { entity } = req.params;
      console.log(`Save request on ${entity} with data ${JSON.stringify(req.body)}`);
      const data = await this.save(entity, req.body);
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', '*');
      res.header('Access-Control-Allow-Methods', '*');
      res.send(data);
    });

    app.listen(9998);
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

  async save (entity: string, data: any) {
    const existingData = await this.scan(entity);
    const newData = [...existingData];
    if (data.id) {
      const index = existingData.indexOf(existingData.find((d: any) => d.id === data.id));
      newData[index] = data;
    } else {
      data.id = uuid();
      newData.push(data);
    }

    writeFileSync(`${dataPath}/${entity}.json`, JSON.stringify(newData, null, 2));

    // const response = await this.ddbClient.putItem({
    //   TableName: entity,
    //   Item: marshall(data),
    // });

    return data;
  }

  async scan (entity: string) {
    const file = `${dataPath}/${entity}.json`;
    console.log(`Reading file ${file}`);
    const data = readFileSync(file);
    return JSON.parse(data.toString());

    // try {
    //   const response = await this.ddbClient.scan({
    //     TableName: entity
    //   });
  
    //   const data = (response.Items || []).map(i => unmarshall(i));
    //   return data;
    // } catch (e) {
    //   console.error("ERROR: Something failed when scanning data");
    //   console.error(e);
    //   // TODO Verify exception type
    //   return [];
    // }
  }
}