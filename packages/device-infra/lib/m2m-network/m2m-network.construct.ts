import { CfnComponentVersion } from "aws-cdk-lib/aws-greengrassv2";
import { Construct } from "constructs";
import { readFileSync } from "fs";

export interface M2MNetworkConstructProps {
  componentVersion: string;
}

export class M2MNetworkConstruct extends Construct {

  public readonly websiteDeliveryComponent: CfnComponentVersion;

  constructor (scope: Construct, id: string, props: M2MNetworkConstructProps) {
    super(scope, id);

    // Initialize website delivery component
    const recipeContents = readFileSync(`${__dirname}/m2m-network.recipe.yml`).toString()
      .replace(/<COMPONENT_VERSION>/g, props.componentVersion);
    this.websiteDeliveryComponent = new CfnComponentVersion(this, 'M2MNetworkComponent', {
      inlineRecipe: recipeContents,
    });
  }
}