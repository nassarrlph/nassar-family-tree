#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ShajartiStack } from '../lib/shajarti-stack';

const app = new cdk.App();

new ShajartiStack(app, 'ShajartiStack', {
  env: {
    account: '602151477304',
    region: 'us-east-1', // Change to your preferred region
  },
  description: 'Family Tree Application Infrastructure',
});

app.synth();
