// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/landingpage/LandingPage';
import Registration from './components/registeration/reg';
import AdminLayout from './components/admin/Layout';
import AdminDashboard from './components/admin/Dashboard';
import UnderDevelopment from './components/admin/UnderDevelopment';
import UserLayout from './components/user/Layout';
import UserDashboard from './components/user/Dashboard';
import UserJobs from './components/user/Jobs';
import SavedJobs from './components/user/Saved';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Registration />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="listings" element={<UnderDevelopment />} />
          <Route path="scrapers" element={<UnderDevelopment />} />
          <Route path="users" element={<UnderDevelopment />} />
          <Route path="analytics" element={<UnderDevelopment />} />
          <Route path="settings" element={<UnderDevelopment />} />
        </Route>
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
          <Route path="jobs" element={<UserJobs />} />
          <Route path="saved" element={<SavedJobs />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;