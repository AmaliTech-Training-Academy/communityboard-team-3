"""
Key Management System (KMS) — AES-256-GCM encryption for PII protection.

Supports two key providers:
  1. **local**  — 256-bit key from environment variable (dev / single-node)
  2. **aws**    — AWS KMS envelope encryption (production)

AES-256-GCM provides:
  - 256-bit encryption strength
  - Authenticated encryption (integrity + confidentiality)
  - Unique IV per encryption call (no IV reuse)
"""

from __future__ import annotations

import base64
import logging
import os
import secrets

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from config import pipeline_config

logger = logging.getLogger("etl.kms")

# Key providers
# ---------------------------------------------------------------------------

_data_key: bytes | None = None


def _resolve_key_local() -> bytes:
    """Load a 256-bit key from ETL_KMS_KEY (hex or base64)."""
    raw = pipeline_config.kms_key
    if not raw:
        raise RuntimeError(
            "ETL_KMS_KEY is not set. Generate one with: "
            "python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    # Try hex first (64 hex chars = 32 bytes)
    try:
        key = bytes.fromhex(raw)
        if len(key) == 32:
            return key
    except ValueError:
        pass
    # Try base64 (44 chars = 32 bytes)
    try:
        key = base64.urlsafe_b64decode(raw)
        if len(key) == 32:
            return key
    except Exception:
        pass
    raise ValueError(
        "ETL_KMS_KEY must be a 256-bit key encoded as 64 hex chars or 44-char base64"
    )


def _resolve_key_aws() -> bytes:
    """Use AWS KMS to generate / decrypt a data encryption key (envelope encryption).

    Requires: boto3, ETL_KMS_AWS_KEY_ID
    """
    try:
        import boto3  # type: ignore[import-untyped]
    except ImportError:
        raise RuntimeError("boto3 is required for AWS KMS — pip install boto3")

    key_id = os.getenv("ETL_KMS_AWS_KEY_ID", "")
    if not key_id:
        raise RuntimeError("ETL_KMS_AWS_KEY_ID must be set for AWS KMS provider")

    region = os.getenv("ETL_KMS_AWS_REGION", "us-east-1")
    client = boto3.client("kms", region_name=region)

    # Generate a data key — KMS returns plaintext + ciphertext blob
    resp = client.generate_data_key(KeyId=key_id, KeySpec="AES_256")
    return resp["Plaintext"]  # 32-byte key


_KEY_PROVIDERS = {
    "local": _resolve_key_local,
    "aws": _resolve_key_aws,
}


def _get_data_key() -> bytes:
    """Return the 256-bit AES key, resolved once and cached."""
    global _data_key
    if _data_key is None:
        provider = pipeline_config.kms_provider
        resolver = _KEY_PROVIDERS.get(provider)
        if resolver is None:
            raise ValueError(
                f"Unknown KMS provider '{provider}'. Choose from: {list(_KEY_PROVIDERS)}"
            )
        _data_key = resolver()
        logger.info("KMS: data key loaded via '%s' provider", provider)
    return _data_key


# AES-256-GCM encrypt / decrypt
# ---------------------------------------------------------------------------

_IV_BYTES = 12  # 96-bit nonce — recommended for GCM


def encrypt(plaintext: str) -> str:
    """Encrypt *plaintext* with AES-256-GCM.

    Returns a URL-safe base64 string:  ``base64(iv ‖ ciphertext ‖ tag)``
    Each call generates a random 96-bit IV.
    """
    if not plaintext:
        return ""
    key = _get_data_key()
    iv = secrets.token_bytes(_IV_BYTES)
    aes = AESGCM(key)
    ct = aes.encrypt(iv, plaintext.encode("utf-8"), None)  # ct includes 16-byte tag
    return base64.urlsafe_b64encode(iv + ct).decode("ascii")


def decrypt(token: str) -> str:
    """Decrypt a token produced by :func:`encrypt`.

    Raises ``RuntimeError`` if the key is wrong or data was tampered.
    """
    if not token:
        return ""
    key = _get_data_key()
    raw = base64.urlsafe_b64decode(token)
    iv, ct = raw[:_IV_BYTES], raw[_IV_BYTES:]
    aes = AESGCM(key)
    try:
        plaintext = aes.decrypt(iv, ct, None)
    except Exception as exc:
        raise RuntimeError(f"AES-256-GCM decryption failed — wrong key or tampered data: {exc}")
    return plaintext.decode("utf-8")
