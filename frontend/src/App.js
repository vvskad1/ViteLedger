import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Recovery from './pages/Recovery';
import Caretaker from './pages/Caretaker';
import Reminders from './pages/Reminders';
import SleepSchedule from './pages/SleepSchedule';
import Sleep from './pages/Sleep';
import Hydration from './pages/Hydration';
import Nutrition from './pages/Nutrition';
import EditProfile from './pages/EditProfile';
import HealthRecords from './pages/HealthRecords';
import Analytics from './pages/Analytics';
import Appointments from './pages/Appointments';
import Fitness from './pages/Fitness';
import Mindfulness from './pages/Mindfulness';
import CareTakerAI from './pages/CareTakerAI';
import Billing from './pages/Billing';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recovery" 
          element={
            <ProtectedRoute>
              <Recovery />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/caretaker" 
          element={
            <ProtectedRoute>
              <Caretaker />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reminders" 
          element={
            <ProtectedRoute>
              <Reminders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sleep" 
          element={
            <ProtectedRoute>
              <SleepSchedule />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/nutrition" 
          element={
            <ProtectedRoute>
              <Nutrition />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit-profile" 
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/health-records" 
          element={
            <ProtectedRoute>
              <HealthRecords />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/appointments" 
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hydration" 
          element={
            <ProtectedRoute>
              <Hydration />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sleep-tracker" 
          element={
            <ProtectedRoute>
              <Sleep />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fitness" 
          element={
            <ProtectedRoute>
              <Fitness />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mindfulness" 
          element={
            <ProtectedRoute>
              <Mindfulness />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/caretaker-ai" 
          element={
            <ProtectedRoute>
              <CareTakerAI />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/billing" 
          element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
