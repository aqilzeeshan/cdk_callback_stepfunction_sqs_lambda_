#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkStepFunctionsCallbacksStack } from '../lib/cdk_step_functions_callbacks-stack';

const app = new cdk.App();
new CdkStepFunctionsCallbacksStack(app, 'CdkStepFunctionsCallbacksStack');
