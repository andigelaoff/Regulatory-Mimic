FROM tiangolo/uvicorn-gunicorn-fastapi:python3.9

COPY requirements.txt /app/requirements.txt
COPY .env /app/app/.env

RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt 


COPY ./app /app/app

WORKDIR /app/app/

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]