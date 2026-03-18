import json
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
import httpx
from jose import JWTError, jwt
from app.core.config import get_settings


settings = get_settings()
STATE_TOKEN_TYPE = "google_oauth_state"
STATE_TOKEN_TTL_MINUTES = 10
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
JWT_ALGORITHM = "HS256"


def ensure_google_oauth_config() -> None:
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET or not settings.GOOGLE_REDIRECT_URI:
        raise RuntimeError("Google OAuth is not configured (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI).")


def encode_google_state(mode: str, origin: str, user_id: int | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "type": STATE_TOKEN_TYPE,
        "mode": mode,
        "origin": origin,
        "nonce": secrets.token_urlsafe(16),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=STATE_TOKEN_TTL_MINUTES)).timestamp()),
    }
    if user_id is not None:
        payload["user_id"] = int(user_id)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_google_state(state_token: str) -> dict:
    try:
        payload = jwt.decode(state_token, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError as e:
        raise RuntimeError(f"Invalid OAuth state: {e}") from e
    if payload.get("type") != STATE_TOKEN_TYPE:
        raise RuntimeError("Invalid OAuth state token type")
    return payload


def build_google_auth_url(*, state_token: str, scopes: list[str]) -> str:
    ensure_google_oauth_config()
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(scopes),
        "state": state_token,
        "access_type": "offline",
        # prompt=consent helps ensure refresh_token is provided
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_google_code(code: str) -> dict:
    ensure_google_oauth_config()
    payload = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(GOOGLE_TOKEN_URL, data=payload)

    if response.status_code >= 400:
        text = response.text[:300].replace("\n", " ")
        raise RuntimeError(f"Google token exchange failed ({response.status_code}): {text}")
    return response.json()


async def refresh_google_access_token(refresh_token: str) -> dict:
    ensure_google_oauth_config()
    payload = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(GOOGLE_TOKEN_URL, data=payload)

    if response.status_code >= 400:
        text = response.text[:300].replace("\n", " ")
        raise RuntimeError(f"Google token refresh failed ({response.status_code}): {text}")
    return response.json()


async def fetch_google_userinfo(access_token: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(GOOGLE_USERINFO_URL, headers=headers)

    if response.status_code >= 400:
        text = response.text[:300].replace("\n", " ")
        raise RuntimeError(f"Google userinfo failed ({response.status_code}): {text}")
    return response.json()


def token_expiry_from_google_response(token_data: dict) -> datetime | None:
    expires_in = token_data.get("expires_in")
    if expires_in is None:
        return None
    try:
        return datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
    except (TypeError, ValueError):
        return None


def scopes_to_string(token_data: dict) -> str:
    scope = token_data.get("scope")
    if isinstance(scope, str):
        return " ".join([s for s in scope.split() if s])
    if isinstance(scope, list):
        return " ".join([str(s).strip() for s in scope if str(s).strip()])
    return ""


def build_popup_response_html(payload: dict, origin: str | None) -> str:
    safe_payload = json.dumps(payload)
    safe_origin = json.dumps(origin or "*")
    return f"""<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Loadout Google Auth</title></head>
  <body style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #e2e8f0;">
    <p id="msg">Finishing Google authentication...</p>
    <script>
      (function() {{
        const payload = {safe_payload};
        const targetOrigin = {safe_origin};
        try {{
          if (window.opener && typeof window.opener.postMessage === "function") {{
            window.opener.postMessage({{ type: "lifeplan_google_auth", payload }}, targetOrigin || "*");
          }}
          const ok = payload && payload.status === "success";
          document.getElementById("msg").textContent = ok
            ? "Authentication complete. You can close this window."
            : ("Authentication failed: " + (payload && payload.error ? payload.error : "unknown_error"));
        }} catch (e) {{
          document.getElementById("msg").textContent = "Authentication failed.";
        }}
        setTimeout(function() {{ window.close(); }}, 800);
      }})();
    </script>
  </body>
</html>"""
