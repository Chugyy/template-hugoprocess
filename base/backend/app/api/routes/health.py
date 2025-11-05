#!/usr/bin/env python3
# app/api/routes/health.py

from fastapi import APIRouter

from config.config import settings
from app.core.services.ai import AIProcessor

router = APIRouter(prefix="", tags=["health"])

@router.get("/health")
def health_check():
    return {"status": "ok", "app": settings.app_name}