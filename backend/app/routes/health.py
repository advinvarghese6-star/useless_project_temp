from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/")
def get_root():
    return {
        "message": "Welcome to Code Red API",
        "status": "online"
    }

@router.get("/api/health")
def get_health():
    return {
        "success": True,
        "status": "online",
        "service": "Code Red API"
    }
