import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, StreamViewType, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { CfnComponentVersion } from 'aws-cdk-lib/aws-greengrassv2';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnPolicy, CfnRoleAlias } from 'aws-cdk-lib/aws-iot';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, ServerSideEncryption, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';

export interface ApiConstructProps {
  artifactsBucketArn: string;
  encryptionKeyArn: string;
  componentVersion: string;
}

export class ApiConstruct extends Construct {
  public readonly devicesTable: Table;
  public readonly apiRole: Role;
  public readonly roleAlias: CfnRoleAlias;
  public readonly apiPolicy: CfnPolicy;

  public readonly apiComponent: CfnComponentVersion;
  public readonly apiInitialDeployment: BucketDeployment;

  constructor (scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const artifactsBucket = Bucket.fromBucketArn(this, 'ArtifactsBucket', props.artifactsBucketArn);
    const encryptionKey = Key.fromKeyArn(this, 'EncryptionKey', props.encryptionKeyArn);

    this.apiRole = new Role(this, 'ApiRole', {
      assumedBy: new ServicePrincipal('greengrass.amazonaws.com')
    });

    this.roleAlias = new CfnRoleAlias(this, 'ApiRoleAlias', {
      roleArn: this.apiRole.roleArn,
      roleAlias: 'api'
    });

    this.apiPolicy = new CfnPolicy(this, 'ApiPolicy', {
      policyName: 'api',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            "Effect": "Allow",
            "Action": [
              "iot:AssumeRoleWithCertificate"
            ],
            "Resource": this.roleAlias.attrRoleAliasArn,
          }
        ]
      }
    });

    this.devicesTable = new Table(this, 'DevicesTable', {
      tableName: `device-settings`,
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      partitionKey: {
        type: AttributeType.STRING,
        name: 'shadowName'
      },
      sortKey: {
        type: AttributeType.STRING,
        name: 'path'
      },
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    this.devicesTable.grantFullAccess(this.apiRole);

    const apiPath = `vanlance/supplies/`;
    const apiFile = `${apiPath}api.zip`;
    this.apiInitialDeployment = new BucketDeployment(this, 'InitialDeployment', {
      destinationBucket: artifactsBucket,
      prune: false,
      logRetention: RetentionDays.ONE_DAY,
      sources: [
        Source.asset(`${__dirname}/../../../api`, { bundling: {
          image: Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c', [
              'cd /asset-input/',
              'npm install',
              'npm run build',
              'cp package.json ./dist/',
              'cp package-lock.json ./dist/',
              `mkdir -p /asset-output/${apiPath}`,
              'cd dist/',
              'npm i --omit=dev',
              `zip -r /asset-output/${apiFile} ./*`
            ].join(' && ')
          ],
          user: 'root',
          volumes: [
            {
              containerPath: '/root',
              hostPath: process.env.HOME!
            }
          ],
        } })
      ]
    });

    encryptionKey.grantEncryptDecrypt(this.apiInitialDeployment.handlerRole);

    // Initialize website delivery component
    const recipeContents = readFileSync(`${__dirname}/api.recipe.yml`).toString();
    const inlineRecipe = recipeContents
      .replace(/<REPLACE_WITH_S3_URI>/g, `s3://${artifactsBucket.bucketName}/${apiFile}`)
      .replace(/<COMPONENT_VERSION>/g, props.componentVersion);
      // .replace(/<DDB_LOCAL_COMPONENT_VERSION>/g, props.ddbLocalComponentVersion);
    
    this.apiComponent = new CfnComponentVersion(this, 'ApiComponent', {
      inlineRecipe,
    });

    this.apiComponent.node.addDependency(this.apiInitialDeployment);
  }
}