#!/usr/bin/env python3
"""
Migration: Fix task-project cascade deletion
Changes tasks.project_id constraint from ON DELETE SET NULL to ON DELETE CASCADE
to ensure tasks are deleted when their parent project is deleted.
"""

import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.db import get_async_db_connection


async def upgrade():
    conn = await get_async_db_connection()
    try:
        # Drop existing constraint
        await conn.execute("""
            ALTER TABLE tasks
            DROP CONSTRAINT IF EXISTS tasks_project_id_fkey
        """)

        # Recreate constraint with CASCADE
        await conn.execute("""
            ALTER TABLE tasks
            ADD CONSTRAINT tasks_project_id_fkey
            FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE CASCADE
        """)

        print("✓ Migration completed: tasks.project_id now cascades on project deletion")
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        await conn.close()


async def downgrade():
    conn = await get_async_db_connection()
    try:
        # Drop CASCADE constraint
        await conn.execute("""
            ALTER TABLE tasks
            DROP CONSTRAINT IF EXISTS tasks_project_id_fkey
        """)

        # Recreate constraint with SET NULL (original behavior)
        await conn.execute("""
            ALTER TABLE tasks
            ADD CONSTRAINT tasks_project_id_fkey
            FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE SET NULL
        """)

        print("✓ Rollback completed: tasks.project_id reverted to SET NULL")
    except Exception as e:
        print(f"✗ Rollback failed: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    print("Applying migration to fix task-project cascade deletion...")
    asyncio.run(upgrade())
