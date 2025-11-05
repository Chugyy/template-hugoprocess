#!/usr/bin/env python3
"""
Migration: Add resources table for attaching files and URLs to entities
"""

import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.db import get_async_db_connection


async def upgrade():
    conn = await get_async_db_connection()
    try:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS resources (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                entity_type VARCHAR(20) NOT NULL,
                entity_id INTEGER NOT NULL,
                resource_type VARCHAR(10) NOT NULL CHECK (resource_type IN ('file', 'url')),
                title VARCHAR(255) NOT NULL,
                url TEXT,
                file_path TEXT,
                file_size INTEGER,
                mime_type VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await conn.execute("CREATE INDEX IF NOT EXISTS idx_resources_entity ON resources(entity_type, entity_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id)")

        print("Migration completed successfully")
    finally:
        await conn.close()


async def downgrade():
    conn = await get_async_db_connection()
    try:
        await conn.execute("DROP TABLE IF EXISTS resources CASCADE")
        print("Rollback completed successfully")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(upgrade())
