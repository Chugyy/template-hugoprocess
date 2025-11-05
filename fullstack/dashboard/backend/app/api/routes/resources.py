#!/usr/bin/env python3
"""Resources API routes"""

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import List, Optional
import os
from datetime import datetime
from app.api.models import ResourceCreate, ResourceResponse
from app.database.crud import create_resource, get_resources, get_resources_paginated, get_resource, update_resource, delete_resource
from app.core.utils.auth import get_current_user
from app.database.models import User
from app.database.db import get_db
from app.core.cache import cache
from app.api.helpers import verify_ownership, paginated_response
from app.core.utils.parsers import parse_multi_value_filter

router = APIRouter(prefix="/api/resources", tags=["resources"])

@router.post("/url", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_url_resource(
    resource: ResourceCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create a URL resource (JSON body)"""
    if resource.resource_type != 'url':
        raise HTTPException(status_code=400, detail="Use /api/resources/file for file uploads")
    if not resource.url:
        raise HTTPException(status_code=400, detail="URL is required for resource_type='url'")

    created = await create_resource(
        db,
        current_user.id,
        resource.entity_type,
        resource.entity_id,
        'url',
        resource.title,
        resource.url,
        None,
        None,
        None,
        resource.description
    )
    cache.invalidate(f"resources:{current_user.id}")
    return created

@router.post("/file", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_file_resource(
    entity_type: str = Form(..., pattern='^(contact|project|task)$'),
    entity_id: int = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create a file resource (multipart/form-data)"""
    upload_dir = f"uploads/{current_user.id}"
    os.makedirs(upload_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    file_size = len(content)
    mime_type = file.content_type

    created = await create_resource(
        db,
        current_user.id,
        entity_type,
        entity_id,
        'file',
        title,
        None,
        file_path,
        file_size,
        mime_type,
        description
    )
    cache.invalidate(f"resources:{current_user.id}")
    return created

@router.get("", response_model=dict)
async def list_resources(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get paginated resources filtered by entity_type and/or entity_id"""
    # Parse multi-value filters
    try:
        entity_types = parse_multi_value_filter(entity_type) if entity_type else None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Generate cache key
    cache_key = cache._generate_key(
        'resources',
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
    resources, total = await get_resources_paginated(
        db, current_user.id, entity_type, entity_id, offset, limit
    )

    # Build response
    result = paginated_response(resources, total, offset, limit)

    # Cache result
    cache.set(cache_key, result)
    return result

@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource_by_id(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get a single resource"""
    resource = await get_resource(db, current_user.id, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    verify_ownership(resource, current_user.id, "Resource")
    return resource

@router.put("/{resource_id}", response_model=ResourceResponse)
async def update_resource_endpoint(
    resource_id: int,
    title: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update a resource (title, url, and description)"""
    updated = await update_resource(db, current_user.id, resource_id, title, url, description)
    if not updated:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Invalidate cache after update
    cache.invalidate(f"resources:{current_user.id}")
    return updated

@router.get("/{resource_id}/download")
async def download_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Download a file resource"""
    resource = await get_resource(db, current_user.id, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if resource.get('resource_type') != 'file':
        raise HTTPException(status_code=400, detail="Resource is not a file")

    file_path = resource.get('file_path')
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        path=file_path,
        filename=resource.get('title', 'download'),
        media_type=resource.get('mime_type', 'application/octet-stream')
    )

@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource_endpoint(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Delete a resource"""
    resource = await get_resource(db, current_user.id, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if resource.get('file_path') and os.path.exists(resource['file_path']):
        os.remove(resource['file_path'])

    deleted = await delete_resource(db, current_user.id, resource_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Invalidate cache after delete
    cache.invalidate(f"resources:{current_user.id}")
    return None
