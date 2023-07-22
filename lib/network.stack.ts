/**
 * Network stack
 * The network stack will deploy the VPC and subnets used by the account
 * this stack will receive the CIDR block as a parameter
 */
import { Stack, StackProps } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { IpAddresses, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface NetworkStackProps extends StackProps {
  cidr: string;
  appName: string;
  domainName: string;
}

export class Network extends Stack {
  public readonly vpc: Vpc;
  public readonly hostedZone: HostedZone;
  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const domainName = props.domainName.toLowerCase();

    this.hostedZone = new HostedZone(this, `${props.appName}-HostedZone`, {
      zoneName: domainName,
    });

    const certificate = new Certificate(this, `${props.appName}-Certificate`, {
      domainName: domainName,
      subjectAlternativeNames: [`*.${props.domainName}`],
      validation: CertificateValidation.fromDns(this.hostedZone),
    });

    new StringParameter(this, `${props.appName}-Certificate-ARN-Param`, {
      description: `Certificate ARN for ${domainName}`,
      parameterName: `/${props.appName}/certificate-arn`,
      stringValue: certificate.certificateArn,
    });

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
