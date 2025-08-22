import { BundlingOutput } from 'aws-cdk-lib';
import { CfnComponentVersion } from 'aws-cdk-lib/aws-greengrassv2';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, ServerSideEncryption, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';

export interface PituUiConstructProps {
  artifactsBucketArn: string;
  encryptionKeyArn: string;
  componentVersion: string;
  websiteDeliveryComponentVersion: string;
}

export class PituUiConstruct extends Construct {

  public readonly pituUiComponent: CfnComponentVersion;
  public readonly pituUiClientComponent: CfnComponentVersion;
  public readonly pituUiInitialDeployment: BucketDeployment;

  constructor (scope: Construct, id: string, props: PituUiConstructProps) {
    super(scope, id);

    const artifactsBucket = Bucket.fromBucketArn(this, 'ArtifactsBucket', props.artifactsBucketArn);
    const encryptionKey = Key.fromKeyArn(this, 'EncryptionKey', props.encryptionKeyArn);

    const infotainmentUiPath = `pitu/infotainment/`;
    const infotainmentUiFile = `${infotainmentUiPath}infotainment-ui.zip`;
    this.pituUiInitialDeployment = new BucketDeployment(this, 'InitialDeployment', {
      destinationBucket: artifactsBucket,
      prune: false,
      logRetention: RetentionDays.ONE_DAY,
      sources: [
        Source.asset(`${__dirname}/../../../vehicle-ui`, { bundling: {
          image: Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c', [
              'cd /asset-input/',
              'npm install',
              'npm run build',
              `mkdir -p /asset-output/${infotainmentUiPath}`,
              'cd dist/',
              `zip -r /asset-output/${infotainmentUiFile} ./*`
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

    encryptionKey.grantEncryptDecrypt(this.pituUiInitialDeployment.handlerRole);

    // Initialize website delivery component
    const recipeContents = readFileSync(`${__dirname}/pitu-ui.recipe.yml`).toString();
    const inlineRecipe = recipeContents
      .replace(/<REPLACE_WITH_S3_URI>/g, `s3://${artifactsBucket.bucketName}/${infotainmentUiFile}`)
      .replace(/<COMPONENT_VERSION>/g, props.componentVersion)
      .replace(/<WEBSITE_DELIVERY_COMPONENT_VERSION>/g, props.websiteDeliveryComponentVersion);
    
    this.pituUiComponent = new CfnComponentVersion(this, 'PituUiComponent', {
      inlineRecipe,
    });

    const clientRecipeContents = readFileSync(`${__dirname}/pitu-ui-client.recipe.yml`).toString()
      .replace(/<COMPONENT_VERSION>/g, props.componentVersion);
    this.pituUiClientComponent = new CfnComponentVersion(this, 'PituUiClientComponent', {
      inlineRecipe: clientRecipeContents,
    });

    this.pituUiComponent.node.addDependency(this.pituUiInitialDeployment);
    this.pituUiClientComponent.node.addDependency(this.pituUiComponent);
  }
}