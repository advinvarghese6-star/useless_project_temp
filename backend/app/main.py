import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from app.database import engine, Base
from app.routes import health_router, sessions_router, audits_router, statistics_router

load_dotenv()

# Initialize Database Schema automatically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Code Red API",
    description="Session, Audit, and Statistics System for Code Red Hackathon Application",
    version="1.0.0"
)

# CORS Configuration — allow all origins for hackathon demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)
app.include_router(sessions_router)
app.include_router(audits_router)
app.include_router(statistics_router)

# Custom Exception Handler to prevent exposing internal stack traces
@app.exception_handler(Exception)
async def custom_global_exception_handler(request: Request, exc: Exception):
    # Do not interfere with CORS preflight OPTIONS requests
    if request.method == "OPTIONS":
        return JSONResponse(status_code=200, content={})
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "An internal server error occurred",
            "code": "INTERNAL_SERVER_ERROR"
        }
    )
