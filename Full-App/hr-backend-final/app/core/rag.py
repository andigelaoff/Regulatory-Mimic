import asyncio
from app.core.config import get_settings
from app.services.opensearch_client import search_opensearch
from app.db.database import save_chat_message  # Import the save_chat_message function
import time

from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.callbacks.base import AsyncCallbackHandler

temp_user_messages = {}
settings = get_settings()

def generate_prompt(question, contexts):
    prompt = "Given the following extracted parts of a document and a question, create a final answer.\n\n"
    prompt += f"QUESTION: {question}\n"
    prompt += "".join([f"SOURCE {i+1}: {context}\n" for i, context in enumerate(contexts)])
    prompt += "ANSWER: "
    return prompt

class StreamingHandler(AsyncCallbackHandler):
    def __init__(self, queue: asyncio.Queue):
        self.queue = queue

    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        # Enqueue each token as it arrives
        await self.queue.put(token)

async def generate_answer(question: str, model: str, user_id: str, session_id: str, preloaded_history=None):

    timestamp = int(time.time())
    unique_key = f"{session_id}#{timestamp}"
    bot_response = ''
    model="gpt-4o-mini"

    # Temporarily store the user's message
    temp_user_messages[unique_key] = {
        "UserID": user_id,
        "sessionId": session_id,
        "message": question,
        "timestamp": timestamp,
    }

    # Retrieve relevant documents using your OpenSearch function
    # retrieved_docs = search_opensearch(question)
    # if not retrieved_docs:
    #     yield "I could not find relevant information."
    #     return

    # contexts = [doc["content"] for doc in retrieved_docs if doc["content"]]
    contexts = ['']
    prompt = generate_prompt(question, contexts)


    # Initialize conversation memory; if a preloaded history is provided, use it.
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    if preloaded_history:
        for message in preloaded_history:
            memory.chat_memory.add_message(message)

    prompt_template = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(
            "You are an AI assistant that extracts relevant information from documents."
        ),
        
        HumanMessagePromptTemplate.from_template("Conversation History: {chat_history}\n\n{prompt}")
    ])

    # prompt_template = ChatPromptTemplate.from_messages(
    # [
    #     SystemMessage(
    #         content="You are a chatbot having a conversation with a human."
    #     ),  # The persistent system prompt
    #     MessagesPlaceholder(
    #         variable_name="chat_history"
    #     ),  # Where the memory will be stored.
    #     HumanMessagePromptTemplate.from_template(
    #         "{prompt}"
    #     ),  # Where the human input will injected
    # ]
    # )

    # Set up an asyncio queue and a callback handler to capture tokens.
    token_queue = asyncio.Queue()
    streaming_handler = StreamingHandler(token_queue)

    llm = ChatOpenAI(
        model_name=model,  # e.g. "gpt-3.5-turbo" or "gpt-4" (if you have access)
        streaming=True,
        openai_api_key=settings.OPENAI_API_KEY,
        callbacks=[streaming_handler]
    )

    chain = LLMChain(llm=llm, prompt=prompt_template, memory=memory)
    chain_task = asyncio.create_task(chain.arun(prompt=prompt))
    
    while not chain_task.done() or not token_queue.empty():
        try:
            token = await asyncio.wait_for(token_queue.get(), timeout=1.0)
            bot_response += token
            yield token
        except asyncio.TimeoutError:
            continue

    user_message = temp_user_messages.pop(unique_key)  # Retrieve and remove the user's message from temp storage
    save_chat_message(
            user_id=user_message["UserID"],
            session_id=user_message["sessionId"],
            message=user_message["message"],
            bot_response=bot_response,
            timestamp=user_message["timestamp"],
        )



