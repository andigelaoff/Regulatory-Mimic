import json
import httpx
from app.core.config import get_settings
from app.services.opensearch_client import search_opensearch
from app.db.database import save_chat_message  # Import the save_chat_message function
import time

settings = get_settings()

temp_user_messages = {}

def generate_prompt(question, contexts):
    prompt = "Given the following extracted parts of a document and a question, create a final answer.\n\n"
    prompt += f"QUESTION: {question}\n"
    prompt += "".join([f"SOURCE {i+1}: {context}\n" for i, context in enumerate(contexts)])
    prompt += "ANSWER: "
    return prompt


async def generate_answer(question: str, model: str, user_id: str, session_id: str):
    """
    Generates an answer to the user's question and saves the conversation to DynamoDB.

    Args:
        question (str): The user's question.
        model (str): The model to use for generating the response.
        user_id (str): The user's ID (extracted from the token).
        session_id (str): The session ID to associate the chat with.

    Yields:
        str: The bot's response in chunks.
    """
    # Generate a unique timestamp for this conversation turn
    timestamp = int(time.time())
    unique_key = f"{session_id}#{timestamp}"

    # Temporarily store the user's message
    temp_user_messages[unique_key] = {
        "UserID": user_id,
        "sessionId": session_id,
        "message": question,
        "timestamp": timestamp,
    }

    # Retrieve relevant documents from OpenSearch
    retrieved_docs = search_opensearch(question)
    if not retrieved_docs:
        yield "I could not find relevant information."
        return

    # Generate the prompt for the model
    contexts = [doc["content"] for doc in retrieved_docs if doc["content"]]
    prompt = generate_prompt(question, contexts)

    # Prepare the payload for the OpenAI API
    payload = {
        "model": model.lower(),
        "messages": [
            {"role": "system", "content": "You are an AI assistant that extracts relevant information from documents."},
            {"role": "user", "content": prompt}
        ],
        "stream": True
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
    }

    # Stream the bot's response
    bot_response = ""
    try:
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            ) as response:
                if response.status_code != 200:
                    yield f"Error: API request failed with status {response.status_code}"
                    return

                async for line in response.aiter_lines():
                    if line.startswith('data: '):
                        line = line[6:]
                        if line.strip() == '[DONE]':
                            continue
                        try:
                            data = json.loads(line)
                            if data.get('choices') and data['choices'][0].get('delta', {}).get('content'):
                                content = data['choices'][0]['delta']['content']
                                bot_response += content
                                yield content
                        except json.JSONDecodeError:
                            continue

        # Save both the user's message and the bot's response to DynamoDB
        try:
            user_message = temp_user_messages.pop(unique_key)  # Retrieve and remove the user's message from temp storage
            save_chat_message(
                user_id=user_message["UserID"],
                session_id=user_message["sessionId"],
                message=user_message["message"],
                bot_response=bot_response,
                timestamp=user_message["timestamp"],
            )
        except Exception as e:
            yield f"Error: Failed to save bot response - {str(e)}"

    except httpx.RequestError as e:
        yield f"Error making API request: {str(e)}"