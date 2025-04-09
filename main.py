import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import users
from api.database import *
from contextlib import asynccontextmanager
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("log.txt"),
        logging.StreamHandler()
    ]
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Raiden Track API", lifespan=lifespan)

origins = [
    "https://track-3d-hnjf9lieh-misfit-s-projects-03a72051.vercel.app",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

app.include_router(users.router)

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8001, log_config=None)