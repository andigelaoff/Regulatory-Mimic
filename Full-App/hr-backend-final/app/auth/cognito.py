import boto3
import hmac
import base64
import hashlib
from botocore.exceptions import ClientError
from fastapi import HTTPException
from app.core.config import get_settings
 
settings = get_settings()
 
 
class CognitoClient:
    def __init__(self):
        self.user_pool_id = settings.COGNITO_USER_POOL_ID
        self.client_id = settings.COGNITO_CLIENT_ID
        self.client_secret = settings.COGNITO_CLIENT_SECRET
        self.region = settings.AWS_REGION
 
        self.boto3_session = boto3.Session(profile_name='AWSPowerUserAccess')
        self.cognito_client = self.boto3_session.client('cognito-idp', region_name=self.region)
 
    def get_secret_hash(self, username: str) -> str:
        msg = username + self.client_id
        dig = hmac.new(
            key=self.client_secret.encode('utf-8'),
            msg=msg.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()
        return base64.b64encode(dig).decode()
 
    async def sign_up(self, email: str, password: str):
        client = self.cognito_client  
        try:
            user_params = {"UserPoolId": self.user_pool_id, "Username": email}
            user_response = client.admin_get_user(**user_params)
 
            if user_response.get('UserStatus') != 'CONFIRMED':
                client.admin_delete_user(**user_params)
            else:
                raise HTTPException(
                    status_code=400, detail="Email already registered and confirmed"
                )
 
        except ClientError as e:
            if e.response['Error']['Code'] != 'UserNotFoundException':
                raise HTTPException(status_code=400, detail=str(e))
 
        try:
            params = {
                "ClientId": self.client_id,
                "Username": email,
                "Password": password,
                "SecretHash": self.get_secret_hash(email),
                "UserAttributes": [
                    {"Name": "email", "Value": email},
                    {"Name": "name", "Value": email.split('@')[0]}
                ]
            }
            response = client.sign_up(**params)
            return {
                "success": True,
                "message": "Registration successful. Please check your email for verification code.",
                "user_sub": response['UserSub']
            }
 
        except ClientError as e:
            error_code = getattr(e, 'response', {}).get('Error', {}).get('Code', '')
            if error_code == 'UsernameExistsException':
                raise HTTPException(status_code=400, detail="Email already registered")
            raise HTTPException(status_code=400, detail=str(e))
 
    async def confirm_sign_up(self, email: str, confirmation_code: str):
        client = self.cognito_client  
        try:
            params = {
                "ClientId": self.client_id,
                "Username": email,
                "ConfirmationCode": confirmation_code,
                "SecretHash": self.get_secret_hash(email)
            }
 
            client.confirm_sign_up(**params)
 
            return {"success": True, "message": "Email verified successfully"}
 
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'CodeMismatchException':
                raise HTTPException(
                    status_code=400, detail="Invalid verification code"
                )
            raise HTTPException(status_code=400, detail=str(e))
 
    async def sign_in(self, email: str, password: str):
        client = self.cognito_client
        try:
            response = client.initiate_auth(
                ClientId=self.client_id,
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters={
                    'USERNAME': email,
                    'PASSWORD': password,
                    "SECRET_HASH": self.get_secret_hash(email)
                }
            )
            return {
                "access_token": response['AuthenticationResult']['AccessToken'],
                "id_token": response['AuthenticationResult']['IdToken'],
                "refresh_token": response['AuthenticationResult']['RefreshToken']
            }
        except ClientError as e:
            raise HTTPException(status_code=401, detail=str(e))