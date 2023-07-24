import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Network } from "./network.stack";
import { Compute } from "./compute.stack";
import { applicationName, domainName } from "../bin/cloud-config";
import { Security } from "./security.stack";
import { Database } from "./database.stack";

export class MainStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const network = new Network(this, "NetworkStack", {
      cidr: "10.0.0.0/16", //64k
      appName: applicationName,
    });

    new Security(this, "SecurityStack", {
      appName: applicationName,
      vpc: network.vpc
    });

    new Compute(this, "ComputeStack", {
      appName: applicationName,
      vpc: network.vpc
    });

    new Database(this, "DatabaseStack", {
      appName: applicationName,
      vpc: network.vpc
    });
  }
}
