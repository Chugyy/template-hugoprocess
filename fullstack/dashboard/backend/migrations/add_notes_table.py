#!/usr/bin/env python3
"""
Migration: Add notes table for attaching notes to any entity
"""

import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.db import get_async_db_connection


async def upgrade():
    conn = await get_async_db_connection()
    try:
        # Table NOTES
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS notes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                title VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Index pour performances
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_entity ON notes(entity_type, entity_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)")

        print("Migration completed successfully")
    finally:
        await conn.close()


async def downgrade():
    conn = await get_async_db_connection()
    try:
        await conn.execute("DROP TABLE IF EXISTS notes CASCADE")
        print("Rollback completed successfully")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(upgrade())
