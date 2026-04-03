from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import demo, generate, settings, tone

app = FastAPI(
    title="OpenRedditKarmaBot",
    version="0.1.0",
    description="Open-source Reddit karma bot backend",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router)
app.include_router(tone.router)
app.include_router(settings.router)
app.include_router(demo.router)
