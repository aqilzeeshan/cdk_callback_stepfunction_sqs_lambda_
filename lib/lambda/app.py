import json
import logging
import random

import boto3

LOG = logging.getLogger(__name__)
STEP_FUNCTIONS_CLIENT = boto3.client("stepfunctions")


def lambda_handler(event: dict, _context: dict):
    """
    Lambda handler to acknowledge consumed SQS records
    :param event: SQS event triggering the Lambda
    :param _context: Execution context, which is ignored
    :return: None
    """
    if event and event["Records"]:
        LOG.info(f"New event consumed consisting of {len(event['Records'])} record(s).")
        for record in event["Records"]:
            body = json.loads(record["body"])

            LOG.info(f"Sending task heartbeat for task ID {body['taskToken']}")
            STEP_FUNCTIONS_CLIENT.send_task_heartbeat(taskToken=body["taskToken"])
            is_task_success = random.choice([True, False])

            if is_task_success:
                LOG.info(f"Sending task success for task ID {body['taskToken']}")
                STEP_FUNCTIONS_CLIENT.send_task_success(
                    taskToken=body["taskToken"],
                    output=json.dumps({"id": body['id']})
                )
            else:
                LOG.info(f"Sending task failure for task ID {body['taskToken']}")
                STEP_FUNCTIONS_CLIENT.send_task_failure(
                    taskToken=body["taskToken"],
                    cause="Random choice returned False."
                )
