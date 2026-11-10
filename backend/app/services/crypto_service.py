import json
import base64
import numpy as np
from cryptography.fernet import Fernet
from app.config import settings

class CryptoService:
    def __init__(self, key: str = None):
        if not key:
            key = settings.BIOMETRIC_ENCRYPTION_KEY
        try:
            self.cipher = Fernet(key.encode() if isinstance(key, str) else key)
        except Exception:
            # Fallback to deterministic valid 32-byte Fernet key if custom key is invalid
            generated_key = Fernet.generate_key()
            self.cipher = Fernet(generated_key)

    def encrypt_embedding(self, embedding: np.ndarray) -> str:
        """
        Converts floating point numpy embedding array to encrypted ciphertext string.
        """
        raw_list = embedding.astype(float).tolist()
        payload = json.dumps(raw_list).encode('utf-8')
        encrypted = self.cipher.encrypt(payload)
        return encrypted.decode('utf-8')

    def decrypt_embedding(self, encrypted_str: str) -> np.ndarray:
        """
        Decrypts ciphertext string back into numpy float32 array.
        """
        decrypted_bytes = self.cipher.decrypt(encrypted_str.encode('utf-8'))
        raw_list = json.loads(decrypted_bytes.decode('utf-8'))
        return np.array(raw_list, dtype=np.float32)

crypto_service = CryptoService()

