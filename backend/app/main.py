import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes import router
from backend.app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="Scam Call Shield API",
    description="Real-time multi-lingual AI scam shield backend using Gemini Flash audio analysis & deterministic risk engine.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "name": "Scam Call Shield API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "gemini_model": settings.gemini_model,
        "mode": "Live Gemini" if settings.gemini_api_key else "Replay Mode (Offline Ready)",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=True)
