#!/usr/bin/env python3
"""
Migration: Cleanup users and reassign all data to Hugo Hoarau
1. Update admin credentials to contact@multimodal.digital (Hugo Hoarau)
2. Reassign all tasks/projects/contacts/notes/resources from admin to contact
3. Delete all other users except contact@multimodal.digital
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
        print("🔄 Starting user cleanup and data reassignment...")

        # Configuration
        old_email = "admin@admin.admin"
        new_email = "contact@multimodal.digital"
        new_username = "hugo"
        first_name = "Hugo"
        last_name = "Hoarau"
        new_password = secrets.token_urlsafe(16)

        # ÉTAPE 1 : Vérifier/créer l'utilisateur contact
        print("\n📋 Step 1: Checking contact user...")
        contact_user = await conn.fetchrow(
            "SELECT id, email FROM users WHERE email = $1",
            new_email
        )

        if contact_user:
            contact_id = contact_user['id']
            print(f"   ✅ Contact user exists (ID: {contact_id})")
        else:
            # Créer le nouvel utilisateur contact
            password_hash = hash_password(new_password)
            contact_id = await conn.fetchval(
                """INSERT INTO users (username, email, password_hash, first_name, last_name, status)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   RETURNING id""",
                new_username, new_email, password_hash, first_name, last_name, "active"
            )
            print(f"   ✅ Contact user created (ID: {contact_id})")
            print(f"   📧 Email: {new_email}")
            print(f"   🔑 Password: {new_password}")
            print("   ⚠️  IMPORTANT: Save this password securely!")

        # ÉTAPE 2 : Trouver l'ancien admin s'il existe
        print("\n📋 Step 2: Checking old admin user...")
        old_admin = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1",
            old_email
        )

        if old_admin:
            old_admin_id = old_admin['id']
            print(f"   ✅ Old admin found (ID: {old_admin_id})")

            # ÉTAPE 3 : Réassigner toutes les données
            print("\n📋 Step 3: Reassigning all data from admin to contact...")

            # Contacts
            contacts_count = await conn.fetchval(
                "UPDATE contacts SET user_id = $1 WHERE user_id = $2 RETURNING COUNT(*)",
                contact_id, old_admin_id
            )
            print(f"   ✅ Reassigned {contacts_count or 0} contacts")

            # Tasks
            tasks_count = await conn.fetchval(
                "UPDATE tasks SET user_id = $1 WHERE user_id = $2 RETURNING COUNT(*)",
                contact_id, old_admin_id
            )
            print(f"   ✅ Reassigned {tasks_count or 0} tasks")

            # Projects
            projects_count = await conn.fetchval(
                "UPDATE projects SET user_id = $1 WHERE user_id = $2 RETURNING COUNT(*)",
                contact_id, old_admin_id
            )
            print(f"   ✅ Reassigned {projects_count or 0} projects")

            # Notes
            notes_count = await conn.fetchval(
                "UPDATE notes SET user_id = $1 WHERE user_id = $2 RETURNING COUNT(*)",
                contact_id, old_admin_id
            )
            print(f"   ✅ Reassigned {notes_count or 0} notes")

            # Resources
            resources_count = await conn.fetchval(
                "UPDATE resources SET user_id = $1 WHERE user_id = $2 RETURNING COUNT(*)",
                contact_id, old_admin_id
            )
            print(f"   ✅ Reassigned {resources_count or 0} resources")

            # ÉTAPE 4 : Supprimer l'ancien admin
            print("\n📋 Step 4: Deleting old admin user...")
            await conn.execute("DELETE FROM users WHERE id = $1", old_admin_id)
            print(f"   ✅ Old admin user deleted (ID: {old_admin_id})")
        else:
            print("   ℹ️  No old admin user found, skipping reassignment")

        # ÉTAPE 5 : Mettre à jour les infos du contact user
        print("\n📋 Step 5: Updating contact user info...")
        password_hash = hash_password(new_password)
        await conn.execute(
            """UPDATE users
               SET username = $1,
                   password_hash = $2,
                   first_name = $3,
                   last_name = $4,
                   updated_at = NOW()
               WHERE id = $5""",
            new_username, password_hash, first_name, last_name, contact_id
        )
        print(f"   ✅ Contact user updated:")
        print(f"   📧 Email: {new_email}")
        print(f"   👤 Name: {first_name} {last_name}")
        print(f"   🔑 New Password: {new_password}")

        # ÉTAPE 6 : Supprimer tous les autres utilisateurs
        print("\n📋 Step 6: Deleting all other users...")
        other_users = await conn.fetch(
            "SELECT id, email FROM users WHERE id != $1",
            contact_id
        )

        if other_users:
            for user in other_users:
                print(f"   🗑️  Deleting user: {user['email']} (ID: {user['id']})")

            deleted_count = await conn.execute(
                "DELETE FROM users WHERE id != $1",
                contact_id
            )
            print(f"   ✅ Deleted {len(other_users)} other user(s)")
        else:
            print("   ℹ️  No other users found")

        # ÉTAPE 7 : Vérification finale
        print("\n📋 Step 7: Final verification...")
        final_users = await conn.fetch("SELECT id, username, email, first_name, last_name FROM users")
        print(f"   ✅ Total users remaining: {len(final_users)}")
        for user in final_users:
            print(f"      • {user['first_name']} {user['last_name']} ({user['email']})")

        print("\n" + "="*60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY")
        print("="*60)
        print(f"📧 Email: {new_email}")
        print(f"👤 Name: {first_name} {last_name}")
        print(f"🔑 Password: {new_password}")
        print("⚠️  IMPORTANT: Save this password securely, it will not be shown again!")
        print("="*60)

    except Exception as e:
        print(f"\n❌ ERROR during migration: {str(e)}")
        raise
    finally:
        await conn.close()


async def downgrade():
    print("⚠️  Downgrade not available for this migration (destructive changes)")
    print("   Please restore from backup if needed")


if __name__ == "__main__":
    asyncio.run(upgrade())
