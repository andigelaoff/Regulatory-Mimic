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