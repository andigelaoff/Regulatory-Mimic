from fastapi import APIRouter, UploadFile, File, Query
from app.auth.cognito import CognitoClient
from app.models.schemas import SignUp, ConfirmSignUpRequest, SignInRequest
from typing import Dict
from app.core.config import get_settings
from app.core.rag import generate_answer
from app.utils.helpers import analyze_text, extract_text_from_pdf, extract_text_from_docx, extract_text_from_txt
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from langchain.chat_models import ChatOpenAI
import io
import httpx
import json


settings = get_settings()
cognito = CognitoClient()


router = APIRouter()

document_store: Dict[str, dict] = {}


@router.post("/signup")
async def sign_up(request: SignUp):
    return await cognito.sign_up(request.email, request.password)


@router.post("/confirm-signup")
async def confirm_sign_up(request: ConfirmSignUpRequest):
    return await cognito.confirm_sign_up(request.email, request.confirmation_code)


@router.post("/signin")
async def sign_in(request: SignInRequest):
    return await cognito.sign_in(request.email, request.password)


@router.get("/ask")
async def ask_question(model:str, q: str = Query(..., title="Question")):
    async def generate_stream():
        try:
            async for content in generate_answer(q,model):
                print(f"data: {json.dumps({'content': content})}\n\n")
                yield f"data: {json.dumps({'content': content})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    )

@router.post("/upload")
async def upload_file(model:str,file: UploadFile = File(...), prompt: str = ""):

    try:

        file_contents = await file.read()
        file_extension = file.filename.split('.')[-1].lower()

        if file_extension == "pdf":
            text_content = extract_text_from_pdf(io.BytesIO(file_contents))
        elif file_extension == "docx":
            text_content = extract_text_from_docx(io.BytesIO(file_contents))
        elif file_extension == "txt":
            text_content = extract_text_from_txt(io.BytesIO(file_contents))
        else:
            return {"error": "Unsupported file format. Please upload a PDF, DOCX, or TXT file."}

        async def generate_stream():
            try:

                yield f"data: {json.dumps({'status': 'processing', 'message': f'Processing file: {file.filename}'})}\n\n"

                async for content in analyze_text(text_content, prompt, model):
                    yield f"data: {json.dumps({'content': content})}\n\n"

                yield f"data: {json.dumps({'status': 'completed', 'message': 'Analysis completed'})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        )

    except Exception as e:
        return {"error": str(e)}


@router.get("/title")
async def generate_chat_title( model:str, prompt: str = Query(..., description="The prompt to generate a title from")):

    async def generate_stream():
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://api.openai.com/v1/chat/completions',
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {settings.OPENAI_API_KEY}',
                    },
                    json={
                        'model': model.lower(),
                        'messages': [
                            {'role': 'system',
                                'content': 'You name chats succinctly based on the user request.'},
                            {'role': 'user', 'content': f'Please create a short title for this request:\n\n"{prompt}"'},
                        ],
                        'max_tokens': 20,
                        'temperature': 0.7,
                        'stream': True
                    },
                    timeout=30.0
                )

                if response.status_code != 200:
                    yield f"data: {json.dumps({'error': 'Failed to generate chat title'})}\n\n"
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
                                yield f"data: {json.dumps({'content': content})}\n\n"
                        except json.JSONDecodeError:
                            continue

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    )
