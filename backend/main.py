from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from db import init_db
from auth.routes import router as auth_router
from status.routes import router as status_router
from caretaker.routes import router as caretaker_router
from reminder.routes import router as reminder_router
from sleep.routes import router as sleep_router
from nutrition.routes import router as nutrition_router
from appointment.routes import router as appointment_router
from hydration.routes import router as hydration_router
from fitness.routes import router as fitness_router
from mind.routes import router as mind_router
from subscriptions.routes import router as subscriptions_router

# Load environment variables
load_dotenv()

app = FastAPI(title="VitaLedger API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
@app.on_event("startup")
def startup_event():
    init_db()

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "VitaLedger API"}

# Include routers
app.include_router(auth_router)
app.include_router(status_router)
app.include_router(caretaker_router)
app.include_router(reminder_router)
app.include_router(sleep_router)
app.include_router(nutrition_router)
app.include_router(appointment_router)
app.include_router(hydration_router)
app.include_router(fitness_router)
app.include_router(mind_router)
app.include_router(subscriptions_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
