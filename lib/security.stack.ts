/**
 * Security stack
 */
import { Stack, StackProps } from "aws-cdk-lib";
import {
  SecurityGroup,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface SecurityStackProps extends StackProps {
  appName: string;
  vpc: Vpc;
}

export class Security extends Stack {
  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    // ASG Security Group
    const asgSecurityGroup = new SecurityGroup(
      this,
      `${props.appName}-Asg-SecurityGroup`,
      {
        vpc,
        allowAllOutbound: true,
        securityGroupName: `${props.appName}-asg-sg`.toLowerCase(),
      }
    );

    new StringParameter(this, `${props.appName}-asg-sg-param`, {
      description: 'ASG Security Group ID',
      parameterName: `/${props.appName}/asg-sg`,
      stringValue: asgSecurityGroup.securityGroupId,
    });


    // Database Security Group
    const databaseSecurityGroup = new SecurityGroup(
      this,
      `${props.appName}-Database-SecurityGroup`,
      {
        vpc,
        securityGroupName: `${props.appName}-db-sg`.toLowerCase(),
      }
    );

    new StringParameter(this, `${props.appName}-database-sg-param`, {
      description: 'Database Security Group ID',
      parameterName: `/${props.appName}/database-sg`,
      stringValue: databaseSecurityGroup.securityGroupId,
    });
  }
}
