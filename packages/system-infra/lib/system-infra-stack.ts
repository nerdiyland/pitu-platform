import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SystemInfraStack extends Stack {

  public readonly encryptionKey: Key;
  public readonly dataTable: Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.encryptionKey = new Key(this, 'EncryptionKey', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.dataTable = new Table(this, 'DataTable', {
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'schemaName',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      encryption: TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.encryptionKey,
    });
  }
}
