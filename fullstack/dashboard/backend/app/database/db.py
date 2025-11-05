# db.py - Gestion de base de données asynchrone minimaliste

import asyncpg
from config.config import settings
from app.core.utils.auth import hash_password

async def get_async_db_connection():
    """Retourne une connexion PostgreSQL asynchrone."""
    return await asyncpg.connect(
        host=settings.db_host,
        port=settings.db_port,
        database=settings.db_name,
        user=settings.db_user,
        password=settings.db_password
    )

async def get_db():
    """Dependency pour obtenir une connexion DB dans les routes."""
    conn = await get_async_db_connection()
    try:
        yield conn
    finally:
        await conn.close()

async def init_db():
    """Crée la base de données et ses tables si elles n'existent pas."""
    conn = await get_async_db_connection()
    try:
        # Table users
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR UNIQUE NOT NULL,
                email VARCHAR UNIQUE NOT NULL,
                password_hash VARCHAR NOT NULL DEFAULT '',
                first_name TEXT DEFAULT '',
                last_name TEXT DEFAULT '',
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)

        # Index pour améliorer les performances
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
        """)

        # Table contacts
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                company VARCHAR(255) NOT NULL,
                contact_name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                status VARCHAR(50) DEFAULT 'active',
                source VARCHAR(100),
                deal_value NUMERIC(12, 2),
                linkedin VARCHAR(500),
                instagram VARCHAR(500),
                twitter VARCHAR(500),
                website VARCHAR(500),
                youtube VARCHAR(500),
                tiktok VARCHAR(500),
                facebook VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_contact_date TIMESTAMP
            )
        """)

        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status)
        """)

        # Table communication_history
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS communication_history (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
                exchange_type VARCHAR(50) NOT NULL,
                exchange_date TIMESTAMP NOT NULL,
                exchange_context VARCHAR(50) DEFAULT 'discovery',
                summary TEXT,
                outcome VARCHAR(50),
                next_steps TEXT,
                participants TEXT,
                audio_file_url VARCHAR(500),
                transcription TEXT,
                ai_analysis TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_comm_history_contact_id ON communication_history(contact_id)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_comm_history_date ON communication_history(exchange_date)
        """)

        # Créer utilisateur admin par défaut
        admin_email = "contact@multimodal.digital"
        admin_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)",
            admin_email
        )

        if not admin_exists:
            import secrets
            admin_password = secrets.token_urlsafe(16)
            admin_password_hash = hash_password(admin_password)
            await conn.execute(
                """INSERT INTO users (username, email, password_hash, first_name, last_name, status)
                   VALUES ($1, $2, $3, $4, $5, $6)""",
                "hugo", admin_email, admin_password_hash, "Hugo", "Hoarau", "active"
            )
            print(f"Admin user created: {admin_email} / {admin_password}")
            print(f"Name: Hugo Hoarau")
            print("⚠️  IMPORTANT: Save this password securely, it will not be shown again!")

        print("Database initialized successfully")
    finally:
        await conn.close()