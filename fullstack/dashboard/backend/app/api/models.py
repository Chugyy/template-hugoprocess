#!/usr/bin/env python3
# app/api/models.py

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, date

# --- Modèles Pydantic pour validation ---

class UserCreate(BaseModel):
    username: str
    email: str

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int

class ChatbotCreate(BaseModel):
    name: str
    description: Optional[str] = None
    config: Dict[str, Any] = {}
    knowledge_data: Optional[str] = None  # Données textuelles pour générer les instructions

class ChatbotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class ChatAccessCreate(BaseModel):
    chatbot_id: str
    title: str
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    start_date: Optional[str] = None
    expires_at: Optional[str] = None

class ChatAccessUpdate(BaseModel):
    title: Optional[str] = None
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    start_date: Optional[str] = None
    expires_at: Optional[str] = None
    is_active: Optional[bool] = None

class ChatAccessLogin(BaseModel):
    access_code: str

class MessageCreate(BaseModel):
    role: str
    content: str
    files: Optional[List[Dict[str, Any]]] = None
    test: Optional[bool] = False
    chatbot_id: Optional[str] = None

class TouristEmailRequest(BaseModel):
    guest_email: str
    guest_name: str
    chatbot_url: str

class HostNotificationRequest(BaseModel):
    host_email: str
    host_name: str
    guest_name: str
    question_text: str
    question_url: str

class HumanResponseRequest(BaseModel):
    message_id: int  # ID du message utilisateur à marquer comme résolu
    response_content: str  # Contenu de la réponse humaine

class DemoMessageCreate(BaseModel):
    content: str

# --- CRM Models ---

class ContactCreate(BaseModel):
    company: str
    contact_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: str = "Uncategorized"
    source: Optional[str] = None
    deal_value: Optional[float] = None
    last_contact_date: Optional[datetime] = None
    linkedin: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    website: Optional[str] = None
    youtube: Optional[str] = None
    tiktok: Optional[str] = None
    facebook: Optional[str] = None

    @field_validator('last_contact_date')
    def remove_timezone(cls, v):
        if v and v.tzinfo:
            return v.replace(tzinfo=None)
        return v

class ContactResponse(ContactCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

class ExchangeCreate(BaseModel):
    exchange_type: str
    exchange_date: datetime
    exchange_context: Optional[str] = 'discovery'
    summary: str = Field(default='No summary provided', min_length=1, description="Summary of the exchange")
    outcome: Optional[str] = None
    next_steps: Optional[str] = None
    participants: Optional[str] = None
    audio_file_url: Optional[str] = None
    transcription: Optional[str] = None
    ai_analysis: Optional[str] = None
    metadata: Optional[dict] = {}

    @model_validator(mode='after')
    def validate_transcription(self):
        """Transcription is required unless audio_file_url is provided."""
        if not self.audio_file_url and not self.transcription:
            raise ValueError('Transcription is required when no media file is provided')
        return self

    def model_post_init(self, __context):
        if self.exchange_date and self.exchange_date.tzinfo:
            self.exchange_date = self.exchange_date.replace(tzinfo=None)

class ExchangeResponse(ExchangeCreate):
    id: int
    contact_id: int
    created_at: datetime

# TASKS
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field(default='pending', pattern='^(pending|in_progress|completed|cancelled)$')
    priority: str = Field(default='medium', pattern='^(low|medium|high|urgent)$')
    due_date: Optional[Union[date, str]] = None
    contact_id: Optional[int] = None
    project_id: Optional[int] = None
    exchange_id: Optional[int] = None
    metadata: dict = {}

    @field_validator('due_date', mode='before')
    def validate_date(cls, v):
        if v is None or v == '':
            return None
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            # Handle YYYY-MM-DD format
            if len(v) == 10 and v.count('-') == 2:
                try:
                    parts = v.split('-')
                    return date(int(parts[0]), int(parts[1]), int(parts[2]))
                except (ValueError, IndexError):
                    pass
            # Handle datetime string (extract date part only)
            try:
                dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                return dt.date()
            except ValueError:
                pass
        if isinstance(v, datetime):
            return v.date()
        return v

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern='^(pending|in_progress|completed|cancelled)$')
    priority: Optional[str] = Field(None, pattern='^(low|medium|high|urgent)$')
    due_date: Optional[date] = None
    contact_id: Optional[int] = None
    project_id: Optional[int] = None
    completed_at: Optional[datetime] = None
    metadata: Optional[dict] = None

    @field_validator('due_date', mode='before')
    def validate_date(cls, v):
        # Handle None, empty string, or explicit null
        if v is None or v == '' or v == 'null':
            return None
        # Already a date object
        if isinstance(v, date) and not isinstance(v, datetime):
            return v
        # String format
        if isinstance(v, str):
            # Handle YYYY-MM-DD format
            if len(v) == 10 and v.count('-') == 2:
                try:
                    parts = v.split('-')
                    return date(int(parts[0]), int(parts[1]), int(parts[2]))
                except (ValueError, IndexError):
                    raise ValueError(f"Invalid date format: {v}")
            # Handle datetime string (extract date part only)
            try:
                dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                return dt.date()
            except ValueError:
                raise ValueError(f"Invalid date format: {v}")
        # Datetime object - extract date
        if isinstance(v, datetime):
            return v.date()
        # Invalid type
        raise ValueError(f"Invalid type for date: {type(v).__name__}, value: {v}")

    @field_validator('completed_at', mode='before')
    def remove_timezone(cls, v):
        if not v:
            return None
        if isinstance(v, datetime) and v.tzinfo:
            return v.replace(tzinfo=None)
        if isinstance(v, str):
            try:
                dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                return dt.replace(tzinfo=None)
            except ValueError:
                pass
        return v

class TaskResponse(TaskCreate):
    id: int
    user_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

# PROJECTS
class ProjectCreate(BaseModel):
    model_config = {'populate_by_name': True}

    contact_id: int = Field(..., alias='contactId')
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field(default='active', pattern='^(active|on_hold|completed|cancelled)$')
    start_date: Optional[date] = Field(None, alias='startDate')
    end_date: Optional[date] = Field(None, alias='endDate')
    budget: Optional[float] = None
    metadata: dict = {}

    @field_validator('start_date', 'end_date', mode='before')
    def validate_dates(cls, v):
        if v is None or v == '' or v == 'null':
            return None
        if isinstance(v, date) and not isinstance(v, datetime):
            return v
        if isinstance(v, str):
            if len(v) == 10 and v.count('-') == 2:
                try:
                    parts = v.split('-')
                    return date(int(parts[0]), int(parts[1]), int(parts[2]))
                except (ValueError, IndexError):
                    raise ValueError(f"Invalid date format: {v}")
            try:
                dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                return dt.date()
            except ValueError:
                raise ValueError(f"Invalid date format: {v}")
        if isinstance(v, datetime):
            return v.date()
        raise ValueError(f"Invalid type for date: {type(v).__name__}, value: {v}")

class ProjectUpdate(BaseModel):
    model_config = {'populate_by_name': True}

    contact_id: Optional[int] = Field(None, alias='contactId')
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern='^(active|on_hold|completed|cancelled)$')
    start_date: Optional[date] = Field(None, alias='startDate')
    end_date: Optional[date] = Field(None, alias='endDate')
    budget: Optional[float] = None
    metadata: Optional[dict] = None

    @field_validator('start_date', 'end_date', mode='before')
    def validate_dates(cls, v):
        if v is None or v == '' or v == 'null':
            return None
        if isinstance(v, date) and not isinstance(v, datetime):
            return v
        if isinstance(v, str):
            if len(v) == 10 and v.count('-') == 2:
                try:
                    parts = v.split('-')
                    return date(int(parts[0]), int(parts[1]), int(parts[2]))
                except (ValueError, IndexError):
                    raise ValueError(f"Invalid date format: {v}")
            try:
                dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                return dt.date()
            except ValueError:
                raise ValueError(f"Invalid date format: {v}")
        if isinstance(v, datetime):
            return v.date()
        raise ValueError(f"Invalid type for date: {type(v).__name__}, value: {v}")

class ProjectResponse(ProjectCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

# Amélioration ExchangeSummary
class SuggestedTask(BaseModel):
    title: str
    description: str
    priority: str = 'medium'
    dueDate: Optional[str] = None

class ExchangeSummaryRequest(BaseModel):
    custom_instruction: Optional[str] = None

class ExchangeSummaryResponse(BaseModel):
    summary: str
    keyPoints: List[str]
    actionItems: List[str]
    suggestedTasks: List[SuggestedTask]
    sentiment: str
    processingTime: float

# NOTES
class NoteCreate(BaseModel):
    entity_type: str = Field(..., pattern='^(contact|project|task|exchange)$')
    entity_id: int
    content: str = Field(..., min_length=1)
    title: Optional[str] = None

class NoteUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1)
    title: Optional[str] = None

class NoteResponse(NoteCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

# RESOURCES
class ResourceCreate(BaseModel):
    entity_type: str = Field(..., pattern='^(contact|project|task)$')
    entity_id: int
    resource_type: str = Field(..., pattern='^(file|url)$')
    title: str = Field(..., min_length=1, max_length=255)
    url: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    description: Optional[str] = None

class ResourceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    url: Optional[str] = None
    description: Optional[str] = None

class ResourceResponse(ResourceCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime