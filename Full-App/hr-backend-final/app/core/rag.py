import json
import httpx
from app.core.config import get_settings
from app.services.opensearch_client import search_opensearch

settings = get_settings()


def generate_prompt(question, contexts):
    prompt = "Given the following extracted parts of a document and a question, create a final answer.\n\n"
    prompt += f"QUESTION: {question}\n"
    prompt += "".join([f"SOURCE {i+1}: {context}\n" for i,
                      context in enumerate(contexts)])
    prompt += "ANSWER: "

    return prompt


async def generate_answer(question,model):

    retrieved_docs = search_opensearch(question)

    if not retrieved_docs:
        yield "I could not find relevant information."
        return

    contexts = [doc["content"] for doc in retrieved_docs if doc["content"]]
    prompt = generate_prompt(question, contexts)

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
                                yield data['choices'][0]['delta']['content']
                        except json.JSONDecodeError:
                            continue

    except httpx.RequestError as e:
        yield f"Error making API request: {str(e)}"
