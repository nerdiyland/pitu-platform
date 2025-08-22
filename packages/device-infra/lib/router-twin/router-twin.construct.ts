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

export interface RouterTwinConstructProps {
  artifactsBucketArn: string;
  encryptionKeyArn: string;
  componentVersion: string;
}

export class RouterTwinConstruct extends Construct {
  
  public readonly routerTwinComponent: CfnComponentVersion;
  public readonly routerTwinInitialDeployment: BucketDeployment;
  public readonly connectionEnsurerComponent: CfnComponentVersion;

  constructor (scope: Construct, id: string, props: RouterTwinConstructProps) {
    super(scope, id);

    const artifactsBucket = Bucket.fromBucketArn(this, 'ArtifactsBucket', props.artifactsBucketArn);
    const encryptionKey = Key.fromKeyArn(this, 'EncryptionKey', props.encryptionKeyArn);

    const routerTwinPath = `vanlance/supplies/`;
    const routerTwinFile = `${routerTwinPath}router-twin.zip`;
    this.routerTwinInitialDeployment = new BucketDeployment(this, 'InitialDeployment', {
      destinationBucket: artifactsBucket,
      prune: false,
      logRetention: RetentionDays.ONE_DAY,
      sources: [
        Source.asset(`${__dirname}/../../../router-twin`, { bundling: {
          image: Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c', [
              'cd /asset-input/',
              'npm install',
              'npm run build',
              'cp package.json ./dist/',
              'cp package-lock.json ./dist/',
              'cp connection-ensurer.py ./dist/',
              `mkdir -p /asset-output/${routerTwinPath}`,
              'cd dist/',
              'npm i --omit=dev',
              `zip -r /asset-output/${routerTwinFile} ./*`
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

    encryptionKey.grantEncryptDecrypt(this.routerTwinInitialDeployment.handlerRole);

    // Initialize website delivery component
    const recipeContents = readFileSync(`${__dirname}/router-twin.recipe.yml`).toString();
    const inlineRecipe = recipeContents
      .replace(/<REPLACE_WITH_S3_URI>/g, `s3://${artifactsBucket.bucketName}/${routerTwinFile}`)
      .replace(/<COMPONENT_VERSION>/g, props.componentVersion);
    
    this.routerTwinComponent = new CfnComponentVersion(this, 'RouterTwinComponent', {
      inlineRecipe,
    });

    const connectionEnsurerRecipeContents = readFileSync(`${__dirname}/connection-ensurer.recipe.yml`).toString()
      .replace(/<COMPONENT_VERSION>/g, props.componentVersion);
    
    this.connectionEnsurerComponent = new CfnComponentVersion(this, 'InternetConnectionEnsurerComponent', {
      inlineRecipe: connectionEnsurerRecipeContents
    });

    this.routerTwinComponent.node.addDependency(this.routerTwinInitialDeployment);
    this.connectionEnsurerComponent.node.addDependency(this.routerTwinComponent);
  }
}