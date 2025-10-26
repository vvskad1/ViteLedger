# VitaLedger

**Secure, Decentralized Health Data Ownership**

VitaLedger is a blockchain-inspired platform that gives patients full ownership and control of their health records. Built for Cal Hacks 11.0.

## 🚀 Phase 1 - Complete ✅

**Authentication & Base Layout**

### Features
- ✅ User Registration & Login
- ✅ JWT Token Authentication
- ✅ Protected Dashboard Routes
- ✅ Modern Dark Theme with Teal Accents
- ✅ Responsive Design
- ✅ Smooth Animations

## 📁 Project Structure

```
VitaLedger/
├── backend/                 # FastAPI Backend
│   ├── auth/               # Authentication module
│   │   ├── models.py       # User database model
│   │   ├── routes.py       # Auth endpoints
│   │   └── utils.py        # JWT & password utilities
│   ├── main.py             # FastAPI app entry
│   ├── db.py               # Database configuration
│   ├── schemas.py          # Pydantic schemas
│   └── requirements.txt    # Python dependencies
│
└── frontend/               # React Frontend
    ├── public/
    ├── src/
    │   ├── components/     # Reusable UI components
    │   │   ├── Button.js
    │   │   ├── Card.js
    │   │   ├── Input.js
    │   │   ├── Layout.js
    │   │   ├── Navbar.js
    │   │   └── ProtectedRoute.js
    │   ├── pages/          # Application pages
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   └── Dashboard.js
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM
- **SQLite** - Database
- **JWT** - Token-based authentication
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI library
- **React Router DOM** - Client-side routing
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon library
- **Plain CSS** - Custom styling

## 🚀 Getting Started

### Backend Setup

1. Navigate to backend folder:
   ```powershell
   cd backend
   ```

2. Create virtual environment:
   ```powershell
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Run the server:
   ```powershell
   python main.py
   ```

Backend will run at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend folder:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start development server:
   ```powershell
   npm start
   ```

Frontend will open at `http://localhost:3000`

## 📝 API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🎯 Upcoming Phases

### Phase 2 - Recovery Mode & Caretaker
- Patient status management
- Emergency contact system
- Recovery mode activation

### Phase 3 - Reminders & Scheduler
- Meal reminders
- Hydration tracking
- Medication schedules

### Phase 4 - Nutrition & Medical Analysis
- Nutrition plans
- Lab report analysis
- Dietary recommendations

### Phase 5 - Hydration & Sleep Manager
- Water intake tracking
- Sleep schedule monitoring

### Phase 6 - Fitness Companion
- Workout plans
- Activity tracking

### Phase 7 - Supplement Advisor
- Supplement recommendations
- Integration with lab data

### Phase 8 - Mindfulness & Environment
- Meditation guides
- Breathing exercises
- Mood tracking

## 📄 License

Built for Cal Hacks 11.0

## 👥 Done by Venkata Sai Krishna Aditya Vatturi
