# crud.py - CRUD unifié asynchrone minimaliste

import asyncpg
import json
from typing import Optional, Dict, List
from config.config import settings

# ============================
# CONNEXION ASYNCHRONE
# ============================

async def get_async_db_connection():
    """Retourne une connexion PostgreSQL asynchrone."""
    return await asyncpg.connect(
        host=settings.db_host,
        port=settings.db_port,
        database=settings.db_name,
        user=settings.db_user,
        password=settings.db_password
    )

# ============================
# USERS
# ============================

async def create_user(username: str, email: str, password_hash: str = '', 
                     first_name: str = '', last_name: str = '', status: str = 'active') -> int:
    """Crée un nouvel utilisateur et retourne son ID."""
    conn = await get_async_db_connection()
    try:
        result = await conn.fetchrow(
            """INSERT INTO users (username, email, password_hash, first_name, last_name, status) 
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING id""",
            username, email, password_hash, first_name, last_name, status
        )
        return result['id'] if result else None
    finally:
        await conn.close()

async def get_user_by_username(username: str) -> Optional[Dict]:
    """Récupère un utilisateur par nom d'utilisateur."""
    conn = await get_async_db_connection()
    try:
        result = await conn.fetchrow("SELECT * FROM users WHERE username = $1", username)
        return dict(result) if result else None
    finally:
        await conn.close()

async def get_user(user_id: int) -> Optional[Dict]:
    """Récupère un utilisateur par ID."""
    conn = await get_async_db_connection()
    try:
        result = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
        return dict(result) if result else None
    finally:
        await conn.close()

async def get_user_by_email(email: str) -> Optional[Dict]:
    """Récupère un utilisateur par email."""
    conn = await get_async_db_connection()
    try:
        result = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)
        return dict(result) if result else None
    finally:
        await conn.close()

async def list_users() -> List[Dict]:
    """Renvoie la liste de tous les utilisateurs."""
    conn = await get_async_db_connection()
    try:
        rows = await conn.fetch("SELECT * FROM users")
        return [dict(row) for row in rows]
    finally:
        await conn.close()

async def update_user_password(user_id: int, password_hash: str) -> bool:
    """Met à jour uniquement le mot de passe d'un utilisateur."""
    conn = await get_async_db_connection()
    try:
        result = await conn.execute(
            "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
            password_hash, user_id
        )
        return int(result.split()[1]) > 0
    finally:
        await conn.close()

async def update_user_profile(user_id: int, username: str, first_name: str, last_name: str) -> bool:
    """Met à jour le profil d'un utilisateur."""
    conn = await get_async_db_connection()
    try:
        result = await conn.execute(
            "UPDATE users SET username = $1, first_name = $2, last_name = $3, updated_at = NOW() WHERE id = $4",
            username, first_name, last_name, user_id
        )
        return int(result.split()[1]) > 0
    finally:
        await conn.close()

async def activate_user_by_email(email: str) -> bool:
    """Active un utilisateur par son email."""
    conn = await get_async_db_connection()
    try:
        result = await conn.execute(
            "UPDATE users SET status = 'active', updated_at = NOW() WHERE email = $1 AND status = 'pending_payment'",
            email
        )
        return int(result.split()[1]) > 0
    finally:
        await conn.close()

async def delete_user(user_id: int) -> bool:
    """Supprime un utilisateur par ID."""
    conn = await get_async_db_connection()
    try:
        result = await conn.execute("DELETE FROM users WHERE id = $1", user_id)
        return int(result.split()[1]) > 0
    finally:
        await conn.close()

# ============================
# CONTACTS
# ============================

async def create_contact(db, user_id: int, contact) -> dict:
    """Crée un nouveau contact."""
    query = """
        INSERT INTO contacts (user_id, company, contact_name, email, phone, status, source, deal_value,
                              linkedin, instagram, twitter, website, youtube, tiktok, facebook, last_contact_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
    """
    row = await db.fetchrow(
        query,
        user_id,
        contact.company,
        contact.contact_name,
        contact.email,
        contact.phone,
        contact.status,
        contact.source,
        contact.deal_value,
        getattr(contact, 'linkedin', None),
        getattr(contact, 'instagram', None),
        getattr(contact, 'twitter', None),
        getattr(contact, 'website', None),
        getattr(contact, 'youtube', None),
        getattr(contact, 'tiktok', None),
        getattr(contact, 'facebook', None),
        contact.last_contact_date
    )
    return dict(row)

async def get_user_contacts(db, user_id: int) -> List[dict]:
    """Récupère tous les contacts d'un utilisateur."""
    query = "SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC"
    rows = await db.fetch(query, user_id)
    return [dict(row) for row in rows]

async def get_contact_by_id(db, contact_id: int) -> Optional[dict]:
    """Récupère un contact par son ID."""
    query = "SELECT * FROM contacts WHERE id = $1"
    row = await db.fetchrow(query, contact_id)
    return dict(row) if row else None

async def update_contact(db, contact_id: int, **fields) -> dict:
    """Met à jour un contact."""
    clauses = [f"{k} = ${i+2}" for i, k in enumerate(fields.keys())]
    clauses.append("updated_at = CURRENT_TIMESTAMP")
    set_clause = ", ".join(clauses)
    query = f"UPDATE contacts SET {set_clause} WHERE id = $1 RETURNING *"
    row = await db.fetchrow(query, contact_id, *fields.values())
    if not row:
        raise ValueError("Contact not found")
    return dict(row)

async def delete_contact(db, contact_id: int) -> bool:
    """Supprime un contact."""
    query = "DELETE FROM contacts WHERE id = $1"
    result = await db.execute(query, contact_id)
    return result == "DELETE 1"

# ============================
# COMMUNICATION HISTORY
# ============================

async def create_exchange(db, contact_id: int, exchange) -> dict:
    """Crée un nouvel échange de communication."""
    query = """
        INSERT INTO communication_history (contact_id, exchange_type, exchange_date, exchange_context, summary, outcome, next_steps, participants, audio_file_url, transcription, ai_analysis, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, contact_id, exchange_type, exchange_date, exchange_context, summary, outcome, next_steps, participants, audio_file_url, transcription, ai_analysis, metadata, created_at
    """
    row = await db.fetchrow(
        query,
        contact_id,
        exchange.exchange_type,
        exchange.exchange_date,
        exchange.exchange_context,
        exchange.summary,
        exchange.outcome,
        exchange.next_steps,
        exchange.participants,
        exchange.audio_file_url,
        exchange.transcription,
        exchange.ai_analysis,
        json.dumps(exchange.metadata)
    )
    result = dict(row)
    result['metadata'] = json.loads(result['metadata']) if isinstance(result['metadata'], str) else result['metadata']
    return result

async def get_contact_exchanges(db, contact_id: int) -> List[dict]:
    """Récupère tous les échanges d'un contact."""
    query = "SELECT * FROM communication_history WHERE contact_id = $1 ORDER BY exchange_date DESC"
    rows = await db.fetch(query, contact_id)
    exchanges = [dict(row) for row in rows]
    for exchange in exchanges:
        exchange['metadata'] = json.loads(exchange['metadata']) if isinstance(exchange['metadata'], str) else exchange['metadata']
    return exchanges

async def get_exchange_by_id(db, exchange_id: int) -> Optional[dict]:
    """Récupère un échange par son ID."""
    query = "SELECT * FROM communication_history WHERE id = $1"
    row = await db.fetchrow(query, exchange_id)
    if not row:
        return None
    result = dict(row)
    result['metadata'] = json.loads(result['metadata']) if isinstance(result['metadata'], str) else result['metadata']
    return result

async def update_exchange(db, exchange_id: int, **fields) -> dict:
    """Met à jour un échange de communication."""
    clauses = [f"{k} = ${i+2}" for i, k in enumerate(fields.keys())]
    clauses.append("created_at = CURRENT_TIMESTAMP")
    set_clause = ", ".join(clauses)
    query = f"UPDATE communication_history SET {set_clause} WHERE id = $1 RETURNING *"
    row = await db.fetchrow(query, exchange_id, *fields.values())
    if not row:
        raise ValueError("Exchange not found")
    result = dict(row)
    result['metadata'] = json.loads(result['metadata']) if isinstance(result['metadata'], str) else result['metadata']
    return result

async def delete_exchange(db, exchange_id: int) -> bool:
    """Supprime un échange de communication."""
    query = "DELETE FROM communication_history WHERE id = $1"
    result = await db.execute(query, exchange_id)
    return result == "DELETE 1"

# ============================
# TASKS
# ============================

async def create_task(db, user_id: int, task) -> dict:
    row = await db.fetchrow("""
        INSERT INTO tasks (
            user_id, contact_id, project_id, exchange_id,
            title, description, status, priority, due_date, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    """, user_id, task.contact_id, task.project_id, task.exchange_id,
         task.title, task.description, task.status, task.priority,
         task.due_date, json.dumps(task.metadata))

    result = dict(row)
    result['metadata'] = json.loads(result['metadata']) if result['metadata'] else {}
    return result

async def get_user_tasks_paginated(
    db, user_id: int,
    status: Optional[str] = None,
    contact_id: Optional[int] = None,
    project_id: Optional[int] = None,
    priority: Optional[str] = None,
    offset: int = 0,
    limit: int = 50,
    search: Optional[str] = None
):
    from app.database.builders import build_paginated_query
    from app.core.utils.parsers import parse_multi_value_filter

    filters = {}
    if status:
        filters['status'] = parse_multi_value_filter(status)
    if contact_id:
        filters['contact_id'] = contact_id
    if priority:
        filters['priority'] = parse_multi_value_filter(priority)
    if project_id:
        filters['project_id'] = project_id

    select_query, count_query, params, _, _ = build_paginated_query(
        'tasks', user_id, filters, offset, limit
    )

    if search:
        search_pattern = f"%{search}%"
        search_idx = len(params) + 1

        search_clause = f"AND (title ILIKE ${search_idx} OR description ILIKE ${search_idx})"

        count_query = count_query.replace("WHERE", f"WHERE {search_clause[4:]} AND")
        select_query = select_query.replace("ORDER BY", f"{search_clause} ORDER BY")

        params.append(search_pattern)

    count = await db.fetchval(count_query, *params[:-2])

    select_query_with_order = select_query.replace(
        "ORDER BY created_at DESC",
        "ORDER BY due_date ASC NULLS LAST, created_at DESC"
    )

    rows = await db.fetch(select_query_with_order, *params)

    tasks = [dict(r) for r in rows]
    for t in tasks:
        t['metadata'] = json.loads(t['metadata']) if t['metadata'] else {}

    return tasks, count

async def get_task_by_id(db, task_id: int) -> Optional[dict]:
    row = await db.fetchrow("SELECT * FROM tasks WHERE id = $1", task_id)
    if not row:
        return None
    result = dict(row)
    result['metadata'] = json.loads(result['metadata']) if result['metadata'] else {}
    return result

async def update_task(db, task_id: int, **fields) -> dict:
    if fields.get('status') == 'completed' and 'completed_at' not in fields:
        from datetime import datetime
        fields['completed_at'] = datetime.now()
    elif fields.get('status') != 'completed' and 'status' in fields:
        fields['completed_at'] = None

    if 'metadata' in fields and isinstance(fields['metadata'], dict):
        fields['metadata'] = json.dumps(fields['metadata'])

    clauses = [f"{k} = ${i+2}" for i, k in enumerate(fields.keys())]
    clauses.append("updated_at = CURRENT_TIMESTAMP")
    set_clause = ", ".join(clauses)

    query = f"UPDATE tasks SET {set_clause} WHERE id = $1 RETURNING *"
    row = await db.fetchrow(query, task_id, *fields.values())

    result = dict(row)
    result['metadata'] = json.loads(result['metadata']) if result['metadata'] else {}
    return result

async def delete_task(db, task_id: int) -> bool:
    await db.execute("DELETE FROM tasks WHERE id = $1", task_id)
    return True

async def get_contact_tasks(db, contact_id: int) -> List[dict]:
    rows = await db.fetch(
        "SELECT * FROM tasks WHERE contact_id = $1 ORDER BY due_date ASC NULLS LAST",
        contact_id
    )
    tasks = [dict(r) for r in rows]
    for t in tasks:
        t['metadata'] = json.loads(t['metadata']) if t['metadata'] else {}
    return tasks

async def get_project_tasks(db, project_id: int) -> List[dict]:
    rows = await db.fetch(
        "SELECT * FROM tasks WHERE project_id = $1 ORDER BY due_date ASC NULLS LAST",
        project_id
    )
    tasks = [dict(r) for r in rows]
    for t in tasks:
        t['metadata'] = json.loads(t['metadata']) if t['metadata'] else {}
    return tasks

async def get_exchange_tasks(db, exchange_id: int) -> List[dict]:
    rows = await db.fetch(
        "SELECT * FROM tasks WHERE exchange_id = $1 ORDER BY created_at DESC",
        exchange_id
    )
    tasks = [dict(r) for r in rows]
    for t in tasks:
        t['metadata'] = json.loads(t['metadata']) if t['metadata'] else {}
    return tasks

# ============================
# PROJECTS
# ============================

async def create_project(db, user_id: int, project) -> dict:
    row = await db.fetchrow("""
        INSERT INTO projects (
            user_id, contact_id, name, description, status,
            start_date, end_date, budget, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    """, user_id, project.contact_id, project.name, project.description,
         project.status, project.start_date, project.end_date,
         project.budget, json.dumps(project.metadata))

    result = dict(row)
    result['metadata'] = json.loads(result['metadata']) if result['metadata'] else {}
    return result

async def get_user_projects_paginated(
    db, user_id: int,
    status: Optional[str] = None,
    contact_id: Optional[int] = None,
    offset: int = 0,
    limit: int = 50,
    search: Optional[str] = None
):
    from app.database.builders import build_paginated_query
    from app.core.utils.parsers import parse_multi_value_filter

    filters = {}
    if status:
        filters['status'] = parse_multi_value_filter(status)
    if contact_id:
        filters['contact_id'] = contact_id

    select_query, count_query, params, _, _ = build_paginated_query(
        'projects', user_id, filters, offset, limit
    )

    if search:
        search_pattern = f"%{search}%"
        search_idx = len(params) + 1

        search_clause = f"AND (name ILIKE ${search_idx} OR description ILIKE ${search_idx})"

        count_query = count_query.replace("WHERE", f"WHERE {search_clause[4:]} AND")
        select_query = select_query.replace("ORDER BY", f"{search_clause} ORDER BY")

        params.append(search_pattern)

    count = await db.fetchval(count_query, *params[:-2])
    rows = await db.fetch(select_query, *params)

    projects = [dict(r) for r in rows]
    for p in projects:
        p['metadata'] = json.loads(p['metadata']) if p['metadata'] else {}

    return projects, count

async def get_project_by_id(db, project_id: int) -> Optional[dict]:
    row = await db.fetchrow("SELECT * FROM projects WHERE id = $1", project_id)
    if not row:
        return None
    result = dict(row)
    result['metadata'] = json.loads(result['metadata']) if result['metadata'] else {}
    return result

async def update_project(db, project_id: int, **fields) -> dict:
    if 'metadata' in fields and isinstance(fields['metadata'], dict):
        fields['metadata'] = json.dumps(fields['metadata'])

    clauses = [f"{k} = ${i+2}" for i, k in enumerate(fields.keys())]
    clauses.append("updated_at = CURRENT_TIMESTAMP")
    set_clause = ", ".join(clauses)

    query = f"UPDATE projects SET {set_clause} WHERE id = $1 RETURNING *"
    row = await db.fetchrow(query, project_id, *fields.values())

    result = dict(row)
    result['metadata'] = json.loads(result['metadata']) if result['metadata'] else {}
    return result

async def delete_project(db, project_id: int) -> bool:
    await db.execute("DELETE FROM projects WHERE id = $1", project_id)
    return True

async def get_contact_projects(db, contact_id: int) -> List[dict]:
    rows = await db.fetch(
        "SELECT * FROM projects WHERE contact_id = $1 ORDER BY created_at DESC",
        contact_id
    )
    projects = [dict(r) for r in rows]
    for p in projects:
        p['metadata'] = json.loads(p['metadata']) if p['metadata'] else {}
    return projects

# ============================
# PAGINATION CRM
# ============================

async def get_user_contacts_paginated(
    db, user_id: int,
    status: Optional[str] = None,
    offset: int = 0,
    limit: int = 50,
    search: Optional[str] = None
):
    from app.database.builders import build_paginated_query
    from app.core.utils.parsers import parse_multi_value_filter

    filters = {}
    if status:
        filters['status'] = parse_multi_value_filter(status)

    select_query, count_query, params, _, _ = build_paginated_query(
        'contacts', user_id, filters, offset, limit
    )

    if search:
        search_pattern = f"%{search}%"
        # Insert search_pattern before offset/limit and recalculate placeholders
        offset_val, limit_val = params[-2], params[-1]
        params_without_pagination = params[:-2]
        search_idx = len(params_without_pagination) + 1

        # Rebuild params in correct order
        params = params_without_pagination + [search_pattern, offset_val, limit_val]

        # Update placeholders in queries (offset and limit shifted by 1)
        # Replace in reverse order to avoid conflicts
        old_offset_idx = len(params_without_pagination) + 1
        old_limit_idx = old_offset_idx + 1
        new_offset_idx = search_idx + 1
        new_limit_idx = new_offset_idx + 1

        select_query = select_query.replace(f"LIMIT ${old_limit_idx}", f"LIMIT ${new_limit_idx}")
        select_query = select_query.replace(f"OFFSET ${old_offset_idx}", f"OFFSET ${new_offset_idx}")

        search_clause = f"AND (contact_name ILIKE ${search_idx} OR email ILIKE ${search_idx} OR company ILIKE ${search_idx})"
        count_query = count_query.replace("WHERE", f"WHERE {search_clause[4:]} AND")
        select_query = select_query.replace("ORDER BY", f"{search_clause} ORDER BY")

        print(f"DEBUG params: {params}")
        print(f"DEBUG count_query: {count_query}")
        print(f"DEBUG select_query: {select_query}")

    count = await db.fetchval(count_query, *params[:-2])

    select_query_with_order = select_query.replace(
        "ORDER BY created_at DESC",
        "ORDER BY last_contact_date DESC NULLS LAST, created_at DESC"
    )

    rows = await db.fetch(select_query_with_order, *params)

    contacts = [dict(r) for r in rows]

    return contacts, count

# ============================
# NOTES
# ============================

async def get_notes_paginated(
    conn, user_id: int,
    entity_type: str = None,
    entity_id: int = None,
    offset: int = 0,
    limit: int = 20
):
    """Get paginated notes with optional filters"""
    from app.database.builders import build_paginated_query

    filters = {}
    if entity_type:
        filters['entity_type'] = entity_type
    if entity_id:
        filters['entity_id'] = entity_id

    select_query, count_query, params, _, _ = build_paginated_query(
        'notes', user_id, filters, offset, limit
    )

    count = await conn.fetchval(count_query, *params[:-2])
    rows = await conn.fetch(select_query, *params)

    notes = [dict(r) for r in rows]
    return notes, count or 0

async def create_note(conn, user_id: int, entity_type: str, entity_id: int, content: str, title: str = None):
    """Create a new note"""
    row = await conn.fetchrow(
        """INSERT INTO notes (user_id, entity_type, entity_id, content, title)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, user_id, entity_type, entity_id, content, title, created_at, updated_at""",
        user_id, entity_type, entity_id, content, title
    )
    return dict(row)

async def get_notes(conn, user_id: int, entity_type: str = None, entity_id: int = None):
    """Get notes filtered by entity_type and/or entity_id"""
    if entity_type and entity_id:
        rows = await conn.fetch(
            """SELECT id, user_id, entity_type, entity_id, content, title, created_at, updated_at
               FROM notes
               WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3
               ORDER BY created_at DESC""",
            user_id, entity_type, entity_id
        )
    elif entity_type:
        rows = await conn.fetch(
            """SELECT id, user_id, entity_type, entity_id, content, title, created_at, updated_at
               FROM notes
               WHERE user_id = $1 AND entity_type = $2
               ORDER BY created_at DESC""",
            user_id, entity_type
        )
    else:
        rows = await conn.fetch(
            """SELECT id, user_id, entity_type, entity_id, content, title, created_at, updated_at
               FROM notes
               WHERE user_id = $1
               ORDER BY created_at DESC""",
            user_id
        )
    return [dict(row) for row in rows]

async def get_note(conn, user_id: int, note_id: int):
    """Get a single note"""
    row = await conn.fetchrow(
        """SELECT id, user_id, entity_type, entity_id, content, title, created_at, updated_at
           FROM notes
           WHERE id = $1 AND user_id = $2""",
        note_id, user_id
    )
    return dict(row) if row else None

async def update_note(conn, user_id: int, note_id: int, content: str = None, title: str = None):
    """Update a note"""
    updates = []
    params = []
    param_count = 1

    if content is not None:
        updates.append(f"content = ${param_count}")
        params.append(content)
        param_count += 1

    if title is not None:
        updates.append(f"title = ${param_count}")
        params.append(title)
        param_count += 1

    if not updates:
        return await get_note(conn, user_id, note_id)

    updates.append(f"updated_at = NOW()")
    params.extend([note_id, user_id])

    query = f"""
        UPDATE notes
        SET {', '.join(updates)}
        WHERE id = ${param_count} AND user_id = ${param_count + 1}
        RETURNING id, user_id, entity_type, entity_id, content, title, created_at, updated_at
    """

    row = await conn.fetchrow(query, *params)
    return dict(row) if row else None

async def delete_note(conn, user_id: int, note_id: int):
    """Delete a note"""
    result = await conn.execute(
        "DELETE FROM notes WHERE id = $1 AND user_id = $2",
        note_id, user_id
    )
    return result == "DELETE 1"

# ============================
# RESOURCES
# ============================

async def get_resources_paginated(
    conn, user_id: int,
    entity_type: str = None,
    entity_id: int = None,
    offset: int = 0,
    limit: int = 20
):
    """Get paginated resources with optional filters"""
    from app.database.builders import build_paginated_query

    filters = {}
    if entity_type:
        filters['entity_type'] = entity_type
    if entity_id:
        filters['entity_id'] = entity_id

    select_query, count_query, params, _, _ = build_paginated_query(
        'resources', user_id, filters, offset, limit
    )

    count = await conn.fetchval(count_query, *params[:-2])
    rows = await conn.fetch(select_query, *params)

    resources = [dict(r) for r in rows]
    return resources, count or 0

async def create_resource(conn, user_id: int, entity_type: str, entity_id: int, resource_type: str, title: str, url: str = None, file_path: str = None, file_size: int = None, mime_type: str = None, description: str = None):
    """Create a new resource"""
    row = await conn.fetchrow(
        """INSERT INTO resources (user_id, entity_type, entity_id, resource_type, title, url, file_path, file_size, mime_type, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, user_id, entity_type, entity_id, resource_type, title, url, file_path, file_size, mime_type, description, created_at, updated_at""",
        user_id, entity_type, entity_id, resource_type, title, url, file_path, file_size, mime_type, description
    )
    return dict(row)

async def get_resources(conn, user_id: int, entity_type: str = None, entity_id: int = None):
    """Get resources filtered by entity_type and/or entity_id"""
    if entity_type and entity_id:
        rows = await conn.fetch(
            """SELECT id, user_id, entity_type, entity_id, resource_type, title, url, file_path, file_size, mime_type, description, created_at, updated_at
               FROM resources
               WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3
               ORDER BY created_at DESC""",
            user_id, entity_type, entity_id
        )
    elif entity_type:
        rows = await conn.fetch(
            """SELECT id, user_id, entity_type, entity_id, resource_type, title, url, file_path, file_size, mime_type, description, created_at, updated_at
               FROM resources
               WHERE user_id = $1 AND entity_type = $2
               ORDER BY created_at DESC""",
            user_id, entity_type
        )
    else:
        rows = await conn.fetch(
            """SELECT id, user_id, entity_type, entity_id, resource_type, title, url, file_path, file_size, mime_type, description, created_at, updated_at
               FROM resources
               WHERE user_id = $1
               ORDER BY created_at DESC""",
            user_id
        )
    return [dict(row) for row in rows]

async def get_resource(conn, user_id: int, resource_id: int):
    """Get a single resource"""
    row = await conn.fetchrow(
        """SELECT id, user_id, entity_type, entity_id, resource_type, title, url, file_path, file_size, mime_type, description, created_at, updated_at
           FROM resources
           WHERE id = $1 AND user_id = $2""",
        resource_id, user_id
    )
    return dict(row) if row else None

async def update_resource(conn, user_id: int, resource_id: int, title: str = None, url: str = None, description: str = None):
    """Update a resource"""
    updates = []
    params = []
    param_count = 1

    if title is not None:
        updates.append(f"title = ${param_count}")
        params.append(title)
        param_count += 1

    if url is not None:
        updates.append(f"url = ${param_count}")
        params.append(url)
        param_count += 1

    if description is not None:
        updates.append(f"description = ${param_count}")
        params.append(description)
        param_count += 1

    if not updates:
        return await get_resource(conn, user_id, resource_id)

    updates.append(f"updated_at = NOW()")
    params.extend([resource_id, user_id])

    query = f"""
        UPDATE resources
        SET {', '.join(updates)}
        WHERE id = ${param_count} AND user_id = ${param_count + 1}
        RETURNING id, user_id, entity_type, entity_id, resource_type, title, url, file_path, file_size, mime_type, description, created_at, updated_at
    """

    row = await conn.fetchrow(query, *params)
    return dict(row) if row else None

async def delete_resource(conn, user_id: int, resource_id: int):
    """Delete a resource"""
    result = await conn.execute(
        "DELETE FROM resources WHERE id = $1 AND user_id = $2",
        resource_id, user_id
    )
    return result == "DELETE 1"