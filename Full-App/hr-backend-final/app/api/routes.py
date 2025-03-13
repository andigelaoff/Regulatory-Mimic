from fastapi import APIRouter, UploadFile, File, Query, Header
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
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import SessionCreateRequest, SessionResponse, ChatMessageRequest, ChatMessageResponse
from app.db.database import create_session, list_sessions, save_chat_message, get_chat_history, get_last_5_messages
from typing import List
from app.models.schemas import SignUpResponse, ConfirmSignUpResponse, SignInResponse
from fastapi import Depends





settings = get_settings()
cognito = CognitoClient()


router = APIRouter()

document_store: Dict[str, dict] = {}


@router.post("/signup", response_model=SignUpResponse)
async def sign_up(request: SignUp):
    return await cognito.sign_up(request.email, request.password)

@router.post("/confirm-signup", response_model=ConfirmSignUpResponse)
async def confirm_sign_up(request: ConfirmSignUpRequest):
    return await cognito.confirm_sign_up(request.email, request.confirmation_code)

@router.post("/signin", response_model=SignInResponse)
async def sign_in(request: SignInRequest):
    return await cognito.sign_in(request.email, request.password)

@router.get("/test")
async def test_endpoint(user_sub: str = Depends(cognito.get_current_user), session_id: str = Query(..., title="Session ID")):
    msg = get_last_5_messages(user_sub, session_id)
    return {"msg": msg}

@router.get("/ask")
async def ask_question(
    model: str,
    q: str = Query(..., title="Question"),
    session_id: str = Query(..., title="Session ID"),
    user_sub: str = Depends(cognito.get_current_user)

):  
    msg_list = get_last_5_messages(user_sub, session_id)
    preloaded_history = []
    for entry in msg_list:
        preloaded_history.append({"role": "user", "content": entry["message"]})
        preloaded_history.append({"role": "assistant", "content": entry["bot_response"]})
    
    preloaded_history = preloaded_history[::-1]

    async def generate_stream():
        
        async for content in generate_answer(q, model, user_sub, session_id, preloaded_history):
            yield f"data: {json.dumps({'content': content})}\n\n"

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

# Chat history

@router.post("/sessions/create", response_model=SessionResponse)
async def create_session_endpoint(
    session_data: SessionCreateRequest,
    user_sub: str = Depends(cognito.get_current_user)  # Decode the `sub` from the token
):
    try:
        session_item = create_session(session_data.sessionName, user_sub)  # Use the `sub` as the `UserID`
        return session_item
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )

# Endpoint to list all sessions for a user
@router.get("/sessions/list", response_model=List[SessionResponse])
async def list_sessions_endpoint(
    user_sub: str = Depends(cognito.get_current_user)  # Decode the `sub` from the token
):
    try:
        sessions = list_sessions(user_sub)  # Use the `sub` as the `UserID`
        return sessions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve sessions: {str(e)}"
        )


# Endpoint to fetch chat history for a specific session
@router.get("/chat/history", response_model=List[ChatMessageResponse])
async def get_chat_history_endpoint(
    sessionId: str,
    user_sub: str = Depends(cognito.get_current_user)  # Decode the `sub` from the token
):
    try:
        chat_history = get_chat_history(user_sub, sessionId)  # Use the `sub` as the `UserID`
        return [ChatMessageResponse(
            userId=user_sub,  # Use the `sub` as the `UserID`
            sessionId=item["sessionId"],
            message=item["message"],
            bot_response=item["bot_response"],
            timestamp=item["timestamp"],
        ) for item in chat_history]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve chat history: {str(e)}"
        )

@router.get("/validate-token")
async def validate_token(authorization: str = Header(...)):
    token = authorization.split(" ")[1] if " " in authorization else authorization

    user_info = cognito.validate_token(token)
    if user_info:
        return {"valid_token": True}
    # return {"valid": True, "user_info": user_info}
    return {"valid_token": False}