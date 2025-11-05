# crud.py - CRUD unifié asynchrone minimaliste

import asyncpg
import json
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
from config.config import settings

# ============================
# CONNEXION ASYNCHRONE
# ============================

async def get_async_db_connection():
    """Retourne une connexion PostgreSQL asynchrone."""
    return await asyncpg.connect(
        host=settings.db_host,
        port=settings.db_port,
        database=settings.db_name,
        user=settings.db_user,
        password=settings.db_password
    )

# ============================
# USERS
# ============================

async def create_user(username: str, email: str, password_hash: str = '', 
                     first_name: str = '', last_name: str = '', status: str = 'active') -> int:
    """Crée un nouvel utilisateur et retourne son ID."""
    conn = await get_async_db_connection()
    try:
        result = await conn.fetchrow(
            """INSERT INTO users (username, email, password_hash, first_name, last_name, status) 
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING id""",
            username, email, password_hash, first_name, last_name, status
        )
        return result['id'] if result else None
    finally:
        await conn.close()

async def get_user_by_username(username: str) -> Optional[Dict]:
    """Récupère un utilisateur par nom d'utilisateur."""
    conn = await get_async_db_connection()
    try:
        result = await conn.fetchrow("SELECT * FROM users WHERE username = $1", username)
        return dict(result) if result else None
    finally:
        await conn.close()

async def get_user(user_id: int) -> Optional[Dict]:
    """Récupère un utilisateur par ID."""
    conn = await get_async_db_connection()
    try:
        result = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
        return dict(result) if result else None
    finally:
        await conn.close()

async def get_user_by_email(email: str) -> Optional[Dict]:
    """Récupère un utilisateur par email."""
    conn = await get_async_db_connection()
    try:
        result = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)
        return dict(result) if result else None
    finally:
        await conn.close()

async def list_users() -> List[Dict]:
    """Renvoie la liste de tous les utilisateurs."""
    conn = await get_async_db_connection()
    try:
        rows = await conn.fetch("SELECT * FROM users")
        return [dict(row) for row in rows]
    finally:
        await conn.close()

async def update_user_password(user_id: int, password_hash: str) -> bool:
    """Met à jour uniquement le mot de passe d'un utilisateur."""
    conn = await get_async_db_connection()
    try:
        result = await conn.execute(
            "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
            password_hash, user_id
        )
        return int(result.split()[1]) > 0
    finally:
        await conn.close()

async def update_user_profile(user_id: int, username: str, first_name: str, last_name: str) -> bool:
    """Met à jour le profil d'un utilisateur."""
    conn = await get_async_db_connection()
    try:
        result = await conn.execute(
            "UPDATE users SET username = $1, first_name = $2, last_name = $3, updated_at = NOW() WHERE id = $4",
            username, first_name, last_name, user_id
        )
        return int(result.split()[1]) > 0
    finally:
        await conn.close()

async def activate_user_by_email(email: str) -> bool:
    """Active un utilisateur par son email."""
    conn = await get_async_db_connection()
    try:
        result = await conn.execute(
            "UPDATE users SET status = 'active', updated_at = NOW() WHERE email = $1 AND status = 'pending_payment'",
            email
        )
        return int(result.split()[1]) > 0
    finally:
        await conn.close()

async def delete_user(user_id: int) -> bool:
    """Supprime un utilisateur par ID."""
    conn = await get_async_db_connection()
    try:
        result = await conn.execute("DELETE FROM users WHERE id = $1", user_id)
        return int(result.split()[1]) > 0
    finally:
        await conn.close()

# ============================
# PASSWORD RESET TOKENS
# ============================

async def create_reset_token(user_id: int, token: str, expires_at: str) -> int:
    """Crée un token de réinitialisation et retourne son ID."""
    conn = await get_async_db_connection()
    try:
        result = await conn.fetchrow(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id",
            user_id, token, expires_at
        )
        return result['id'] if result else None
    finally:
        await conn.close()

async def get_reset_token(token: str) -> Optional[Dict]:
    """Récupère un token de réinitialisation valide."""
    conn = await get_async_db_connection()
    try:
        result = await conn.fetchrow(
            "SELECT * FROM password_reset_tokens WHERE token = $1 AND is_used = FALSE",
            token
        )
        return dict(result) if result else None
    finally:
        await conn.close()

async def mark_token_used(token: str) -> bool:
    """Marque un token comme utilisé."""
    conn = await get_async_db_connection()
    try:
        result = await conn.execute(
            "UPDATE password_reset_tokens SET is_used = TRUE WHERE token = $1",
            token
        )
        return int(result.split()[1]) > 0
    finally:
        await conn.close()