/**
 * Database stack
 */
import { Stack, StackProps } from "aws-cdk-lib";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
} from "aws-cdk-lib/aws-rds";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { importVpc } from "../utils/importVpc";

export interface DatabaseProps extends StackProps {
  appName: string;
  vpc: Vpc;
}

export class Database extends Stack {
  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    // Import ASG Security Group
    const asgSecurityGroup = SecurityGroup.fromSecurityGroupId(
      this,
      `${props.appName}-Asg-SecurityGroup`,
      StringParameter.valueForStringParameter(this, `/${props.appName}/asg-sg`)
    );

    // Import DB Security Group
    const databaseSecurityGroup = SecurityGroup.fromSecurityGroupId(
      this,
      `${props.appName}-Database-SecurityGroup`,
      StringParameter.valueForStringParameter(
        this,
        `/${props.appName}/database-sg`
      )
    );

    const database = new DatabaseInstance(this, `${props.appName}-Database`, {
      databaseName: `${props.appName}-db`.toLowerCase(),
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_13_4,
      }),
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE2,
        InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      multiAz: true,
      storageEncrypted: true,
      securityGroups: [databaseSecurityGroup],
    });

    // Allow ASG to connect to the database
    database.connections.allowFrom(
      asgSecurityGroup,
      database.connections.defaultPort ?? Port.tcp(5432)
    );
  }
}
