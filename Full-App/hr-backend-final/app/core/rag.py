import asyncio
from app.core.config import get_settings
from app.services.opensearch_client import search_opensearch

from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.callbacks.base import AsyncCallbackHandler

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

async def generate_answer(question, model):
    # Retrieve relevant documents using your OpenSearch function
    retrieved_docs = search_opensearch(question)
    if not retrieved_docs:
        yield "I could not find relevant information."
        return

    contexts = [doc["content"] for doc in retrieved_docs if doc["content"]]
    prompt = generate_prompt(question, contexts)

    # Initialize conversation memory to maintain context between interactions.
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

    # Create a prompt template with a system and human message.
    prompt_template = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(
            "You are an AI assistant that extracts relevant information from documents."
        ),
        HumanMessagePromptTemplate.from_template("{prompt}")
    ])

    # Set up an asyncio queue and a callback handler to capture tokens.
    token_queue = asyncio.Queue()
    streaming_handler = StreamingHandler(token_queue)

    # Initialize the Chat model with streaming enabled and provide the callback.
    llm = ChatOpenAI(
        model_name=model,  # e.g. "gpt-3.5-turbo" or "gpt-4" (if you have access)
        streaming=True,
        openai_api_key=settings.OPENAI_API_KEY,
        callbacks=[streaming_handler]
    )

    # Create an LLMChain that links the model, prompt, and memory.
    chain = LLMChain(llm=llm, prompt=prompt_template, memory=memory)

    # Run the chain in the background.
    chain_task = asyncio.create_task(chain.arun(prompt=prompt))

    # Yield tokens from the queue as they arrive.
    while not chain_task.done() or not token_queue.empty():
        try:
            token = await asyncio.wait_for(token_queue.get(), timeout=1.0)
            yield token
        except asyncio.TimeoutError:
            continue
