import { CfnComponentVersion } from "aws-cdk-lib/aws-greengrassv2";
import { Construct } from "constructs";
import { readFileSync } from "fs";

export interface DdbLocalConstructProps {
  componentVersion: string;
}

export class DdbLocalConstruct extends Construct {

  public readonly websiteDeliveryComponent: CfnComponentVersion;

  constructor (scope: Construct, id: string, props: DdbLocalConstructProps) {
    super(scope, id);

    // Initialize website delivery component
    const recipeContents = readFileSync(`${__dirname}/ddb-local.recipe.yml`).toString()
      .replace(/<COMPONENT_VERSION>/g, props.componentVersion);
    this.websiteDeliveryComponent = new CfnComponentVersion(this, 'DdbLocalComponent', {
      inlineRecipe: recipeContents,
    });
  }
}