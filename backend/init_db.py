"""Initialize the database with all tables and columns"""
from db import Base, engine
from auth.models import User
from nutrition.models import LabReport, Meal, NutritionRecommendation
from reminder.models import Reminder
from sleep.models import SleepSchedule, SleepLog
from status.models import RecoveryStatus, Caretaker
from appointment.models import Appointment
from hydration.models import HydrationLog
from fitness.models import FitnessGoal, FitnessPlan, WorkoutLog
from mind.models import MoodLog
from rag.store import WebCache

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("Creating all tables...")
Base.metadata.create_all(bind=engine)

print("Database initialized successfully!")
print("\nUser table columns:")
for column in User.__table__.columns:
    print(f"  - {column.name}: {column.type}")

print("\nAll tables created:")
for table in Base.metadata.sorted_tables:
    print(f"  - {table.name}")
