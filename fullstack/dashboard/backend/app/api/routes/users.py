#!/usr/bin/env python3
# app/api/routes/users.py

from fastapi import APIRouter, HTTPException

from config.logger import logger
from app.database import crud
from app.api.models import UserCreate

router = APIRouter(prefix="", tags=["users"])

@router.post("/create-user")
async def create_user(user_data: UserCreate):
    """Crée un nouvel utilisateur."""
    try:
        user_id = crud.create_user(user_data.username, user_data.email)
        return {"status": "success", "user_id": user_id}
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'utilisateur: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création de l'utilisateur")

@router.get("/get-user/{user_id}")
async def get_user(user_id: int):
    """Récupère un utilisateur spécifique."""
    try:
        user = crud.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        return {"status": "success", "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'utilisateur: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération de l'utilisateur")

@router.get("/get-users")
async def get_users():
    """Récupère tous les utilisateurs."""
    try:
        users = crud.list_users()
        return {"status": "success", "users": [{
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        } for user in users]}
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des utilisateurs: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des utilisateurs")