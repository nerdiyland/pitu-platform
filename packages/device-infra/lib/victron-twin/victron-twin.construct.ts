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

export interface VictronTwinConstructProps {
  artifactsBucketArn: string;
  encryptionKeyArn: string;
  componentVersion: string;
}

export class VictronTwinConstruct extends Construct {
  public readonly victronTwinComponent: CfnComponentVersion;
  public readonly victronTwinInitialDeployment: BucketDeployment;

  constructor (scope: Construct, id: string, props: VictronTwinConstructProps) {
    super(scope, id);

    const artifactsBucket = Bucket.fromBucketArn(this, 'ArtifactsBucket', props.artifactsBucketArn);
    const encryptionKey = Key.fromKeyArn(this, 'EncryptionKey', props.encryptionKeyArn);

    const victronTwinPath = `vanlance/supplies/`;
    const victronTwinFile = `${victronTwinPath}victron-twin.zip`;
    this.victronTwinInitialDeployment = new BucketDeployment(this, 'InitialDeployment', {
      destinationBucket: artifactsBucket,
      prune: false,
      logRetention: RetentionDays.ONE_DAY,
      sources: [
        Source.asset(`${__dirname}/../../../victron-twin`, { bundling: {
          image: Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c', [
              'cd /asset-input/',
              'npm install',
              'npm run build',
              'cp package.json ./dist/',
              'cp package-lock.json ./dist/',
              `mkdir -p /asset-output/${victronTwinPath}`,
              'cd dist/',
              'npm i --omit=dev',
              `zip -r /asset-output/${victronTwinFile} ./*`
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

    encryptionKey.grantEncryptDecrypt(this.victronTwinInitialDeployment.handlerRole);

    // Initialize website delivery component
    const recipeContents = readFileSync(`${__dirname}/victron-twin.recipe.yml`).toString();
    const inlineRecipe = recipeContents
      .replace(/<REPLACE_WITH_S3_URI>/g, `s3://${artifactsBucket.bucketName}/${victronTwinFile}`)
      .replace(/<COMPONENT_VERSION>/g, props.componentVersion);
    
    this.victronTwinComponent = new CfnComponentVersion(this, 'VictronTwinComponent', {
      inlineRecipe,
    });

    this.victronTwinComponent.node.addDependency(this.victronTwinInitialDeployment);
  }
}