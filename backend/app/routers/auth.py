"""
Authentication routes.
Handles Supabase token verification, OAuth linking for Gmail/Outlook.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from jose import jwt

from app.config import get_settings
from app.models.schemas import (
    LinkedAccountResponse,
    MessageResponse,
    OAuthInitResponse,
    TokenResponse,
    TokenVerifyRequest,
)
from app.utils.rate_limit import limiter

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Supabase Token Verification ─────────────────────────────────────────

@router.post("/verify-token", response_model=TokenResponse)
@limiter.limit("10/minute")
async def verify_supabase_token(
    request: Request,
    body: TokenVerifyRequest,
) -> TokenResponse:
    """
    Verify a Supabase access token and issue an internal JWT.
    Creates a user record in the users table if this is the first login.
    """
    settings = get_settings()

    try:
        # Verify the Supabase JWT
        payload = jwt.decode(
            body.access_token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(exc)}")

    auth_uid = payload.get("sub")
    email = payload.get("email", "")

    if not auth_uid:
        raise HTTPException(status_code=401, detail="Token missing subject claim")

    # Check/create user in our users table via Supabase
    from supabase import create_client
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

    user_resp = supabase.table("users").select("id").eq("auth_uid", auth_uid).execute()

    if not user_resp.data:
        # Auto-create user on first login (backup if trigger didn't fire)
        full_name = payload.get("user_metadata", {}).get("full_name", "")
        supabase.table("users").insert({
            "auth_uid": auth_uid,
            "email": email,
            "full_name": full_name,
        }).execute()
        user_resp = supabase.table("users").select("id").eq("auth_uid", auth_uid).execute()

    user_id = user_resp.data[0]["id"]

    # Issue internal JWT
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_expiration_minutes
    )
    internal_token = jwt.encode(
        {
            "sub": str(user_id),
            "auth_uid": str(auth_uid),
            "email": email,
            "exp": expires_at,
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    logger.info("token_verified", user_id=str(user_id))
    return TokenResponse(
        internal_token=internal_token,
        user_id=str(user_id),
        email=email,
        expires_at=expires_at,
    )


# ── Gmail OAuth Link ───────────────────────────────────────────────────

@router.post("/link/gmail", response_model=OAuthInitResponse)
@limiter.limit("10/minute")
async def link_gmail(request: Request) -> OAuthInitResponse:
    """Initiate OAuth 2.0 PKCE flow for Gmail."""
    settings = get_settings()
    state = secrets.token_urlsafe(32)

    params = {
        "client_id": settings.gmail_client_id,
        "redirect_uri": settings.gmail_redirect_uri,
        "response_type": "code",
        "scope": " ".join(settings.gmail_scopes),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

    return OAuthInitResponse(authorization_url=auth_url, state=state)


@router.get("/callback/gmail", response_model=MessageResponse)
async def gmail_callback(
    request: Request,
    code: str = "",
    state: str = "",
    error: str = "",
) -> MessageResponse:
    """
    Handle Google OAuth callback.
    Exchanges the authorization code for tokens, encrypts, and stores them.
    Triggers initial email sync.
    """
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth error: {error}")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    settings = get_settings()

    # Get internal user from the request (requires auth middleware)
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    from app.services.token_manager import TokenManager
    token_manager = TokenManager()

    try:
        access_token, encrypted_refresh, email_address, expires_at = (
            await token_manager.exchange_gmail_code(code)
        )
    except Exception as exc:
        logger.error("gmail_code_exchange_failed", error=str(exc))
        raise HTTPException(status_code=400, detail="Failed to exchange authorization code")
    finally:
        await token_manager.close()

    # Store the linked account
    from supabase import create_client
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

    from app.utils.crypto import TokenEncryptor
    access_hash = TokenEncryptor.hash_token(access_token)

    try:
        supabase.table("linked_accounts").upsert({
            "user_id": user_id,
            "provider": "gmail",
            "email_address": email_address,
            "encrypted_refresh_token": encrypted_refresh,
            "access_token_hash": access_hash,
            "token_expires_at": expires_at.isoformat(),
            "is_active": True,
        }, on_conflict="user_id,provider,email_address").execute()
    except Exception as exc:
        logger.error("linked_account_upsert_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to save linked account")

    # Trigger initial email sync
    account_resp = supabase.table("linked_accounts").select("id").eq(
        "user_id", user_id
    ).eq("provider", "gmail").eq("email_address", email_address).single().execute()

    if account_resp.data:
        from app.workers.tasks import bulk_sync_account
        bulk_sync_account.delay(account_resp.data["id"])

    logger.info("gmail_linked", user_id=user_id, email=email_address)
    return MessageResponse(message="Gmail account linked successfully. Syncing emails...")


# ── Outlook OAuth Link ─────────────────────────────────────────────────

@router.post("/link/outlook", response_model=OAuthInitResponse)
@limiter.limit("10/minute")
async def link_outlook(request: Request) -> OAuthInitResponse:
    """Initiate OAuth 2.0 flow for Microsoft Outlook."""
    settings = get_settings()
    state = secrets.token_urlsafe(32)
    tenant = settings.outlook_tenant_id

    params = {
        "client_id": settings.outlook_client_id,
        "redirect_uri": settings.outlook_redirect_uri,
        "response_type": "code",
        "scope": " ".join(settings.outlook_scopes) + " offline_access",
        "state": state,
        "prompt": "consent",
    }
    auth_url = (
        f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?"
        f"{urlencode(params)}"
    )

    return OAuthInitResponse(authorization_url=auth_url, state=state)


@router.get("/callback/outlook", response_model=MessageResponse)
async def outlook_callback(
    request: Request,
    code: str = "",
    state: str = "",
    error: str = "",
) -> MessageResponse:
    """Handle Microsoft OAuth callback."""
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth error: {error}")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    settings = get_settings()
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    from app.services.token_manager import TokenManager
    token_manager = TokenManager()

    try:
        access_token, encrypted_refresh, email_address, expires_at = (
            await token_manager.exchange_outlook_code(code)
        )
    except Exception as exc:
        logger.error("outlook_code_exchange_failed", error=str(exc))
        raise HTTPException(status_code=400, detail="Failed to exchange authorization code")
    finally:
        await token_manager.close()

    from supabase import create_client
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

    from app.utils.crypto import TokenEncryptor
    access_hash = TokenEncryptor.hash_token(access_token)

    try:
        supabase.table("linked_accounts").upsert({
            "user_id": user_id,
            "provider": "outlook",
            "email_address": email_address,
            "encrypted_refresh_token": encrypted_refresh,
            "access_token_hash": access_hash,
            "token_expires_at": expires_at.isoformat(),
            "is_active": True,
        }, on_conflict="user_id,provider,email_address").execute()
    except Exception as exc:
        logger.error("linked_account_upsert_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to save linked account")

    # Trigger initial sync
    account_resp = supabase.table("linked_accounts").select("id").eq(
        "user_id", user_id
    ).eq("provider", "outlook").eq("email_address", email_address).single().execute()

    if account_resp.data:
        from app.workers.tasks import bulk_sync_account
        bulk_sync_account.delay(account_resp.data["id"])

    logger.info("outlook_linked", user_id=user_id, email=email_address)
    return MessageResponse(message="Outlook account linked successfully. Syncing emails...")
