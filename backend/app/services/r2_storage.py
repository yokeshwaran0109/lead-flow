from functools import lru_cache

import boto3
from botocore.config import Config

from app.core.config import settings


@lru_cache
def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def generate_presigned_put_url(key: str, content_type: str, expires_in: int = 3600) -> str:
    client = _client()
    return client.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.r2_bucket_name, "Key": key, "ContentType": content_type},
        ExpiresIn=expires_in,
    )


def generate_presigned_get_url(key: str, expires_in: int = 3600) -> str:
    client = _client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.r2_bucket_name, "Key": key},
        ExpiresIn=expires_in,
    )
