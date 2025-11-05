#!/usr/bin/env python3
"""Notes API routes"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from app.api.models import NoteCreate, NoteUpdate, NoteResponse
from app.database.crud import create_note, get_notes, get_notes_paginated, get_note, update_note, delete_note
from app.core.utils.auth import get_current_user
from app.database.models import User
from app.database.db import get_db
from app.core.cache import cache
from app.api.helpers import verify_ownership, paginated_response
from app.core.utils.parsers import parse_multi_value_filter

router = APIRouter(prefix="/api/notes", tags=["notes"])

@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_new_note(
    note: NoteCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create a new note"""
    created = await create_note(
        db,
        current_user.id,
        note.entity_type,
        note.entity_id,
        note.content,
        note.title
    )
    cache.invalidate(f"notes:{current_user.id}")
    return created

@router.get("", response_model=dict)
async def list_notes(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get paginated notes filtered by entity_type and/or entity_id"""
    # Parse multi-value filters
    try:
        entity_types = parse_multi_value_filter(entity_type) if entity_type else None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Generate cache key
    cache_key = cache._generate_key(
        'notes',
        current_user.id,
        {'entity_type': entity_type, 'entity_id': entity_id},
        offset,
        limit
    )

    # Check cache
    cached = cache.get(cache_key)
    if cached:
        return cached

    # Query DB
    notes, total = await get_notes_paginated(
        db, current_user.id, entity_type, entity_id, offset, limit
    )

    # Build response
    result = paginated_response(notes, total, offset, limit)

    # Cache result
    cache.set(cache_key, result)
    return result

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note_by_id(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get a single note"""
    note = await get_note(db, current_user.id, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    verify_ownership(note, current_user.id, "Note")
    return note

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note_endpoint(
    note_id: int,
    note_update: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update a note"""
    updated = await update_note(db, current_user.id, note_id, note_update.content, note_update.title)
    if not updated:
        raise HTTPException(status_code=404, detail="Note not found")

    # Invalidate cache after update
    cache.invalidate(f"notes:{current_user.id}")
    return updated

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note_endpoint(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Delete a note"""
    deleted = await delete_note(db, current_user.id, note_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found")

    # Invalidate cache after delete
    cache.invalidate(f"notes:{current_user.id}")
    return None
