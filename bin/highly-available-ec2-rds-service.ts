#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MainStage } from "../lib/main.stage";
import { accountId, region } from './cloud-config';

const app = new cdk.App();
new MainStage(app, "MainStage", {
  env: { account: accountId, region: region },
});
