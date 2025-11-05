#!/usr/bin/env python3
"""Projects API routes"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from app.api.models import ProjectCreate, ProjectResponse, ProjectUpdate
from app.database.crud import (
    create_project, get_user_projects_paginated, get_project_by_id,
    update_project, delete_project, get_contact_projects, get_contact_by_id
)
from app.core.utils.auth import get_current_user
from app.database.models import User
from app.database.db import get_db
from app.core.cache import cache
from app.api.helpers import verify_ownership, paginated_response
from app.core.utils.parsers import parse_multi_value_filter

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("", response_model=dict)
async def list_projects(
    status: Optional[str] = None,
    contact_id: Optional[int] = None,
    search: Optional[str] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get paginated projects with filters (supports multi-value status)"""
    # Parse multi-value filters
    try:
        status_list = parse_multi_value_filter(status) if status else None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Generate cache key
    cache_key = cache._generate_key(
        'projects',
        current_user.id,
        {'status': status, 'contact_id': contact_id, 'search': search},
        offset,
        limit
    )

    # Check cache
    cached = cache.get(cache_key)
    if cached:
        return cached

    # Query DB (use first value for now - multi-value requires DB layer support)
    projects, total = await get_user_projects_paginated(
        db, current_user.id, status_list[0] if status_list else None,
        contact_id, offset, limit, search
    )

    # Build response
    response = paginated_response(projects, total, offset, limit)

    # Cache result
    cache.set(cache_key, response)

    return response

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_new_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create new project"""
    contact = await get_contact_by_id(db, project.contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    verify_ownership(contact, current_user.id, "Contact")

    new_project = await create_project(db, current_user.id, project)
    cache.invalidate(f"projects:{current_user.id}")
    return new_project

@router.get("/contacts/{contact_id}/projects", response_model=List[ProjectResponse])
async def get_contact_projects_endpoint(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all projects for a contact"""
    contact = await get_contact_by_id(db, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    verify_ownership(contact, current_user.id, "Contact")

    projects = await get_contact_projects(db, contact_id)
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get project by ID"""
    project = await get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    verify_ownership(project, current_user.id, "Project")
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project_endpoint(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update project"""
    existing = await get_project_by_id(db, project_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    verify_ownership(existing, current_user.id, "Project")

    updated = await update_project(db, project_id, **project_update.model_dump(exclude_unset=True))
    cache.invalidate(f"projects:{current_user.id}")
    return updated

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_endpoint(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Delete project"""
    existing = await get_project_by_id(db, project_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    verify_ownership(existing, current_user.id, "Project")

    await delete_project(db, project_id)
    cache.invalidate(f"projects:{current_user.id}")
    return None
