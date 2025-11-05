#!/usr/bin/env python3
# app/api/main.py

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config.config import settings
from config.logger import logger
from app.api.routes import auth, users, health, crm, upload, tasks, projects, notes, resources
from app.database.db import init_db

# --- Création de l'app ---
app = FastAPI(title=settings.app_name, debug=settings.debug)

# --- Configuration CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Inclusion des routes ---
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(health.router)
app.include_router(crm.router)
app.include_router(upload.router)
app.include_router(tasks.router)
app.include_router(projects.router)
app.include_router(notes.router)
app.include_router(resources.router)

# --- StaticFiles pour servir les uploads ---
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")

# --- Événements startup/shutdown ---
@app.on_event("startup")
async def on_startup():
    logger.info("Application started")
    await init_db()

@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Application stopped")

# --- Lancement en mode script ---
if __name__ == "__main__":
    uvicorn.run(
        "app.api.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )