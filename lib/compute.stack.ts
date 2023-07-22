/**
 * Compute stack
 */
import { Stack, StackProps } from "aws-cdk-lib";
import { AutoScalingGroup, UpdatePolicy } from "aws-cdk-lib/aws-autoscaling";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { readFileSync } from "fs";

export interface ComputeStackProps extends StackProps {
  vpc: Vpc;
  appName: string;
  hostedZone: HostedZone;
  minCapacity?: number;
  desiredCapacity?: number;
  maxCapacity?: number;
}

export class Compute extends Stack {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Auto Scaling Group
    const asg = new AutoScalingGroup(this, `${props.appName}-Asg`, {
      vpc: props.vpc,
      autoScalingGroupName: `${props.appName}-asg`.toLowerCase(),
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      machineImage: MachineImage.latestAmazonLinux2023(),
      desiredCapacity: props.desiredCapacity ?? 2,
      minCapacity: props.minCapacity ?? 1,
      maxCapacity: props.maxCapacity ?? 3,
      updatePolicy: UpdatePolicy.rollingUpdate(),
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
    });
    const userData = readFileSync("./bin/user-data.sh", "utf8");
    asg.addUserData(userData);

    // Load Balancer
    const lb = new ApplicationLoadBalancer(this, `${props.appName}-Lb`, {
      vpc: props.vpc,
      internetFacing: true,
      loadBalancerName: `${props.appName}-lb`.toLowerCase(),
    });

    lb.addRedirect({
      sourceProtocol: ApplicationProtocol.HTTP,
      sourcePort: 80,
      targetProtocol: ApplicationProtocol.HTTPS,
      targetPort: 443,
    });

    const httpsListener = lb.addListener(`${props.appName}-Lb-Listener`, {
      port: 443,
      open: true,
      certificates: [
        {
          certificateArn: StringParameter.valueForStringParameter(
            this,
            `/${props.appName}/certificate-arn`
          ),
        },
      ],
    });

    httpsListener.addTargets(`${props.appName}-Lb-Target`, {
      port: 80,
      targets: [asg],
    });

    // Create DNS record to point to the load balancer
    new ARecord(this, `${props.appName}-ARecord`, {
      zone: props.hostedZone,
      recordName: props.appName,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(lb)),
    });
  }
}
