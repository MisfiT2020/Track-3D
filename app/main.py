
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import models, database 
from app.routes import users  

app = FastAPI()


origins = [
    "http://localhost:5173",  
    "http://localhost:4000",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     
    allow_credentials=True,
    allow_methods=["*"],       
    allow_headers=["*"],
)


app.include_router(users.router)


models.Base.metadata.create_all(bind=database.engine)

if __name__ == '__main__':
    uvicorn.run(app, host="127.0.0.1", port=8001)
