# Device Infrastructure

**Per-Device Cloud Infrastructure for Pitu Platform**

The Device Infrastructure package provides AWS CDK infrastructure-as-code for deploying cloud resources and AWS Greengrass v2 components to individual vehicle edge devices. It automates the provisioning of IoT components, digital twins, data processing services, and deployment configurations required for each vehicle in the Pitu Platform fleet.

## 🏗️ Overview

The Device Infrastructure serves as the cloud-side foundation for each vehicle deployment, providing:

- **AWS Greengrass v2 Components** - Containerized edge services for vehicle data processing
- **Digital Twin Management** - Device shadow configuration and synchronization
- **Artifact Distribution** - Secure deployment of application code and configurations
- **Component Orchestration** - Automated deployment and lifecycle management
- **Security Framework** - IAM roles, encryption, and access control
- **Monitoring Integration** - CloudWatch logging and metrics collection

## 🚀 Components Deployed

### Core Greengrass Components

| Component Name | Purpose | Version Management |
|----------------|---------|-------------------|
| **nodejs** | Node.js runtime environment | 18.0.0 |
| **pitu-ui** | Vehicle dashboard web application | Semantic versioning |
| **router-twin** | Network connectivity management | Semantic versioning |
| **victron-twin** | Energy system integration | Semantic versioning |
| **ui-socket** | WebSocket real-time communication | Semantic versioning |
| **api** | REST API and data services | Semantic versioning |
| **website-delivery** | Static web content delivery | Semantic versioning |
| **m2m-network** | Machine-to-machine networking | Semantic versioning |

### AWS Greengrass System Components

| Component | Version | Purpose |
|-----------|---------|---------|
| **aws.greengrass.Nucleus** | 2.13.0 | Core Greengrass runtime |
| **aws.greengrass.Cli** | 2.13.0 | Command-line interface |
| **aws.greengrass.ShadowManager** | 2.3.9 | Device shadow synchronization |
| **aws.greengrass.clientdevices.Auth** | 2.5.1 | Client device authentication |
| **aws.greengrass.clientdevices.mqtt.Bridge** | 2.3.2 | MQTT topic bridging |
| **aws.greengrass.clientdevices.mqtt.Moquette** | 2.3.7 | Local MQTT broker |

## 🏛️ Infrastructure Architecture

### AWS Resources Created

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS Account                            │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   S3 Bucket     │  │   KMS Key       │                  │
│  │  (Artifacts)    │  │  (Encryption)   │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              AWS IoT Greengrass v2                      │ │
│  │                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │ │
│  │  │ Component   │  │ Component   │  │   Deployment    │ │ │
│  │  │ Definitions │  │ Artifacts   │  │ Configuration   │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 Target Devices                          │ │
│  │  Thing Group: "vehicle"                                 │ │
│  │  └── Individual vehicle things (pitu-caleya, etc.)     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Digital Twin Configuration

The infrastructure configures comprehensive device shadow management:

```yaml
Shadow Synchronization Strategy:
├── Core Thing: Classic shadows enabled
├── Client Devices:
│   ├── pitu-router (classic shadows)
│   ├── pitu-relaybox-2 (classic shadows)
│   └── pitu-caleya (named shadows):
│       ├── net-lte (network connectivity)
│       ├── victron-* (energy system components)
│       ├── relaybox-2 (auxiliary controls)
│       └── system telemetry shadows
└── Sync Direction: Bidirectional (device ↔ cloud)
```

## 🚀 Quick Start

### Prerequisites

- **AWS Account** with IoT Core enabled
- **AWS CLI v2** configured with appropriate credentials
- **Node.js 18+** and npm
- **AWS CDK v2** toolkit installed globally
- **IAM Permissions** for IoT, Greengrass, S3, KMS, and CloudFormation

### Installation

1. **Install Dependencies**
   ```bash
   cd packages/device-infra
   npm install
   ```

2. **Configure AWS Environment**
   ```bash
   # Set AWS credentials and region
   aws configure
   
   # Bootstrap CDK (if first time)
   npx cdk bootstrap
   ```

3. **Build TypeScript**
   ```bash
   npm run build
   ```

4. **Deploy Infrastructure**
   ```bash
   # Preview changes
   npx cdk diff
   
   # Deploy to AWS
   npx cdk deploy
   ```

### Environment Configuration

Create environment-specific configuration:

```bash
# .env (optional)
CDK_DEFAULT_ACCOUNT=123456789012
CDK_DEFAULT_REGION=us-east-1
DEPLOYMENT_TARGET_ARN=arn:aws:iot:us-east-1:123456789012:thinggroup/vehicle
```

## 🔧 Development

### Component Versioning

The stack manages component versions centrally:

```typescript
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
```

### Adding New Components

1. **Create Component Construct**
   ```typescript
   // lib/my-component/my-component.construct.ts
   export class MyComponentConstruct extends Construct {
     constructor(scope: Construct, id: string, props: Props) {
       super(scope, id)
       
       // Define Greengrass component
       new CfnComponentVersion(this, 'Component', {
         // Component definition
       })
     }
   }
   ```

2. **Add Recipe File**
   ```yaml
   # lib/my-component/my-component.recipe.yml
   RecipeFormatVersion: '2020-01-25'
   ComponentName: com.vanlance.vehicle-components.MyComponent
   ComponentVersion: '0.0.1'
   ComponentDescription: 'Description of my component'
   ```

3. **Update Stack**
   ```typescript
   // lib/device-infra-stack.ts
   this.myComponent = new MyComponentConstruct(this, 'MyComponent', {
     componentVersion: versions.myComponent,
     // other props
   })
   ```

4. **Add to Deployment**
   ```typescript
   // Update deployment components
   "com.vanlance.vehicle-components.MyComponent": {
     componentVersion: versions.myComponent,
     runWith: {}
   }
   ```

### Configuration Management

Components support runtime configuration through deployment recipes:

```typescript
// Example: Shadow Manager configuration
configurationUpdate: {
  merge: JSON.stringify({
    strategy: { type: "realTime" },
    synchronize: {
      coreThing: { classic: true },
      shadowDocuments: [
        {
          thingName: "pitu-caleya",
          classic: false,
          namedShadows: ["net-lte", "victron-battery"]
        }
      ]
    }
  })
}
```

## 🔐 Security

### IAM Configuration

The infrastructure creates necessary IAM roles and policies:

```typescript
// Greengrass Token Exchange Role
public static readonly GREENGRASS_TOKEN_EXCHANGE_ROLE_ARN = 
  `arn:aws:iam::${Aws.ACCOUNT_ID}:role/GreengrassV2TokenExchangeRole`

// Bucket and encryption permissions
this.artifactsBucket.grantRead(ggRole)
this.encryptionKey.grantEncryptDecrypt(ggRole)
```

### Encryption

- **S3 Artifacts** - KMS encryption for all deployment artifacts
- **Device Communication** - TLS 1.2+ for all IoT communication
- **Shadow Data** - Encrypted in transit and at rest
- **Component Artifacts** - Signed and verified deployments

### Access Control

```typescript
// Client device authentication
"aws.greengrass.clientdevices.Auth": {
  configurationUpdate: {
    merge: JSON.stringify({
      deviceGroups: {
        definitions: {
          MyDeviceGroup: {
            selectionRule: "thingName: pitu-relaybox* OR thingName: MyOtherClientDevice*",
            policyName: "MyClientDevicePolicy"
          }
        }
      }
    })
  }
}
```

## 📊 Deployment Management

### Deployment Strategies

The infrastructure supports different deployment approaches:

```typescript
deploymentPolicies: {
  failureHandlingPolicy: "DO_NOTHING",
  componentUpdatePolicy: {
    timeoutInSeconds: 60,
    action: "NOTIFY_COMPONENTS"
  },
  configurationValidationPolicy: {
    timeoutInSeconds: 60
  }
}
```

### Target Management

Deploy to specific device groups:

```typescript
// Target ARN for vehicle fleet
targetArn: `arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:thinggroup/vehicle`
```

### Rolling Updates

Support for controlled component updates:

```bash
# Deploy specific component version
npx cdk deploy --parameters componentVersion=0.0.35

# Rollback to previous version
aws greengrassv2 cancel-deployment --deployment-id deployment-123
```

## 🧪 Testing

### Infrastructure Testing

```bash
# Run unit tests
npm test

# Test CloudFormation synthesis
npx cdk synth

# Validate against AWS
npx cdk doctor
```

### Component Testing

```bash
# Test individual components
npm run test:component -- --component=victron-twin

# Integration testing
npm run test:integration
```

### Deployment Validation

```typescript
// Test deployment configuration
describe('DeviceInfraStack', () => {
  test('creates required components', () => {
    const template = Template.fromStack(stack)
    
    template.hasResourceProperties('AWS::GreengrassV2::ComponentVersion', {
      InlineRecipe: Match.objectLike({
        ComponentName: 'com.vanlance.vehicle-components.VictronTwin'
      })
    })
  })
})
```

## 📈 Monitoring & Observability

### CloudWatch Integration

```bash
# View deployment logs
aws logs describe-log-groups --log-group-name-prefix="/aws/greengrass"

# Monitor component health
aws greengrassv2 list-effective-deployments --core-device-thing-name pitu-caleya
```

### Metrics Collection

```typescript
// Component health metrics
{
  "metrics": [
    "component.health",
    "deployment.status", 
    "shadow.sync.success",
    "mqtt.connection.status"
  ]
}
```

### Alerting

```bash
# Set up CloudWatch alarms for component failures
aws cloudwatch put-metric-alarm \
  --alarm-name "greengrass-component-failure" \
  --alarm-description "Alert on Greengrass component failures"
```

## 🔧 Troubleshooting

### Common Issues

**Deployment Failures**
```bash
# Check deployment status
aws greengrassv2 get-deployment --deployment-id deployment-123

# View component logs
sudo tail -f /greengrass/v2/logs/com.vanlance.vehicle-components.VictronTwin.log
```

**Permission Errors**
```bash
# Verify IAM role permissions
aws sts get-caller-identity
aws iot describe-role-alias --role-alias GreengrassV2TokenExchangeRoleAlias
```

**Component Failures**
```bash
# Restart specific component
sudo greengrass-cli component restart --names com.vanlance.vehicle-components.VictronTwin

# List component status
sudo greengrass-cli component list
```

### Diagnostic Commands

```bash
# CDK useful commands
npx cdk list                    # List all stacks
npx cdk diff                    # Compare deployed stack with current state
npx cdk metadata                # Display metadata about the stack
npx cdk doctor                  # Check for common issues

# Greengrass diagnostics
sudo greengrass-cli get-debug-password
sudo greengrass-cli logs --name com.vanlance.vehicle-components.VictronTwin
```

## 🚀 Advanced Configuration

### Multi-Environment Deployment

```typescript
// Environment-specific configurations
const envConfig = {
  dev: {
    componentVersions: devVersions,
    targetGroup: 'vehicle-dev'
  },
  prod: {
    componentVersions: prodVersions, 
    targetGroup: 'vehicle-prod'
  }
}
```

### Custom Component Recipes

```yaml
# Advanced component recipe
RecipeFormatVersion: '2020-01-25'
ComponentName: com.custom.vehicle-components.MyAdvancedComponent
ComponentVersion: '{COMPONENT_VERSION}'
ComponentDescription: 'Advanced vehicle component with custom lifecycle'
ComponentPublisher: 'Custom Publisher'

ComponentConfiguration:
  DefaultConfiguration:
    customSetting: 'defaultValue'
    
Manifests:
  - Platform:
      os: linux
      architecture: arm64
    Lifecycle:
      install: |
        echo "Installing custom component"
      run: |
        node /greengrass/v2/packages/artifacts/my-component/app.js
      shutdown: |
        echo "Graceful shutdown"

Artifacts:
  - Uri: s3://my-bucket/my-component-{COMPONENT_VERSION}.zip
    Unarchive: ZIP
```

## 📄 License

This component is part of the Pitu Platform and is licensed under the MIT License.

## 🔗 Related Documentation

- [Main Platform README](../../README.md) - Overall platform architecture
- [System Infrastructure](../system-infra/README.md) - System-wide cloud resources
- [AWS Greengrass v2 Documentation](https://docs.aws.amazon.com/greengrass/) - Official AWS documentation
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/) - Infrastructure as Code guide

## 🤝 Contributing

### Development Guidelines
- Follow AWS CDK and TypeScript best practices
- Write unit tests for all infrastructure constructs
- Document new components and their purposes
- Test deployments in non-production environments first
- Follow semantic versioning for component releases

### Adding Infrastructure Components
1. Create construct in appropriate directory under `lib/`
2. Add component recipe YAML file
3. Update main stack to include new construct
4. Add to deployment configuration
5. Write unit tests
6. Update documentation

### Pull Request Process
1. Create feature branch for infrastructure changes
2. Test with `cdk synth` and `cdk diff`
3. Deploy to development environment
4. Validate component functionality
5. Submit pull request with detailed description

---

**Device Infrastructure: Cloud Foundation for Vehicle Intelligence**

*Automated AWS deployment for scalable, secure, and maintainable vehicle edge computing infrastructure*
