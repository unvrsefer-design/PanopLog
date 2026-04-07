from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

from db import init_db
from routes.health import router as health_router
from routes.feedback import router as feedback_router
from routes.incidents import router as incidents_router
from routes.auth import router as auth_router
from routes.realtime import router as realtime_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://terrific-mercy-production-1466.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


app.include_router(health_router)
app.include_router(feedback_router)
app.include_router(incidents_router)
app.include_router(auth_router)
app.include_router(realtime_router)