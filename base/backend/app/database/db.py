# db.py - Gestion de base de données asynchrone minimaliste

import asyncpg
import uuid
from config.config import settings

async def get_async_db_connection():
    """Retourne une connexion PostgreSQL asynchrone."""
    return await asyncpg.connect(
        host=settings.db_host,
        port=settings.db_port,
        database=settings.db_name,
        user=settings.db_user,
        password=settings.db_password
    )

async def init_db():
    """Crée la base de données et ses tables si elles n'existent pas."""
    conn = await get_async_db_connection()
    try:
        # Table users
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR NOT NULL,
                last_name VARCHAR NOT NULL,
                email VARCHAR UNIQUE NOT NULL,
                password_hash VARCHAR NOT NULL DEFAULT '',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)

        # Table password_reset_tokens
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                token VARCHAR NOT NULL UNIQUE,
                expires_at VARCHAR NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)

        print("Database initialized successfully")
    finally:
        await conn.close()