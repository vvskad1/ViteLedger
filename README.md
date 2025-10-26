# VitaLedger 🏥



> **AI-powered health companion—track, analyze, and optimize your wellness journey with intelligent insights from nutrition to mindfulness.
> ****Secure, Decentralized Health Data Ownership**
Developed by Venkata Sai Krishna Aditya Vatturi


VitaLedger is a blockchain-inspired platform that gives patients full ownership and control of their health records. Built for Cal Hacks 12.0.

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/downloads/)

[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)

**Authentication & Base Layout**

**Built with:** React, FastAPI, Python, JavaScript, SQLite, SQLAlchemy, Groq API (Llama 3.1), ChromaDB, BrightData SERP API, Sentence Transformers, Framer Motion, Lucide React, httpx, Pydantic, JWT, bcrypt, Lava Payments API

### Features

---- ✅ User Registration & Login

- ✅ JWT Token Authentication

## 🌟 Overview- ✅ Protected Dashboard Routes

- ✅ Modern Dark Theme with Teal Accents

VitaLedger is a comprehensive health management platform that combines intelligent tracking with AI-powered analysis. It unifies nutrition, fitness, sleep, hydration, mental wellness, and medical data into a single, beautiful dashboard with personalized recommendations based on your unique health profile.- ✅ Responsive Design

- ✅ Smooth Animations

### Key Highlights

## 📁 Project Structure

- 🤖 **AI-Powered Insights**: Uses Groq's Llama 3.1 for intelligent health recommendations

- 🔬 **Lab Report Analysis**: Upload and get AI interpretation of blood work with dietary suggestions  ```

- 🍽️ **Smart Meal Planning**: 7-day personalized meal plans based on goals, culture, and lab resultsVitaLedger/

- 💪 **Adaptive Fitness**: Dynamic workout plans that adjust based on recovery status├── backend/                 # FastAPI Backend

- 🧘 **Mindfulness Coach**: AI companion for mental wellness with breathing exercises│   ├── auth/               # Authentication module

- 📊 **Comprehensive Tracking**: Nutrition, fitness, sleep, hydration, appointments│   │   ├── models.py       # User database model

- 💳 **Flexible Subscriptions**: Free trial + Lava payment integration with sandbox testing│   │   ├── routes.py       # Auth endpoints

│   │   └── utils.py        # JWT & password utilities

---│   ├── main.py             # FastAPI app entry

│   ├── db.py               # Database configuration

## ✨ Features│   ├── schemas.py          # Pydantic schemas

│   └── requirements.txt    # Python dependencies

### 🏠 Dashboard│

Real-time health metrics, nutrition summary, hydration tracking, quick access to all modules└── frontend/               # React Frontend

    ├── public/

### 🍎 Nutrition Tracker    ├── src/

AI-powered 7-day meal plans, macro tracking, lab result integration, cultural preferences    │   ├── components/     # Reusable UI components

    │   │   ├── Button.js

### 💪 Fitness Planner    │   │   ├── Card.js

Personalized workouts, progressive overload, recovery tracking, AI-generated routines    │   │   ├── Input.js

    │   │   ├── Layout.js

### 💧 Hydration Monitor    │   │   ├── Navbar.js

Visual tracking, daily goals, 7-day history, progress ring visualization    │   │   └── ProtectedRoute.js

    │   ├── pages/          # Application pages

### 😴 Sleep Tracker    │   │   ├── Login.js

Duration logging, quality ratings, pattern analysis, historical data    │   │   ├── Register.js

    │   │   └── Dashboard.js

### 🧘 Mindfulness    │   ├── App.js

AI mental wellness chat, breathing exercises, gratitude journaling, voice input    │   └── index.js

    └── package.json

### 🔬 Lab Reports```

Upload PDFs, AI analysis, abnormality detection, personalized recommendations

## 🛠️ Tech Stack

### 📅 Appointments

Schedule tracking, email reminders, appointment history### Backend

- **FastAPI** - Modern Python web framework

### 💳 Subscriptions- **SQLAlchemy** - ORM

Three tiers (Basic/Plus/Pro), 3-day free trial, Lava payment integration- **SQLite** - Database

- **JWT** - Token-based authentication

---- **Pydantic** - Data validation



## 🚀 Getting Started### Frontend

- **React 18** - UI library

### Prerequisites- **React Router DOM** - Client-side routing

- **Framer Motion** - Smooth animations

- Node.js 16+ and npm- **Lucide React** - Icon library

- Python 3.9+- **Plain CSS** - Custom styling

- Git

- Groq API Key (free at https://console.groq.com)## 🚀 Getting Started



### Quick Installation### Backend Setup



```bash1. Navigate to backend folder:

# Clone repository   ```powershell

git clone https://github.com/vvskad1/ViteLedger.git   cd backend

cd VitaLedger   ```



# Backend setup2. Create virtual environment:

cd backend   ```powershell

python -m venv venv   python -m venv venv

.\venv\Scripts\activate  # Windows   venv\Scripts\activate

pip install -r requirements.txt   ```

# Edit .env with your API keys

python init_db.py3. Install dependencies:

uvicorn main:app --reload   ```powershell

   pip install -r requirements.txt

# Frontend setup (new terminal)   ```

cd frontend

npm install4. Run the server:

npm start   ```powershell

```   python main.py

   ```

**Visit**: http://localhost:3000

Backend will run at `http://localhost:8000`

---

### Frontend Setup

## 📁 Project Structure

1. Navigate to frontend folder:

```   ```powershell

VitaLedger/   cd frontend

├── backend/              # FastAPI backend   ```

│   ├── auth/            # Authentication

│   ├── nutrition/       # Meal tracking & AI plans2. Install dependencies:

│   ├── fitness/         # Workout generation   ```powershell

│   ├── mind/            # Mindfulness features   npm install

│   ├── subscriptions/   # Payment system   ```

│   ├── rag/             # RAG pipeline

│   └── main.py3. Start development server:

├── frontend/            # React frontend   ```powershell

│   └── src/   npm start

│       ├── components/  # Reusable UI   ```

│       ├── pages/       # App pages

│       └── utils/       # HelpersFrontend will open at `http://localhost:3000`

└── README.md

```## 📝 API Documentation



---Once backend is running, visit:

- Swagger UI: http://localhost:8000/docs

## 🛠️ Tech Stack- ReDoc: http://localhost:8000/redoc



**Frontend**: React 18, Framer Motion, Lucide React, CSS3## 🎯 Upcoming Phases



**Backend**: FastAPI, SQLAlchemy, SQLite, JWT, Pydantic### Phase 2 - Recovery Mode & Caretaker

- Patient status management

**AI/ML**: Groq (Llama 3.1), Sentence Transformers, ChromaDB, BrightData- Emergency contact system

- Recovery mode activation

**Payments**: Lava API (MOCK/SANDBOX/LIVE modes)

### Phase 3 - Reminders & Scheduler

---- Meal reminders

- Hydration tracking

## ⚙️ Configuration- Medication schedules



### Backend `.env`### Phase 4 - Nutrition & Medical Analysis

- Nutrition plans

```env- Lab report analysis

# Required- Dietary recommendations

GROQ_API_KEY=your_groq_key

### Phase 5 - Hydration & Sleep Manager

# Optional (for RAG features)- Water intake tracking

BRIGHTDATA_API_KEY=your_key- Sleep schedule monitoring



# Subscriptions### Phase 6 - Fitness Companion

SUBS_MODE=MOCK  # Options: MOCK, LAVA_SANDBOX, LAVA- Workout plans

- Activity tracking

# Lava Sandbox (testing)

LAVA_API_KEY_TEST=sk_test_xxx### Phase 7 - Supplement Advisor

LAVA_BASE_URL_SANDBOX=https://sandbox.api.lava.ai- Supplement recommendations

```- Integration with lab data



### Frontend `.env`### Phase 8 - Mindfulness & Environment

- Meditation guides

```env- Breathing exercises

REACT_APP_SUBS_MODE=MOCK- Mood tracking

```

## 📄 License

---

Built for Cal Hacks 11.0

## 💳 Subscription System

## 👥 Team

### Plans

Your VitaLedger Team

| Feature | Basic | Plus | Pro |
|---------|-------|------|-----|
| Tracking | ✅ | ✅ | ✅ |
| AI Meal Plans | ❌ | ✅ | ✅ |
| Lab Analysis | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

**Pricing**: $2.99-$7.99/week, $9.99-$24.99/month, $99.99-$249.99/year

**Free Trial**: 3 days Plus plan (auto-activated)

**Modes**: 
- MOCK (local testing)
- LAVA_SANDBOX (test with fake cards)
- LAVA (production)

[Full testing guide](LAVA_SANDBOX_TESTING.md)

---

## 📝 API Documentation

**Interactive Docs**: http://localhost:8000/docs

### Quick Examples

**Register**:
```http
POST /auth/register
{"name": "John", "email": "john@example.com", "password": "pass123"}
```

**Generate Meal Plan**:
```http
POST /nutrition/meal-plan/generate
Authorization: Bearer <token>
{"expectations": "High protein, Indian food, bulk"}
```

**Create Subscription**:
```http
POST /subscriptions/create
Authorization: Bearer <token>
{"plan": "plus", "period": "monthly"}
```

---

## 🧪 Testing

### Manual Testing
1. Start backend + frontend
2. Register → auto-trial
3. Test features
4. Try meal generation
5. Check subscriptions

### Sandbox Testing (Payments)
See [LAVA_SANDBOX_TESTING.md](LAVA_SANDBOX_TESTING.md)

Quick test:
```bash
# Set SUBS_MODE=LAVA_SANDBOX in .env files
# Restart servers
# Go to Billing → Subscribe
# Use card: 4242 4242 4242 4242
```

---

## 🚢 Deployment

### Backend (Railway/Heroku)
```bash
# Add Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port $PORT" > Procfile

# Set environment variables in platform
# Deploy
git push railway main
```

### Frontend (Vercel/Netlify)
```bash
npm run build
vercel --prod
```

**Production Checklist**:
- [ ] Change SECRET_KEY
- [ ] Set SUBS_MODE=LAVA
- [ ] Add production API keys
- [ ] Enable HTTPS
- [ ] Configure CORS
- [ ] Set up monitoring

---

## 🤝 Contributing

1. Fork repository
2. Create branch: `git checkout -b feature/AmazingFeature`
3. Commit: `git commit -m 'Add AmazingFeature'`
4. Push: `git push origin feature/AmazingFeature`
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

Groq, Lava, BrightData, FastAPI, React, ChromaDB, Sentence Transformers

---

## 📞 Support

- Issues: [GitHub Issues](https://github.com/vvskad1/ViteLedger/issues)
- Docs: [Wiki](https://github.com/vvskad1/ViteLedger/wiki)

---

## 🗺️ Roadmap

### Completed ✅
- [x] User authentication
- [x] Health tracking modules
- [x] AI integration (Groq)
- [x] RAG pipeline
- [x] Subscription system
- [x] Free trial

### Q1 2026
- [ ] Multi-modal AI
- [ ] Voice-first interactions
- [ ] Predictive insights

### Q2 2026
- [ ] Social features
- [ ] Community challenges
- [ ] Leaderboards

### Q3 2026
- [ ] Wearable integrations
- [ ] Apple Health sync
- [ ] Fitbit/Garmin

### Q4 2026
- [ ] Telehealth
- [ ] Video consultations
- [ ] Lab sharing with doctors

---

**Built with ❤️ and lots of ☕ by [vvskad1](https://github.com/vvskad1)**

*"Your health is your wealth. Track it wisely."* 🌟
