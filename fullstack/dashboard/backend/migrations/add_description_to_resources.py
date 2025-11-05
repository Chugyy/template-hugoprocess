#!/usr/bin/env python3
"""
Migration: Add description column to resources table
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
            ALTER TABLE resources
            ADD COLUMN IF NOT EXISTS description TEXT
        """)
        print("Migration completed successfully: description column added to resources")
    finally:
        await conn.close()


async def downgrade():
    conn = await get_async_db_connection()
    try:
        await conn.execute("ALTER TABLE resources DROP COLUMN IF EXISTS description")
        print("Rollback completed successfully: description column removed from resources")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(upgrade())
