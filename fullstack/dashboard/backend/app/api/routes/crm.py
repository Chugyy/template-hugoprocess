#!/usr/bin/env python3
# app/api/routes/crm.py

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from app.api.models import ContactCreate, ContactResponse, ExchangeCreate, ExchangeResponse, ExchangeSummaryRequest
from app.database.crud import (
    create_contact,
    get_user_contacts,
    get_user_contacts_paginated,
    get_contact_by_id,
    update_contact,
    delete_contact,
    create_exchange,
    get_contact_exchanges,
    get_exchange_by_id,
    delete_exchange
)
from app.core.utils.auth import get_current_user
from app.core.cache import cache
from app.api.helpers import verify_ownership, paginated_response
from app.core.utils.parsers import parse_multi_value_filter
from app.database.models import User
from app.database.db import get_db
from app.core.services.openai.transcription.manager import TranscriptionManager
from app.core.scripts.summarize import summarization_engine
import os

router = APIRouter(prefix="/api", tags=["crm"])
transcription_manager = TranscriptionManager()

@router.get("/contacts", response_model=dict)
async def list_contacts(
    status: Optional[str] = None,
    search: Optional[str] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get paginated contacts with optional status filter (supports multi-value)"""
    # Parse multi-value filter
    try:
        status_list = parse_multi_value_filter(status) if status else None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Generate cache key
    cache_key = cache._generate_key(
        'contacts',
        current_user.id,
        {'status': status, 'search': search},
        offset,
        limit
    )

    # Check cache
    cached = cache.get(cache_key)
    if cached:
        return cached

    # Query DB (use first value for now - multi-value requires DB layer support)
    contacts, total = await get_user_contacts_paginated(
        db, current_user.id, status_list[0] if status_list else None, offset, limit, search
    )

    # Build response
    result = paginated_response(contacts, total, offset, limit)

    # Cache result
    cache.set(cache_key, result)

    return result

@router.post("/contacts", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def add_contact(
    contact: ContactCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create new contact"""
    new_contact = await create_contact(db, current_user.id, contact)
    cache.invalidate(f"contacts:{current_user.id}")
    return new_contact

@router.put("/contacts/{contact_id}", response_model=ContactResponse)
async def modify_contact(
    contact_id: int,
    contact: ContactCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update existing contact"""
    existing = await get_contact_by_id(db, contact_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Contact not found")
    verify_ownership(existing, current_user.id, "Contact")

    updated = await update_contact(db, contact_id, **contact.model_dump(exclude_unset=True))
    cache.invalidate(f"contacts:{current_user.id}")
    return updated

@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Delete contact"""
    existing = await get_contact_by_id(db, contact_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Contact not found")
    verify_ownership(existing, current_user.id, "Contact")

    await delete_contact(db, contact_id)
    cache.invalidate(f"contacts:{current_user.id}")
    return None

@router.post("/contacts/{contact_id}/exchanges", response_model=ExchangeResponse, status_code=status.HTTP_201_CREATED)
async def add_exchange(
    contact_id: int,
    exchange: ExchangeCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Add communication exchange to contact"""
    contact = await get_contact_by_id(db, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    verify_ownership(contact, current_user.id, "Contact")

    new_exchange = await create_exchange(db, contact_id, exchange)
    return new_exchange

@router.get("/contacts/{contact_id}/exchanges", response_model=List[ExchangeResponse])
async def list_exchanges(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all exchanges for contact"""
    contact = await get_contact_by_id(db, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    verify_ownership(contact, current_user.id, "Contact")

    exchanges = await get_contact_exchanges(db, contact_id)
    return exchanges

@router.delete("/contacts/{contact_id}/exchanges/{exchange_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_exchange(
    contact_id: int,
    exchange_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Delete exchange"""
    contact = await get_contact_by_id(db, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    verify_ownership(contact, current_user.id, "Contact")

    success = await delete_exchange(db, exchange_id)
    if not success:
        raise HTTPException(status_code=404, detail="Exchange not found")
    return None

@router.post("/contacts/{contact_id}/exchanges/{exchange_id}/summarize")
async def summarize_exchange(
    contact_id: int,
    exchange_id: int,
    request: ExchangeSummaryRequest = None,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Summarize exchange with AI"""
    contact = await get_contact_by_id(db, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    verify_ownership(contact, current_user.id, "Contact")

    exchange = await get_exchange_by_id(db, exchange_id)
    if not exchange or exchange["contact_id"] != contact_id:
        raise HTTPException(status_code=404, detail="Exchange not found")

    # Generate AI summary
    try:
        custom_instruction = request.custom_instruction if request else None
        summary = await summarization_engine.summarize(exchange, custom_instruction)
        if not summary:
            raise HTTPException(status_code=500, detail="Failed to generate summary")

        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/contacts/{contact_id}/exchanges/{exchange_id}/transcribe")
async def start_transcription(
    contact_id: int,
    exchange_id: int,
    mode: str = Query("api", regex="^(api|local)$"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Start audio transcription for an exchange"""
    contact = await get_contact_by_id(db, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    verify_ownership(contact, current_user.id, "Contact")

    # Verify exchange exists and belongs to contact
    exchange = await get_exchange_by_id(db, exchange_id)
    if not exchange:
        raise HTTPException(status_code=404, detail=f"Exchange {exchange_id} not found in database")
    if exchange["contact_id"] != contact_id:
        raise HTTPException(status_code=404, detail=f"Exchange {exchange_id} belongs to contact {exchange['contact_id']}, not {contact_id}")

    # Check audio file exists
    if not exchange.get("audio_file_url"):
        raise HTTPException(status_code=400, detail="No audio file attached")

    # Build absolute file path - extract filename from URL
    audio_url = exchange["audio_file_url"]
    # Handle both relative paths and full URLs
    if audio_url.startswith("http://") or audio_url.startswith("https://"):
        # Extract filename from full URL
        filename = audio_url.split("/uploads/")[-1]
    else:
        # Extract from relative path
        filename = audio_url.lstrip("/uploads/")

    file_path = os.path.join("./uploads", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Audio file not found on disk: {file_path}")

    # Check if transcription already running
    status_data = transcription_manager.get_status(exchange_id)
    if status_data["status"] in ['pending', 'processing']:
        raise HTTPException(status_code=400, detail="Transcription already in progress")

    # Start transcription
    try:
        task_id = transcription_manager.start_transcription(exchange_id, file_path, mode, db)
        return {
            "task_id": task_id,
            "status": "started",
            "message": f"Transcription started in {mode} mode"
        }
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start transcription: {str(e)}")

@router.get("/exchanges/{exchange_id}/transcription/status")
async def get_transcription_status(
    exchange_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get transcription progress and status"""
    status_data = transcription_manager.get_status(exchange_id)
    return status_data

@router.delete("/exchanges/{exchange_id}/transcription")
async def cancel_transcription(
    exchange_id: int,
    current_user: User = Depends(get_current_user)
):
    """Cancel an ongoing transcription"""
    success = transcription_manager.cancel_transcription(exchange_id)
    if success:
        return {"success": True, "message": "Transcription cancelled"}
    return {"success": False, "message": "No active transcription found"}
