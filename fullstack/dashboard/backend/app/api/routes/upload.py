#!/usr/bin/env python3
# app/api/routes/upload.py

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.core.utils.auth import get_current_user
from app.database.models import User
from app.core.services.openai.transcription.base import get_media_duration
import uuid
import os

router = APIRouter(prefix="/api/upload", tags=["upload"])

UPLOAD_DIR = "./uploads"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_TYPES = [
    # Audio types
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/m4a", "audio/mp4", "audio/x-m4a",
    # Video types
    "video/mp4", "video/quicktime", "video/x-m4v", "video/webm", "video/ogg"
]

# Create upload directory if not exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/audio")
async def upload_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload audio file with validation"""

    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_TYPES)}"
        )

    # Read file
    contents = await file.read()

    # Validate file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)

    # Try to extract duration (for audio/video files)
    duration = None
    try:
        duration = get_media_duration(file_path)
    except Exception:
        # Duration extraction is optional, continue without it
        pass

    # Return public URL with metadata
    file_url = f"/uploads/{unique_filename}"
    return {
        "url": file_url,
        "filename": unique_filename,
        "duration": duration
    }
