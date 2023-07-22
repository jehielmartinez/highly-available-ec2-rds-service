import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Network } from './network.stack';
import { applicationName, domainName } from '../bin/cloud-config';
import { Compute } from './compute.stack';

export class MainStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const network = new Network(this, 'NetworkStack', {
      cidr: "10.0.0.0/16", //64k
      appName: applicationName,
      domainName,
    });

    const compute = new Compute(this, 'ComputeStack', {
      vpc: network.vpc,
      appName: applicationName
    });

  }
}
