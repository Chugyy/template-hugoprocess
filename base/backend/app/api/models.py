#!/usr/bin/env python3
# app/api/models.py

from pydantic import BaseModel
from typing import Dict, List, Optional, Any

# --- Modèles Pydantic pour validation ---

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    id: int
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserDelete(BaseModel):
    id: int

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int