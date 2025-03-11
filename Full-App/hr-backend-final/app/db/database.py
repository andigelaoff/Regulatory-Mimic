import time
import uuid
import boto3
import logging
from boto3.dynamodb.conditions import Key

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AWS Configuration
AWS_REGION = "us-east-1"

# Initialize session with the correct profile (AWSPowerUserAccess)
session = boto3.Session(profile_name="AWSPowerUserAccess", region_name=AWS_REGION)

# Initialize DynamoDB resource and tables with the session
dynamodb = session.resource("dynamodb")
chat_table = dynamodb.Table("RegulatoryChatHistory")
sessions_table = dynamodb.Table("RegulatorySessions")

# Constants for DynamoDB keys
USER_ID_KEY = "UserID"  # Partition key
SESSION_ID_TIMESTAMP_KEY = "sessionIdTimestamp"  # Sort key for chat history
SESSION_ID_KEY = "sessionId"  # Sort key for sessions

# Function to create a session
def create_session(session_name: str, user_id: str):
    try:
        session_id = f"{str(uuid.uuid4())}-{int(time.time())}"
        session_item = {
            USER_ID_KEY: user_id,  # Partition Key
            SESSION_ID_KEY: session_id,  # Sort Key
            "sessionName": session_name,
            "createdAt": int(time.time()),
            "active": True,
        }
        sessions_table.put_item(Item=session_item)

        logger.info(f"Session created: {session_id} for user: {user_id}")

        # Return the session_item with keys matching the SessionResponse model
        return {
            "sessionId": session_id,
            "sessionName": session_name,
            "userId": user_id,
            "createdAt": session_item["createdAt"],
            "active": session_item["active"],
        }
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise e

# Function to list sessions for a user
def list_sessions(user_id: str):
    try:
        response = sessions_table.query(KeyConditionExpression=Key(USER_ID_KEY).eq(user_id))
        logger.info(f"Retrieved {len(response.get('Items', []))} sessions for user: {user_id}")

        # Ensure the items are returned with correct keys
        sessions = [
            {
                "sessionId": item[SESSION_ID_KEY],
                "sessionName": item["sessionName"],
                "userId": item[USER_ID_KEY],
                "createdAt": item["createdAt"],
                "active": item["active"],
            }
            for item in response.get("Items", [])
        ]
        return sessions
    except Exception as e:
        logger.error(f"Error listing sessions: {str(e)}")
        raise e

# Function to save a chat message
def save_chat_message(user_id: str, session_id: str, message: str):
    try:
        timestamp = int(time.time())
        bot_response = f"Bot response to: {message}"
        chat_item = {
            USER_ID_KEY: user_id,  # Partition key
            SESSION_ID_TIMESTAMP_KEY: f"{session_id}#{timestamp}",  # Sort key
            SESSION_ID_KEY: session_id,
            "message": message,
            "bot_response": bot_response,
            "timestamp": timestamp,
        }
        logger.info(f"Saving chat item: {chat_item}")

        # Save the item to DynamoDB
        chat_table.put_item(Item=chat_item)

        # Return the chat_item with correct field names
        return {
            "userId": user_id,
            "sessionId": session_id,
            "message": message,
            "bot_response": bot_response,
            "timestamp": timestamp,
        }
    except Exception as e:
        logger.error(f"Error saving chat message: {str(e)}")
        raise e

# Function to get chat history
def get_chat_history(user_id: str, session_id: str):
    try:
        # Query DynamoDB for chat history
        response = chat_table.query(
            KeyConditionExpression=Key(USER_ID_KEY).eq(user_id) & Key(SESSION_ID_TIMESTAMP_KEY).begins_with(f"{session_id}#")
        )
        logger.info(f"Retrieved {len(response.get('Items', []))} chat messages for session: {session_id}")

        # Ensure the items are returned with correct keys
        chat_history = [
            {
                "userId": item[USER_ID_KEY],
                "sessionId": item[SESSION_ID_KEY],
                "message": item["message"],
                "bot_response": item["bot_response"],
                "timestamp": item["timestamp"],
            }
            for item in response.get("Items", [])
        ]
        return chat_history
    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}")
        raise e