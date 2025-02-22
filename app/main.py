import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import models, database 
from app.routes import users  
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)


models.Base.metadata.create_all(bind=database.engine)

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8001) 