"""
AES-256 token encryption using Fernet.
Encrypts OAuth refresh tokens before storage, decrypts on retrieval.
"""

from __future__ import annotations

import hashlib
import structlog
from cryptography.fernet import Fernet, InvalidToken

from app.config import get_settings

logger = structlog.get_logger(__name__)


class TokenEncryptor:
    """Handles encryption/decryption of OAuth tokens using Fernet (AES-128-CBC)."""

    def __init__(self, key: str | None = None) -> None:
        """
        Initialize with a Fernet key.

        Args:
            key: Base64-encoded 32-byte key. If None, reads from settings.
        """
        self._key = key or get_settings().token_encryption_key
        if not self._key:
            logger.warning("token_encryption_key not set — encryption disabled")
            self._fernet = None
        else:
            try:
                self._fernet = Fernet(self._key.encode())
            except Exception as exc:
                logger.error("invalid_encryption_key", error=str(exc))
                raise ValueError(
                    "TOKEN_ENCRYPTION_KEY must be a valid Fernet key "
                    "(use `python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'` "
                    "to generate one)"
                ) from exc

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a token string.

        Args:
            plaintext: The raw token to encrypt.

        Returns:
            Base64-encoded encrypted token.

        Raises:
            RuntimeError: If encryption is not configured.
        """
        if self._fernet is None:
            logger.warning("encryption_disabled", action="encrypt")
            raise RuntimeError("Token encryption is not configured")

        return self._fernet.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt an encrypted token string.

        Args:
            ciphertext: The encrypted token.

        Returns:
            The original plaintext token.

        Raises:
            RuntimeError: If encryption is not configured.
            ValueError: If the token cannot be decrypted (wrong key or corrupted).
        """
        if self._fernet is None:
            logger.warning("encryption_disabled", action="decrypt")
            raise RuntimeError("Token encryption is not configured")

        try:
            return self._fernet.decrypt(ciphertext.encode()).decode()
        except InvalidToken as exc:
            logger.error("token_decryption_failed", error=str(exc))
            raise ValueError("Cannot decrypt token — key mismatch or corrupted data") from exc

    @staticmethod
    def hash_token(token: str) -> str:
        """
        Create a SHA-256 hash of a token for lookup purposes.
        Never store raw access tokens — only their hashes.

        Args:
            token: The raw token string.

        Returns:
            Hex-encoded SHA-256 hash.
        """
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def generate_key() -> str:
        """Generate a new Fernet key for use as TOKEN_ENCRYPTION_KEY."""
        return Fernet.generate_key().decode()


# Module-level singleton
_encryptor: TokenEncryptor | None = None


def get_encryptor() -> TokenEncryptor:
    """Get or create the singleton TokenEncryptor."""
    global _encryptor
    if _encryptor is None:
        _encryptor = TokenEncryptor()
    return _encryptor
