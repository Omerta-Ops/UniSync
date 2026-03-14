"""
OAuth token lifecycle management.
Handles encryption, decryption, storage, and refresh of OAuth tokens
for both Gmail and Outlook accounts.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import httpx
import structlog

from app.config import get_settings
from app.utils.crypto import get_encryptor

logger = structlog.get_logger(__name__)


class TokenManager:
    """Manages OAuth token lifecycle for linked email accounts."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._encryptor = get_encryptor()
        self._http = httpx.AsyncClient(timeout=30.0)

    async def close(self) -> None:
        """Close the HTTP client."""
        await self._http.aclose()

    # ── Token Storage ───────────────────────────────────────────────────

    def encrypt_refresh_token(self, token: str) -> str:
        """Encrypt a refresh token for storage."""
        return self._encryptor.encrypt(token)

    def decrypt_refresh_token(self, encrypted: str) -> str:
        """Decrypt a stored refresh token."""
        return self._encryptor.decrypt(encrypted)

    @staticmethod
    def hash_access_token(token: str) -> str:
        """Hash an access token for lookup (never store raw)."""
        return hashlib.sha256(token.encode()).hexdigest()

    # ── Gmail Token Refresh ─────────────────────────────────────────────

    async def refresh_gmail_token(
        self, encrypted_refresh_token: str
    ) -> Tuple[str, str, datetime]:
        """
        Refresh a Gmail OAuth access token.

        Args:
            encrypted_refresh_token: The Fernet-encrypted refresh token.

        Returns:
            Tuple of (new_access_token, new_encrypted_refresh_token, expires_at).

        Raises:
            httpx.HTTPStatusError: If Google rejects the refresh request.
            ValueError: If token decryption fails.
        """
        refresh_token = self.decrypt_refresh_token(encrypted_refresh_token)

        response = await self._http.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": self._settings.gmail_client_id,
                "client_secret": self._settings.gmail_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        response.raise_for_status()
        data = response.json()

        access_token = data["access_token"]
        # Google may return a new refresh token — if so, rotate it
        new_refresh = data.get("refresh_token", refresh_token)
        new_encrypted = self.encrypt_refresh_token(new_refresh)
        expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=data.get("expires_in", 3600)
        )

        logger.info("gmail_token_refreshed")
        return access_token, new_encrypted, expires_at

    # ── Outlook Token Refresh ───────────────────────────────────────────

    async def refresh_outlook_token(
        self, encrypted_refresh_token: str
    ) -> Tuple[str, str, datetime]:
        """
        Refresh a Microsoft Graph OAuth access token.

        Args:
            encrypted_refresh_token: The Fernet-encrypted refresh token.

        Returns:
            Tuple of (new_access_token, new_encrypted_refresh_token, expires_at).

        Raises:
            httpx.HTTPStatusError: If Microsoft rejects the refresh request.
            ValueError: If token decryption fails.
        """
        refresh_token = self.decrypt_refresh_token(encrypted_refresh_token)

        tenant = self._settings.outlook_tenant_id
        response = await self._http.post(
            f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
            data={
                "client_id": self._settings.outlook_client_id,
                "client_secret": self._settings.outlook_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
                "scope": " ".join(self._settings.outlook_scopes),
            },
        )
        response.raise_for_status()
        data = response.json()

        access_token = data["access_token"]
        new_refresh = data.get("refresh_token", refresh_token)
        new_encrypted = self.encrypt_refresh_token(new_refresh)
        expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=data.get("expires_in", 3600)
        )

        logger.info("outlook_token_refreshed")
        return access_token, new_encrypted, expires_at

    # ── Gmail OAuth Exchange ────────────────────────────────────────────

    async def exchange_gmail_code(
        self, authorization_code: str
    ) -> Tuple[str, str, str, datetime]:
        """
        Exchange a Gmail authorization code for tokens.

        Returns:
            Tuple of (access_token, encrypted_refresh_token, email_address, expires_at).
        """
        response = await self._http.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": self._settings.gmail_client_id,
                "client_secret": self._settings.gmail_client_secret,
                "code": authorization_code,
                "grant_type": "authorization_code",
                "redirect_uri": self._settings.gmail_redirect_uri,
            },
        )
        response.raise_for_status()
        data = response.json()

        access_token = data["access_token"]
        refresh_token = data.get("refresh_token", "")
        encrypted_refresh = self.encrypt_refresh_token(refresh_token) if refresh_token else ""
        expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=data.get("expires_in", 3600)
        )

        # Get user email from the access token
        profile_resp = await self._http.get(
            "https://www.googleapis.com/gmail/v1/users/me/profile",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        profile_resp.raise_for_status()
        email_address = profile_resp.json().get("emailAddress", "")

        logger.info("gmail_code_exchanged", email=email_address)
        return access_token, encrypted_refresh, email_address, expires_at

    # ── Outlook OAuth Exchange ──────────────────────────────────────────

    async def exchange_outlook_code(
        self, authorization_code: str
    ) -> Tuple[str, str, str, datetime]:
        """
        Exchange an Outlook authorization code for tokens.

        Returns:
            Tuple of (access_token, encrypted_refresh_token, email_address, expires_at).
        """
        tenant = self._settings.outlook_tenant_id
        response = await self._http.post(
            f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
            data={
                "client_id": self._settings.outlook_client_id,
                "client_secret": self._settings.outlook_client_secret,
                "code": authorization_code,
                "grant_type": "authorization_code",
                "redirect_uri": self._settings.outlook_redirect_uri,
                "scope": " ".join(self._settings.outlook_scopes),
            },
        )
        response.raise_for_status()
        data = response.json()

        access_token = data["access_token"]
        refresh_token = data.get("refresh_token", "")
        encrypted_refresh = self.encrypt_refresh_token(refresh_token) if refresh_token else ""
        expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=data.get("expires_in", 3600)
        )

        # Get user profile
        profile_resp = await self._http.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        profile_resp.raise_for_status()
        profile = profile_resp.json()
        email_address = profile.get("mail") or profile.get("userPrincipalName", "")

        logger.info("outlook_code_exchanged", email=email_address)
        return access_token, encrypted_refresh, email_address, expires_at

    # ── Token Validation ────────────────────────────────────────────────

    async def get_valid_access_token(
        self,
        provider: str,
        encrypted_refresh_token: str,
        token_expires_at: Optional[datetime] = None,
        current_access_token: Optional[str] = None,
    ) -> Tuple[str, Optional[str], Optional[datetime]]:
        """
        Get a valid access token, refreshing if necessary.

        Returns:
            Tuple of (access_token, updated_encrypted_refresh_token, new_expires_at).
            If no refresh was needed, the last two values are None.
        """
        # If we have a valid, non-expired access token, use it
        if (
            current_access_token
            and token_expires_at
            and token_expires_at > datetime.now(timezone.utc) + timedelta(minutes=5)
        ):
            return current_access_token, None, None

        # Need to refresh
        if provider == "gmail":
            access_token, new_encrypted, expires_at = await self.refresh_gmail_token(
                encrypted_refresh_token
            )
        elif provider == "outlook":
            access_token, new_encrypted, expires_at = await self.refresh_outlook_token(
                encrypted_refresh_token
            )
        else:
            raise ValueError(f"Unknown provider: {provider}")

        return access_token, new_encrypted, expires_at
