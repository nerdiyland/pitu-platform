# System Infrastructure

**Basic AWS CDK Infrastructure for Pitu Platform**

This package provides minimal shared AWS infrastructure using CDK (Cloud Development Kit). It creates basic AWS resources that can be shared across the Pitu Platform.

## 📋 Overview

The System Infrastructure package deploys a simple CDK stack containing:

- **KMS Encryption Key** - Customer-managed encryption key for data security
- **DynamoDB Table** - General-purpose data storage with encryption

This is a foundational package that provides basic shared resources rather than complex fleet management infrastructure.

## 🏗️ Infrastructure Components

### AWS Resources

The stack creates these AWS resources:

| Resource | Type | Purpose |
|----------|------|---------|
| **EncryptionKey** | AWS KMS Key | Customer-managed encryption for other resources |
| **DataTable** | DynamoDB Table | General-purpose data storage with composite key |

### DynamoDB Table Schema

```typescript
// Table configuration
{
  partitionKey: {
    name: 'schemaName',
    type: AttributeType.STRING,
  },
  sortKey: {
    name: 'id', 
    type: AttributeType.STRING,
  },
  billingMode: BillingMode.PAY_PER_REQUEST,
  encryption: TableEncryption.CUSTOMER_MANAGED,
  encryptionKey: this.encryptionKey
}
```

The table uses a composite key structure:
- **Partition Key**: `schemaName` (STRING) - Allows grouping different types of data
- **Sort Key**: `id` (STRING) - Unique identifier within each schema

## 🚀 Quick Start

### Prerequisites

- **AWS Account** with appropriate permissions
- **AWS CLI** configured with credentials
- **Node.js 18+** and npm
- **AWS CDK v2** installed globally

### Installation

```bash
cd packages/system-infra
npm install
```

### Build

```bash
npm run build
```

### Deploy

```bash
# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy the stack
npx cdk deploy
```

The stack will be deployed with the name `vanlance-system`.

### Environment Configuration

```bash
# Optional environment variables
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1
```

## 🔧 Usage

### Accessing Resources

After deployment, you can reference the created resources:

```typescript
import { SystemInfraStack } from 'system-infra';

// Access the DynamoDB table
const tableName = systemInfraStack.dataTable.tableName;

// Access the KMS key
const keyId = systemInfraStack.encryptionKey.keyId;
```

### DynamoDB Operations

Example data patterns for the table:

```typescript
// Different schema types can be stored
const items = [
  {
    schemaName: 'user-profiles',
    id: 'user-123',
    // ... other attributes
  },
  {
    schemaName: 'device-configs', 
    id: 'device-456',
    // ... other attributes
  },
  {
    schemaName: 'system-settings',
    id: 'global-config',
    // ... other attributes
  }
];
```

## 🧪 Testing

### Running Tests

```bash
npm test
```

**Note**: The current test file is mostly commented out and needs implementation.

### Manual Validation

Verify deployment:

```bash
# List deployed stacks
npx cdk list

# Check stack status
aws cloudformation describe-stacks --stack-name vanlance-system

# Verify DynamoDB table
aws dynamodb describe-table --table-name <table-name>
```

## 🔧 Development

### Project Structure

```
packages/system-infra/
├── bin/
│   └── system-infra.ts      # CDK app entry point
├── lib/
│   └── system-infra-stack.ts # Stack definition
├── test/
│   └── system-infra.test.ts # Unit tests (needs implementation)
├── package.json             # Dependencies and scripts
├── cdk.json                 # CDK configuration
└── tsconfig.json           # TypeScript configuration
```

### Extending the Stack

To add more resources, modify `lib/system-infra-stack.ts`:

```typescript
export class SystemInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Existing resources...
    this.encryptionKey = new Key(this, 'EncryptionKey', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.dataTable = new Table(this, 'DataTable', {
      // ... existing configuration
    });

    // Add new resources here
  }
}
```

## 🗑️ Cleanup

To remove all resources:

```bash
npx cdk destroy
```

**Warning**: This will permanently delete the DynamoDB table and all its data.

## 📁 Configuration Files

### CDK Configuration (cdk.json)

The CDK configuration enables TypeScript compilation and sets up basic app behavior.

### TypeScript Configuration (tsconfig.json)

Standard TypeScript configuration for CDK projects with ES2020 target.

## 🔐 Security

- **Encryption**: DynamoDB table uses customer-managed KMS encryption
- **Access Control**: Resources are protected by IAM policies
- **Removal Policy**: Set to DESTROY for easy cleanup in development

## 📄 License

This component is part of the Pitu Platform.

## 🔗 Related Documentation

- [Main Platform README](../../README.md) - Overall platform architecture
- [Device Infrastructure](../device-infra/README.md) - Per-device cloud deployment
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/) - CDK reference

## 🤝 Contributing

### Development Guidelines
- Follow AWS CDK best practices
- Add unit tests for new resources
- Update this README when adding features
- Use TypeScript for type safety

### Pull Request Guidelines
1. Test changes locally with `cdk synth`
2. Ensure tests pass with `npm test`
3. Deploy to development environment first
4. Document any breaking changes

---

**System Infrastructure: Basic Shared AWS Resources**

*Simple CDK stack providing KMS encryption and DynamoDB storage for the Pitu Platform*
