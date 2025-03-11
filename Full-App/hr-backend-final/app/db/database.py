import time
import uuid
import boto3
from boto3.dynamodb.conditions import Key

AWS_REGION = "us-east-1"

# Initialize session with the correct profile (AWSPowerUserAccess)
session = boto3.Session(profile_name="AWSPowerUserAccess", region_name=AWS_REGION)

# Initialize DynamoDB resource and tables with the session
dynamodb = session.resource("dynamodb")
chat_table = dynamodb.Table("RegulatoryChatHistory")
sessions_table = dynamodb.Table("RegulatorySessions")

# Function to create a session
def create_session(session_name: str, user_id: str):
    session_id = f"{str(uuid.uuid4())}-{int(time.time())}"
    session_item = {
        "UserID": user_id,  # Partition Key
        "sessionId": session_id,  # Sort Key
        "sessionName": session_name,
        "createdAt": int(time.time()),
        "active": True,
    }
    sessions_table.put_item(Item=session_item)

    # Return the session_item with keys matching the SessionResponse model
    return {
        "sessionId": session_id,
        "sessionName": session_name,
        "userId": user_id,  # Adding 'userId' explicitly here
        "createdAt": session_item["createdAt"],
        "active": session_item["active"],
    }

# Function to list sessions for a user
def list_sessions(user_id: str):
    response = sessions_table.query(KeyConditionExpression=Key("UserID").eq(user_id))
    # Ensure the items are returned with correct keys
    sessions = [
        {
            "sessionId": item["sessionId"],
            "sessionName": item["sessionName"],
            "userId": item["UserID"],  # Explicitly renaming to match the response model
            "createdAt": item["createdAt"],
            "active": item["active"],
        }
        for item in response.get("Items", [])
    ]
    return sessions

# Function to save a chat message
def save_chat_message(user_id: str, session_id: str, message: str):
    try:
        timestamp = int(time.time())
        bot_response = f"Bot response to: {message}"
        chat_item = {
            "UserID": user_id,  # Must match the partition key in DynamoDB (case-sensitive)
            "sessionIdTimestamp": f"{session_id}#{timestamp}",  # Must match the sort key in DynamoDB
            "sessionId": session_id,
            "message": message,
            "bot_response": bot_response,
            "timestamp": timestamp,
        }
        # Log the item before saving for debugging
        print("Saving chat item:", chat_item)

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
        # Log the error for debugging
        print(f"Error saving chat message: {str(e)}")
        raise e

# Function to get chat history
def get_chat_history(user_id: str, session_id: str):
    try:
        # Query DynamoDB for chat history
        response = chat_table.query(
            KeyConditionExpression=Key("UserID").eq(user_id) & Key("sessionIdTimestamp").begins_with(f"{session_id}#")
        )
        
        # Ensure the items are returned with correct keys
        chat_history = [
            {
                "userId": item["UserID"],  # Access the partition key
                "sessionId": item["sessionId"],
                "message": item["message"],
                "bot_response": item["bot_response"],
                "timestamp": item["timestamp"],
            }
            for item in response.get("Items", [])
        ]
        return chat_history
    except Exception as e:
        # Log the error for debugging
        print(f"Error retrieving chat history: {str(e)}")
        raise e