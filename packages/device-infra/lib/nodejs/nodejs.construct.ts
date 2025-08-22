import { CfnComponentVersion } from "aws-cdk-lib/aws-greengrassv2";
import { Construct } from "constructs";
import { readFileSync } from "fs";

export interface NodejsConstructProps {

}

export class NodejsConstruct extends Construct {

  public readonly nodejsComponent: CfnComponentVersion;

  constructor (scope: Construct, id: string, props: NodejsConstructProps) {
    super(scope, id);

    // Initialize website delivery component
    const recipeContents = readFileSync(`${__dirname}/nodejs.recipe.yml`).toString();
    this.nodejsComponent = new CfnComponentVersion(this, 'NodejsComponent', {
      inlineRecipe: recipeContents,
    });
  }
}