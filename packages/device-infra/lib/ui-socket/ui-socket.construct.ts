import { BundlingOutput } from 'aws-cdk-lib';
import { CfnComponentVersion } from 'aws-cdk-lib/aws-greengrassv2';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnThing } from 'aws-cdk-lib/aws-iot';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, ServerSideEncryption, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';

export interface UiSocketConstructProps {
  artifactsBucketArn: string;
  encryptionKeyArn: string;
  componentVersion: string;
}

export class UiSocketConstruct extends Construct {
  public readonly uiSocketComponent: CfnComponentVersion;
  public readonly uiSocketInitialDeployment: BucketDeployment;

  constructor (scope: Construct, id: string, props: UiSocketConstructProps) {
    super(scope, id);

    const artifactsBucket = Bucket.fromBucketArn(this, 'ArtifactsBucket', props.artifactsBucketArn);
    const encryptionKey = Key.fromKeyArn(this, 'EncryptionKey', props.encryptionKeyArn);

    const uiSocketPath = `vanlance/supplies/`;
    const uiSocketFile = `${uiSocketPath}ui-socket.zip`;
    this.uiSocketInitialDeployment = new BucketDeployment(this, 'InitialDeployment', {
      destinationBucket: artifactsBucket,
      prune: false,
      logRetention: RetentionDays.ONE_DAY,
      sources: [
        Source.asset(`${__dirname}/../../../ui-socket`, { bundling: {
          image: Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c', [
              'cd /asset-input/',
              'npm install',
              'npm run build',
              'cp package.json ./dist/',
              'cp package-lock.json ./dist/',
              `mkdir -p /asset-output/${uiSocketPath}`,
              'cd dist/',
              'npm i --omit=dev',
              `zip -r /asset-output/${uiSocketFile} ./*`
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

    encryptionKey.grantEncryptDecrypt(this.uiSocketInitialDeployment.handlerRole);

    // Initialize website delivery component
    const recipeContents = readFileSync(`${__dirname}/ui-socket.recipe.yml`).toString();
    const inlineRecipe = recipeContents
      .replace(/<REPLACE_WITH_S3_URI>/g, `s3://${artifactsBucket.bucketName}/${uiSocketFile}`)
      .replace(/<COMPONENT_VERSION>/g, props.componentVersion);
    
    this.uiSocketComponent = new CfnComponentVersion(this, 'UiSocketComponent', {
      inlineRecipe,
    });

    this.uiSocketComponent.node.addDependency(this.uiSocketInitialDeployment);
  }
}