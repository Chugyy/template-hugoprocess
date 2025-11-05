#!/usr/bin/env python3
# Migration script to add exchange_context column to communication_history table

import asyncio
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.db import get_async_db_connection

async def migrate():
    """Add exchange_context column to communication_history table"""
    conn = await get_async_db_connection()
    try:
        # Check if column already exists
        column_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'communication_history'
                AND column_name = 'exchange_context'
            )
        """)

        if not column_exists:
            # Add the new column
            await conn.execute("""
                ALTER TABLE communication_history
                ADD COLUMN exchange_context VARCHAR(50) DEFAULT 'discovery'
            """)
            print("✓ Column 'exchange_context' added successfully")
        else:
            print("✓ Column 'exchange_context' already exists")

    except Exception as e:
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        await conn.close()

if __name__ == '__main__':
    asyncio.run(migrate())
