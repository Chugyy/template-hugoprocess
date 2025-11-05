#!/usr/bin/env python3
"""
Migration: Add tasks and projects tables with pagination support
"""

import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.db import get_async_db_connection


async def upgrade():
    conn = await get_async_db_connection()
    try:
        # Table PROJECTS
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'active',
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                budget NUMERIC(12,2),
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table TASKS
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                contact_id INTEGER NULL REFERENCES contacts(id) ON DELETE SET NULL,
                project_id INTEGER NULL REFERENCES projects(id) ON DELETE SET NULL,
                exchange_id INTEGER NULL REFERENCES communication_history(id) ON DELETE SET NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                priority VARCHAR(20) DEFAULT 'medium',
                due_date TIMESTAMP,
                completed_at TIMESTAMP,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Index pour performances
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON tasks(contact_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)")

        await conn.execute("CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_projects_contact_id ON projects(contact_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)")

        # Pagination : Ajouter last_contact_date sur contacts si manquant
        await conn.execute("""
            ALTER TABLE contacts
            ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_contacts_last_contact ON contacts(last_contact_date)")

        print("Migration completed successfully")
    finally:
        await conn.close()


async def downgrade():
    conn = await get_async_db_connection()
    try:
        await conn.execute("DROP TABLE IF EXISTS tasks CASCADE")
        await conn.execute("DROP TABLE IF EXISTS projects CASCADE")
        await conn.execute("ALTER TABLE contacts DROP COLUMN IF EXISTS last_contact_date")
        print("Rollback completed successfully")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(upgrade())
