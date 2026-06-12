from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse

router = APIRouter()

_DEMO_THREAD_PATH = Path(__file__).resolve().parent.parent / "static" / "demo_thread.html"


@router.get("/demo/thread")
async def demo_thread():
    return FileResponse(_DEMO_THREAD_PATH, media_type="text/html")
