from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine

from models.workflow import Workflow
from models.step import Step
from models.rule import Rule
from models.execution import Execution

from routers import workflows, steps, rules, executions, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Halleyx Workflow Engine",
    description="A dynamic workflow engine with rules, approvals and notifications",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflows.router)
app.include_router(steps.router)
app.include_router(rules.router)
app.include_router(executions.router)
app.include_router(dashboard.router)

@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Halleyx Workflow Engine is running"}