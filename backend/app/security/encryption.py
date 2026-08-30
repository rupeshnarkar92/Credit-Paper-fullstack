import base64
import json
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

_key_cache = None

def get_key() -> bytes:
    global _key_cache
    if _key_cache:
        return _key_cache

    key_str = os.getenv("ENCRYPTION_KEY", "")
    if not key_str:
        from app.config import get_settings
        settings = get_settings()
        key_str = settings.ENCRYPTION_KEY

    if not key_str:
        raise ValueError("ENCRYPTION_KEY not set in environment or .env")

    _key_cache = base64.b64decode(key_str)
    return _key_cache


def encrypt(data: dict) -> str:
    key = get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    plaintext = json.dumps(data).encode()
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    return base64.b64encode(nonce + ciphertext).decode()


def decrypt(token: str) -> dict:
    key = get_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(token)
    nonce = raw[:12]
    ciphertext = raw[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return json.loads(plaintext)
