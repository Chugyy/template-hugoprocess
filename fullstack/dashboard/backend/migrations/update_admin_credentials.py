#!/usr/bin/env python3
"""
Migration: Update admin credentials for production
- Change admin email to contact@multimodal.digital
- Update admin first_name and last_name
- Generate secure password
"""

import asyncio
import sys
import os
import secrets

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.db import get_async_db_connection
from app.core.utils.auth import hash_password


async def upgrade():
    conn = await get_async_db_connection()
    try:
        # Configuration
        old_email = "admin@admin.admin"
        new_email = "contact@multimodal.digital"
        new_password = secrets.token_urlsafe(16)

        # Vérifier si l'ancien admin existe
        old_admin_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)",
            old_email
        )

        if old_admin_exists:
            # Mettre à jour l'admin existant
            password_hash = hash_password(new_password)
            await conn.execute(
                """UPDATE users
                   SET email = $1,
                       username = $2,
                       password_hash = $3,
                       first_name = $4,
                       last_name = $5,
                       updated_at = NOW()
                   WHERE email = $6""",
                new_email, "contact", password_hash, "Contact", "Multimodal Digital", old_email
            )
            print(f"✅ Admin credentials updated successfully")
            print(f"📧 Email: {new_email}")
            print(f"🔑 Password: {new_password}")
            print("⚠️  IMPORTANT: Save this password securely, it will not be shown again!")
        else:
            # Créer le nouvel admin si l'ancien n'existe pas
            password_hash = hash_password(new_password)
            await conn.execute(
                """INSERT INTO users (username, email, password_hash, first_name, last_name, status)
                   VALUES ($1, $2, $3, $4, $5, $6)""",
                "contact", new_email, password_hash, "Contact", "Multimodal Digital", "active"
            )
            print(f"✅ Admin user created successfully")
            print(f"📧 Email: {new_email}")
            print(f"🔑 Password: {new_password}")
            print("⚠️  IMPORTANT: Save this password securely, it will not be shown again!")

    finally:
        await conn.close()


async def downgrade():
    conn = await get_async_db_connection()
    try:
        new_email = "contact@multimodal.digital"
        old_email = "admin@admin.admin"
        old_password_hash = hash_password("admin")

        await conn.execute(
            """UPDATE users
               SET email = $1,
                   username = $2,
                   password_hash = $3,
                   first_name = $4,
                   last_name = $5,
                   updated_at = NOW()
               WHERE email = $6""",
            old_email, "admin", old_password_hash, "Admin", "User", new_email
        )
        print("Rollback completed: restored admin@admin.admin")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(upgrade())
