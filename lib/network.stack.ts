/**
 * Network stack
 * The network stack will deploy the VPC and subnets used by the account
 * this stack will receive the CIDR block as a parameter
 */
import { Stack, StackProps } from "aws-cdk-lib";
import { IpAddresses, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface NetworkStackProps extends StackProps {
  cidr: string;
  appName: string;
}

export class Network extends Stack {
  public readonly vpc: Vpc;
  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // Virtual Private Cloud
    this.vpc = new Vpc(this, `${props.appName}-Vpc`, {
      ipAddresses: IpAddresses.cidr(props.cidr),
      subnetConfiguration: [
        { subnetType: SubnetType.PUBLIC, name: "Public" },
        { subnetType: SubnetType.PRIVATE_WITH_EGRESS, name: "Private" },
        {
          subnetType: SubnetType.PRIVATE_ISOLATED,
          name: "Data",
        },
      ],
    });

  }
}
