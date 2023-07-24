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
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import {
  ApplicationLoadBalancer,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { readFileSync } from "fs";

export interface ComputeStackProps extends StackProps {
  appName: string;
  vpc: Vpc;
  minCapacity?: number;
  desiredCapacity?: number;
  maxCapacity?: number;
}

export class Compute extends Stack {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    // Import ASG Security Group
    const asgSecurityGroup = SecurityGroup.fromSecurityGroupId(
      this,
      `${props.appName}-Asg-SecurityGroup`,
      StringParameter.valueForStringParameter(this, `/${props.appName}/asg-sg`)
    );

    // Auto Scaling Group
    const asg = new AutoScalingGroup(this, `${props.appName}-Asg`, {
      vpc,
      autoScalingGroupName: `${props.appName}-asg`.toLowerCase(),
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      machineImage: MachineImage.latestAmazonLinux2023(),
      desiredCapacity: props.desiredCapacity ?? 2,
      minCapacity: props.minCapacity ?? 1,
      maxCapacity: props.maxCapacity ?? 3,
      updatePolicy: UpdatePolicy.rollingUpdate(),
      securityGroup: asgSecurityGroup,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
    });
    const userData = readFileSync("./bin/user-data.sh", "utf8");
    asg.addUserData(userData);

    // Load Balancer
    const lb = new ApplicationLoadBalancer(this, `${props.appName}-Lb`, {
      vpc,
      internetFacing: true,
      loadBalancerName: `${props.appName}-lb`.toLowerCase(),
    });

    const listener = lb.addListener(`${props.appName}-Lb-Listener`, {
      port: 80,
      open: true,
    });

    listener.addTargets(`${props.appName}-Lb-Target`, {
      port: 80,
      targets: [asg],
    });
  }
}
