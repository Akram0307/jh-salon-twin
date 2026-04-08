from fastapi import FastAPI
from .database import engine, Base
from fastapi.middleware.cors import CORSMiddleware

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Jawed Habib Digital Twin Backend",
    description="High-performance API for Salon Resource Management and Booking",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Digital Twin Backend is Live! 🚗👩‍💼"}
