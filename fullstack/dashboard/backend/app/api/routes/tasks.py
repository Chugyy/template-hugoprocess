#!/usr/bin/env python3
"""Tasks API routes"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime, timedelta
from app.api.models import TaskCreate, TaskResponse, TaskUpdate
from app.database.crud import (
    create_task, get_user_tasks_paginated, get_task_by_id,
    update_task, delete_task, get_contact_tasks, get_project_tasks, get_exchange_tasks
)
from app.core.utils.auth import get_current_user
from app.core.cache import cache
from app.api.helpers import verify_ownership, paginated_response
from app.core.utils.parsers import parse_multi_value_filter
from app.database.models import User
from app.database.db import get_db, get_async_db_connection

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("", response_model=dict)
async def list_tasks(
    status: Optional[str] = None,
    contact_id: Optional[int] = None,
    project_id: Optional[int] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get paginated tasks with filters (supports multi-value status and priority)"""
    # Parse multi-value filters
    try:
        status_list = parse_multi_value_filter(status) if status else None
        priority_list = parse_multi_value_filter(priority) if priority else None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Generate cache key
    cache_key = cache._generate_key(
        'tasks',
        current_user.id,
        {'status': status, 'priority': priority, 'contact_id': contact_id, 'project_id': project_id, 'search': search},
        offset,
        limit
    )

    # Check cache
    cached = cache.get(cache_key)
    if cached:
        return cached

    # Query DB (use first value for now - multi-value requires DB layer support)
    tasks, total = await get_user_tasks_paginated(
        db, current_user.id, status_list[0] if status_list else None,
        contact_id, project_id, priority_list[0] if priority_list else None,
        offset, limit, search
    )

    # Build response
    result = paginated_response(tasks, total, offset, limit)

    # Cache result
    cache.set(cache_key, result)

    return result

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_new_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create new task"""
    new_task = await create_task(db, current_user.id, task)
    cache.invalidate(f"tasks:{current_user.id}")
    return new_task

@router.get("/stats")
async def get_task_stats(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get aggregated task statistics"""
    conn = await get_async_db_connection()
    try:
        now = datetime.now()
        week_ago = now - timedelta(days=7)
        week_ahead = now + timedelta(days=7)

        # Overdue tasks
        overdue = await conn.fetchval("""
            SELECT COUNT(*) FROM tasks
            WHERE user_id = $1
            AND status != 'completed'
            AND due_date < $2
        """, current_user.id, now)

        # Upcoming tasks (next 7 days)
        upcoming = await conn.fetchval("""
            SELECT COUNT(*) FROM tasks
            WHERE user_id = $1
            AND status != 'completed'
            AND due_date >= $2
            AND due_date <= $3
        """, current_user.id, now, week_ahead)

        # Completed tasks this week
        completed = await conn.fetchval("""
            SELECT COUNT(*) FROM tasks
            WHERE user_id = $1
            AND status = 'completed'
            AND completed_at >= $2
        """, current_user.id, week_ago)

        return {
            "overdue": overdue or 0,
            "upcoming": upcoming or 0,
            "completedThisWeek": completed or 0
        }
    finally:
        await conn.close()

@router.get("/contacts/{contact_id}/tasks", response_model=List[TaskResponse])
async def get_contact_tasks_endpoint(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all tasks for a contact"""
    tasks = await get_contact_tasks(db, contact_id)
    if tasks:
        verify_ownership(tasks[0], current_user.id, "Task")
    return tasks

@router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
async def get_project_tasks_endpoint(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all tasks for a project"""
    tasks = await get_project_tasks(db, project_id)
    if tasks:
        verify_ownership(tasks[0], current_user.id, "Task")
    return tasks

@router.get("/exchanges/{exchange_id}/tasks", response_model=List[TaskResponse])
async def get_exchange_tasks_endpoint(
    exchange_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all tasks generated from an exchange"""
    tasks = await get_exchange_tasks(db, exchange_id)
    if tasks:
        verify_ownership(tasks[0], current_user.id, "Task")
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get task by ID"""
    task = await get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    verify_ownership(task, current_user.id, "Task")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task_endpoint(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update task"""
    existing = await get_task_by_id(db, task_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    verify_ownership(existing, current_user.id, "Task")

    # Validate: prevent changing contact if one already exists
    update_data = task_update.model_dump(exclude_unset=True)
    if "contact_id" in update_data and update_data["contact_id"] is not None:
        old_contact_id = existing.get('contact_id')
        if old_contact_id and old_contact_id != update_data["contact_id"]:
            raise HTTPException(
                status_code=400,
                detail="Cannot reassign task to another contact. Remove the existing contact first."
            )

    updated = await update_task(db, task_id, **update_data)
    cache.invalidate(f"tasks:{current_user.id}")
    return updated

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_endpoint(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Delete task"""
    existing = await get_task_by_id(db, task_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    verify_ownership(existing, current_user.id, "Task")

    await delete_task(db, task_id)
    cache.invalidate(f"tasks:{current_user.id}")
    return None
