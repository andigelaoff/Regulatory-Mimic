import io
import boto3
import openai
from docx import Document
from loguru import logger
from requests_aws4auth import AWS4Auth
from app.core.config import get_settings
from opensearchpy import OpenSearch, RequestsHttpConnection


settings_env = get_settings()

if not settings_env.OPENAI_API_KEY:
    raise ValueError(" OpenAI API Key is missing!")

openai.api_key = settings_env.OPENAI_API_KEY


session = boto3.Session(profile_name='AWSPowerUserAccess')
credentials = session.get_credentials().get_frozen_credentials()

awsauth = AWS4Auth(
    credentials.access_key,
    credentials.secret_key,
    settings_env.AWS_REGION,
    "aoss",
    session_token=credentials.token,
)

client = OpenSearch(
    hosts=[{"host": settings_env.OPENSEARCH_HOST, "port": 443}],
    http_auth=awsauth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)
# Ensure Index Exists
def create_index():
    settings = {
        "settings": {
            "index": {
                "number_of_shards": 1,
                "number_of_replicas": 2,
                "knn": True
            }
        },
        "mappings": {
            "properties": {
                "file_name": {"type": "text"},
                "content": {"type": "text", "analyzer": "standard"},
                "embedding": {
                    "type": "knn_vector",
                    "dimension": 1536,
                    "method": {
                        "name": "hnsw",
                        "space_type": "cosinesimil",
                        "engine": "nmslib"
                    }
                }
            }
        }
    }

    if not client.indices.exists(index=settings_env.INDEX_NAME):
        client.indices.create(index=settings_env.INDEX_NAME, body=settings)
        print(f" Created index '{settings_env.INDEX_NAME}' with k-NN vector search.")
    else:
        print(f" Index '{settings_env.INDEX_NAME}' already exists. Skipping creation.")


#  Extract Text from DOCX
def extract_text_from_docx(file_stream):
    document = Document(io.BytesIO(file_stream))
    return "\n".join([para.text for para in document.paragraphs])

#  Generate OpenAI Embeddings


def get_embedding(text):
    """
    Generate an embedding for the given text using OpenAI (Updated for OpenAI >=1.0.0).
    """
    try:
        client = openai.OpenAI(api_key=settings_env.OPENAI_API_KEY)
        response = client.embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        raise


# Fetch & Index S3 Documents
def is_document_indexed(file_name):
    """Check if a document is already indexed in OpenSearch."""
    search_body = {
        "query": {
            "match": {
                "file_name": file_name  # Checking if file exists
            }
        }
    }
    response = client.search(index=settings_env.INDEX_NAME, body=search_body)
    return response["hits"]["total"]["value"] > 0  # True if document exists


def index_s3_documents():
    """Indexing S3 documents in OpenSearch only if they are not already indexed."""
    s3_client = session.client("s3")

    # Only create the index if it does not exist
    if not client.indices.exists(index=settings_env.INDEX_NAME):
        create_index()

    response = s3_client.list_objects_v2(Bucket=settings_env.S3_BUCKET_NAME)
    if "Contents" not in response:
        print("No files found in S3 bucket!")
        return

    for obj in response["Contents"]:
        file_name = obj["Key"]

        #  Check if the document is already indexed
        if is_document_indexed(file_name):
            print(f" Skipping {file_name}, already indexed.")
            continue

        print(f"📥 Fetching {file_name} from S3...")

        file_obj = s3_client.get_object(Bucket=settings_env.S3_BUCKET_NAME, Key=file_name)
        file_content = file_obj["Body"].read()

        extracted_text = extract_text_from_docx(
            file_content) if file_name.endswith(".docx") else ""

        if not extracted_text:
            print(f"Skipping {file_name} because no text was extracted.")
            continue
        embedding = get_embedding(extracted_text)

        document_body = {
            "file_name": file_name,
            "content": extracted_text,
            "embedding": embedding
        }

        client.index(index=settings_env.INDEX_NAME, body=document_body)
        print(f" Indexed {file_name}")


#  OpenSearch Search Function
def search_opensearch(query):
    query_embedding = get_embedding(query)
    if not query_embedding:
        return []

    search_body = {
        "size": 5,
        "query": {
            "knn": {
                "embedding": {
                    "vector": query_embedding,
                    "k": 5,

                }
            }
        }
    }

    response = client.search(index=settings_env.INDEX_NAME, body=search_body)

    results = []
    for hit in response["hits"]["hits"]:
        results.append({
            "file_name": hit["_source"]["file_name"],
            "content": hit["_source"]["content"],
            "score": hit["_score"]
        })

    return results


index_s3_documents()
