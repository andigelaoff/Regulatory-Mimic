from pydantic import BaseModel
from pydantic import BaseModel, EmailStr

class JobDescriptionRequest(BaseModel):
    position: str

class HREmailRequest(BaseModel):
    reason: str
    employee_name: str

class CVAnalysisRequest(BaseModel):
    job_desc: str
    cv_text: str

class EmployeeQueryRequest(BaseModel):
    email: str

class FileUploadResponse(BaseModel):
    message: str
    file_name: str

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str

class SignUp(BaseModel):
    email: EmailStr
    password: str

class ConfirmSignUpRequest(BaseModel):
    email: EmailStr
    confirmation_code: str


class SignInRequest(BaseModel):
    email: EmailStr
    password: str





class SignUpResponse(BaseModel):
    success: bool
    message: str
    user_sub: str  # Include the `sub` in the response

class ConfirmSignUpResponse(BaseModel):
    success: bool
    message: str

class SignInResponse(BaseModel):
    access_token: str
    id_token: str
    refresh_token: str
    user_sub: str  # Include th
    


# Chat History

class SessionCreateRequest(BaseModel):
    sessionName: str
    userId: str  # User ID from Cognito (will be used later)

class ChatMessageRequest(BaseModel):
    userId: str
    sessionId: str
    message: str

class SessionResponse(BaseModel):
    sessionId: str
    sessionName: str
    userId: str
    createdAt: int
    active: bool

class ChatMessageResponse(BaseModel):
    userId: str
    sessionId: str
    message: str
    bot_response: str
    timestamp: int