import { Construct, Duration, Stack, StackProps } from '@aws-cdk/core';

import { Code, Function as LambdaFunction, Runtime } from '@aws-cdk/aws-lambda';
import { SqsEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { Queue } from '@aws-cdk/aws-sqs';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import { v4 as uuid } from 'uuid';
import { PolicyStatement } from "@aws-cdk/aws-iam";
import { IntegrationPattern } from '@aws-cdk/aws-stepfunctions';
import * as path from 'path';


export class CdkStepFunctionsCallbacksStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // SQS queue takes messages from Step functions and feeds it to Lambda function
    const queue = new Queue(this, 'Queue', {
      queueName: "callback-queue",
      retentionPeriod: Duration.minutes(1),
    });

    const callbackTask = new tasks.SqsSendMessage(this, 'CallbackTask', {
      queue,
      messageBody: sfn.TaskInput.fromObject({
        "id": uuid(),
        "taskToken": sfn.JsonPath.taskToken,
      }),
      integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
    });

    const stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      timeout: Duration.minutes(2),
      definition: {
        startState: callbackTask,
        id: 'callback-state-machine',
        endStates: [callbackTask],
      },
    });

    const callbackLambda = new LambdaFunction(this, 'Function', {
      code: Code.fromAsset(path.resolve(__dirname, 'lambda')),
      description: 'SQS consumer for a Step Functions Callback task.',
      functionName: 'callback-function',
      handler: 'app.lambda_handler',
      runtime: Runtime.PYTHON_3_7,
    });

    const sendTaskPolicyStatement = new PolicyStatement({
      resources: [stateMachine.stateMachineArn],
      actions: ["states:SendTaskFailure", "states:SendTaskHeartbeat", "states:SendTaskSuccess"],
    });

    callbackLambda.addEventSource(new SqsEventSource(queue));
    callbackLambda.addToRolePolicy(sendTaskPolicyStatement);

  }
}
