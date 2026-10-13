from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database import engine, Base, SessionLocal
from app.services.demo_data_service import seed_default_categories
from app.api import documents, transactions, categories, analytics, ai_assistant, settings as settings_api

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    Base.metadata.create_all(bind=engine)
    
    # Seed standard categories if empty
    db = SessionLocal()
    try:
        seed_default_categories(db)
    finally:
        db.close()
    
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Privacy-First Local AI Finance Assistant for Freelancers and Small Businesses",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware for React Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(documents.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(analytics.router)
app.include_router(ai_assistant.router)
app.include_router(settings_api.router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "online",
        "privacy": "100% on-device local storage and inference",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "database": "sqlite_connected",
        "ollama_configured_model": settings.OLLAMA_MODEL,
        "ollama_host": settings.OLLAMA_BASE_URL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
