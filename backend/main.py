from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import workflows

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Halleyx Workflow Engine",
    description="A dynamic workflow engine with rules, approvals and notifications",
    version="1.0.0"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(workflows.router)

@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Halleyx Workflow Engine is running"}