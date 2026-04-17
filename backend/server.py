"""
QuickSplit backend - minimal scaffold.

The frontend is fully local-first and does NOT depend on this backend for
any core feature (groups, expenses, balances, settlements all run offline).
This service is a placeholder for future cloud-sync capabilities.
"""

import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="QuickSplit API", version="1.0.0")
api_router = APIRouter(prefix="/api")


class HealthResponse(BaseModel):
    status: str
    service: str
    time: str


@api_router.get("/", response_model=HealthResponse)
async def root() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="QuickSplit API",
        time=datetime.now(timezone.utc).isoformat(),
    )


@api_router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="QuickSplit API",
        time=datetime.now(timezone.utc).isoformat(),
    )


# Placeholder endpoints for future cloud sync (not used by frontend v1).
@api_router.get("/sync/status")
async def sync_status() -> dict:
    return {
        "enabled": False,
        "message": "Cloud sync is not enabled. QuickSplit runs locally on-device.",
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()
