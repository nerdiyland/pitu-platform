import { Aws, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebsiteDeliveryConstruct } from './website-delivery';
import { NodejsConstruct } from './nodejs';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Key } from 'aws-cdk-lib/aws-kms';
import { PituUiConstruct } from './pitu-ui/pitu-ui.construct';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { RouterTwinConstruct } from './router-twin/router-twin.construct';
import { VictronTwinConstruct } from './victron-twin/victron-twin.construct';
import { UiSocketConstruct } from './ui-socket/ui-socket.construct';
import { CfnDeployment } from 'aws-cdk-lib/aws-greengrassv2';
import { DdbLocalConstruct } from './ddb-local';
import { ApiConstruct } from './api';
import { M2MNetworkConstruct } from './m2m-network';

export interface VanlanceDevicesStackProps extends StackProps {

}

export class VanlanceDevicesStack extends Stack {
  public static readonly GREENGRASS_TOKEN_EXCHANGE_ROLE_ARN = `arn:aws:iam::${Aws.ACCOUNT_ID}:role/GreengrassV2TokenExchangeRole`;

  public readonly artifactsBucket: Bucket;
  public readonly encryptionKey: Key;

  // Greengrass components
  public readonly nodejsComponent: NodejsConstruct;
  public readonly infotainmentWebsite: WebsiteDeliveryConstruct;
  public readonly pituUiComponent: PituUiConstruct;
  public readonly routerTwinComponent: RouterTwinConstruct;
  public readonly victronTwinComponent: VictronTwinConstruct;
  public readonly uiSocketComponent: UiSocketConstruct;
  public readonly ddbLocalComponent: DdbLocalConstruct;
  public readonly apiComponent: ApiConstruct;
  public readonly m2mNetworkComponent: M2MNetworkConstruct;
  public readonly deployment: CfnDeployment;

  constructor(scope: Construct, id: string, props: VanlanceDevicesStackProps) {
    super(scope, id, props);

    const versions = {
      nodeJs: '18.0.0',
      pituUI: '0.0.138',
      routerTwin: '0.0.13',
      uiSocket: '0.0.22',
      victronTwin: '0.0.35',
      websiteDelivery: '0.0.4',
      api: '0.0.26',
      m2mNetwork: '0.0.3',
    }

    this.encryptionKey = new Key(this, 'EncryptionKey', {
      removalPolicy: RemovalPolicy.DESTROY
    });

    this.artifactsBucket = new Bucket(this, 'ArtifactsBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
    });

    // Grant permissions to greengrass to access artifacts
    const ggRole = Role.fromRoleArn(this, 'GGTokenExchangeRole', VanlanceDevicesStack.GREENGRASS_TOKEN_EXCHANGE_ROLE_ARN);
    this.artifactsBucket.grantRead(ggRole);
    this.encryptionKey.grantEncryptDecrypt(ggRole);

    this.nodejsComponent = new NodejsConstruct(this, 'NodejsComponent', {});
    this.infotainmentWebsite = new WebsiteDeliveryConstruct(this, 'WebsiteDeliveryComponent', {
      componentVersion: versions.websiteDelivery,
    });
    
    this.pituUiComponent = new PituUiConstruct(this, 'PituUiComponent', {
      artifactsBucketArn: this.artifactsBucket.bucketArn,
      encryptionKeyArn: this.encryptionKey.keyArn,
      componentVersion: versions.pituUI,
      websiteDeliveryComponentVersion: versions.websiteDelivery
    });

    this.routerTwinComponent = new RouterTwinConstruct(this, 'RouterTwinComponent', {
      artifactsBucketArn: this.artifactsBucket.bucketArn,
      encryptionKeyArn: this.encryptionKey.keyArn,
      componentVersion: versions.routerTwin,
    });

    this.victronTwinComponent = new VictronTwinConstruct(this, 'VictronTwinComponent', {
      artifactsBucketArn: this.artifactsBucket.bucketArn,
      encryptionKeyArn: this.encryptionKey.keyArn,
      componentVersion: versions.victronTwin,
    });

    this.uiSocketComponent = new UiSocketConstruct(this, 'UiSocketComponent', {
      artifactsBucketArn: this.artifactsBucket.bucketArn,
      encryptionKeyArn: this.encryptionKey.keyArn,
      componentVersion: versions.uiSocket,
    });

    // this.ddbLocalComponent = new DdbLocalConstruct(this, 'DdbLocalComponent', {
    //   componentVersion: versions.ddbLocal,
    // });

    this.apiComponent = new ApiConstruct(this, 'ApiComponent', {
      componentVersion: versions.api,
      artifactsBucketArn: this.artifactsBucket.bucketArn,
      encryptionKeyArn: this.encryptionKey.keyArn,
    });

    this.m2mNetworkComponent = new M2MNetworkConstruct(this, 'M2MNetworkComponent', {
      componentVersion: versions.m2mNetwork,
    });

    this.deployment = new CfnDeployment(this, 'PituDeployment', {
      targetArn: `arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:thinggroup/vehicle`,
      components: {
        "aws.greengrass.Nucleus": {
          componentVersion: "2.13.0"
        },
        "aws.greengrass.Cli": {
          componentVersion: "2.13.0"
        },
        "aws.greengrass.ShadowManager": {
            componentVersion: "2.3.9",
            configurationUpdate: {
              merge: JSON.stringify({
                strategy: { type: "realTime" },
                // strategy: { type: "periodic" },
                // delay: "300",
                synchronize: {
                  coreThing: { classic: true },
                  shadowDocuments: [
                    { thingName: "pitu-router", classic: true, namedShadows: [] },
                    { thingName: "pitu-relaybox-2", classic: true, namedShadows: [] },
                    {
                      thingName: "pitu-caleya",
                      classic: false,
                      namedShadows: [
                        "net-lte",
                        "victron-adc",
                        "victron-battery",
                        "victron-fronius",
                        "victron-logger",
                        "victron-gps",
                        "victron-modbusclient",
                        "victron-modbustcp",
                        "victron-platform",
                        "victron-settings",
                        "victron-solarcharger",
                        "victron-system",
                        "victron-vebus",
                        "victron-vecan",
                        "relaybox-2",
                      ]
                    },
                  ],
                  direction: "betweenDeviceAndCloud"
                }
              })
            },
            runWith: {}
        },
        "aws.greengrass.clientdevices.Auth": {
          componentVersion: "2.5.1",
          configurationUpdate: {
            merge: JSON.stringify({
              "deviceGroups": {
                "formatVersion": "2021-03-05",
                "definitions": {
                  "MyDeviceGroup": {
                    "selectionRule": "thingName: pitu-relaybox* OR thingName: MyOtherClientDevice*",
                    "policyName": "MyClientDevicePolicy"
                  }
                },
                "policies": {
                  "MyClientDevicePolicy": {
                    "AllowConnect": {
                      "statementDescription": "Allow client devices to connect.",
                      "operations": [
                        "mqtt:connect"
                      ],
                      "resources": [
                        "*"
                      ]
                    },
                    "AllowPublish": {
                      "statementDescription": "Allow client devices to publish to all topics.",
                      "operations": [
                        "mqtt:publish"
                      ],
                      "resources": [
                        "*"
                      ]
                    },
                    "AllowSubscribe": {
                      "statementDescription": "Allow client devices to subscribe to all topics.",
                      "operations": [
                        "mqtt:subscribe"
                      ],
                      "resources": [
                        "*"
                      ]
                    }
                  }
                }
              }
            })
          }
        },
        "aws.greengrass.clientdevices.mqtt.Bridge": {
          componentVersion: "2.3.2",
          configurationUpdate: {
            merge: JSON.stringify({
              "mqttTopicMapping": {
                "ShadowUpdateRequests": {
                  "topic": "$aws/things/pitu-caleya/shadow/name/+/update",
                  "source": "LocalMqtt",
                  "target": "Pubsub"
                },
                "ShadowUpdateResponses": {
                  "topic": "$aws/things/pitu-caleya/shadow/name/+/update/#",
                  "source": "Pubsub",
                  "target": "LocalMqtt"
                }
              }
            })
          }
        },
        "aws.greengrass.clientdevices.mqtt.Moquette": {
          componentVersion: "2.3.7"
        },
        "com.pitucaleya.components.InfotainmentUIClient": {
            componentVersion: versions.pituUI,
            runWith: {}
        },
        "com.vanlance.vehicle-components.InternetConnectionEnsurer": {
            componentVersion: versions.routerTwin,
            runWith: {}
        },
        "com.vanlance.vehicle-components.RouterTwin": {
            componentVersion: versions.routerTwin
        },
        "com.vanlance.vehicle-components.UiSocket": {
            componentVersion: versions.uiSocket,
            runWith: {}
        },
        "com.vanlance.vehicle-components.VictronTwin": {
            componentVersion: versions.victronTwin,
            runWith: {}
        },
        "com.vanlance.vehicle-components.Api": {
            componentVersion: versions.api,
            runWith: {}
        },
        "com.vanlance.vehicle-components.M2MNetwork": {
            componentVersion: versions.m2mNetwork,
            runWith: {}
        },
      },
      deploymentPolicies: {
        failureHandlingPolicy: "DO_NOTHING",
        componentUpdatePolicy: {
          timeoutInSeconds: 60,
          action: "NOTIFY_COMPONENTS"
        },
        configurationValidationPolicy: {
          timeoutInSeconds: 60
        }
      },
      deploymentName: 'PituCaleya',
    });

    this.deployment.node.addDependency(this.nodejsComponent);
    this.deployment.node.addDependency(this.pituUiComponent);
    this.deployment.node.addDependency(this.infotainmentWebsite);
    this.deployment.node.addDependency(this.uiSocketComponent);
    this.deployment.node.addDependency(this.routerTwinComponent);
    this.deployment.node.addDependency(this.victronTwinComponent);
    this.deployment.node.addDependency(this.apiComponent);
  }
}
