# VitaLedger Frontend

React frontend for VitaLedger - Secure, Decentralized Health Data Ownership platform.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

The app will open at `http://localhost:3000`

## Features

### Phase 1 ✅
- User registration and login
- JWT token authentication
- Protected routes
- Modern dark theme with teal accents
- Responsive design
- Smooth animations with Framer Motion

## Tech Stack

- **React 18** - UI framework
- **React Router DOM** - Routing
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **CSS** - Styling (no CSS frameworks)

## Project Structure

```
src/
├── components/
│   ├── Button.js
│   ├── Card.js
│   ├── Input.js
│   ├── Layout.js
│   ├── Navbar.js
│   └── ProtectedRoute.js
├── pages/
│   ├── Login.js
│   ├── Register.js
│   └── Dashboard.js
├── App.js
└── index.js
```

## Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests

## Environment

Make sure the backend API is running at `http://localhost:8000`
