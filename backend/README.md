# VitaLedger Backend

FastAPI backend for VitaLedger - Secure, Decentralized Health Data Ownership platform.

## Setup

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```

   Or with uvicorn:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT token
- `GET /auth/me` - Get current user info (requires authentication)

### Health Check
- `GET /health` - Check API status

## Database

SQLite database (`vitaledger.db`) is automatically created on first run.

## Tech Stack

- **FastAPI** - Modern web framework
- **SQLAlchemy** - ORM
- **SQLite** - Database
- **JWT** - Authentication
- **Pydantic** - Data validation
- **Passlib** - Password hashing
