import boto3

# Initialize session and DynamoDB resource
AWS_REGION = "us-east-1"
session = boto3.Session(region_name=AWS_REGION, profile_name="AWSPowerUserAccess")

dynamodb = session.resource("dynamodb", region_name=AWS_REGION)

# Define the tables
chat_table = dynamodb.Table("RegulatoryChatHistory")
sessions_table = dynamodb.Table("RegulatorySessions")

