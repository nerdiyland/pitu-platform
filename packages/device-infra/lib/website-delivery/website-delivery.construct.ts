import { CfnComponentVersion } from "aws-cdk-lib/aws-greengrassv2";
import { Construct } from "constructs";
import { readFileSync } from "fs";

export interface WebsiteDeliveryConstructProps {
  componentVersion: string;
}

export class WebsiteDeliveryConstruct extends Construct {

  public readonly websiteDeliveryComponent: CfnComponentVersion;

  constructor (scope: Construct, id: string, props: WebsiteDeliveryConstructProps) {
    super(scope, id);

    // Initialize website delivery component
    const recipeContents = readFileSync(`${__dirname}/website-delivery.recipe.yml`).toString()
      .replace(/<COMPONENT_VERSION>/g, props.componentVersion);
    this.websiteDeliveryComponent = new CfnComponentVersion(this, 'WebsiteDeliveryComponent', {
      inlineRecipe: recipeContents,
    });
  }
}