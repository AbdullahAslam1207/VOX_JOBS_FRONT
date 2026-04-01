// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/landingpage/LandingPage';
import Registration from './components/registeration/reg';
import AdminLayout from './components/admin/Layout';
import AdminDashboard from './components/admin/Dashboard';
import AdminSettings from './components/admin/Settings';
import UnderDevelopment from './components/admin/UnderDevelopment';
import UserLayout from './components/user/Layout';
import UserDashboard from './components/user/Dashboard';
import UserJobs from './components/user/Jobs';
import SavedJobs from './components/user/Saved';
<<<<<<< HEAD
import UserProfile from './components/user/Profile';
import AppliedJobs from './components/user/AppliedJobs';
import MockInterview from './components/user/MockInterview';
=======
import Settings from './components/user/Settings';
>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20

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
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
          <Route path="jobs" element={<UserJobs />} />
          <Route path="saved" element={<SavedJobs />} />
<<<<<<< HEAD
          <Route path="profile" element={<UserProfile />} />
          <Route path="applied-jobs" element={<AppliedJobs />} />
          <Route path="mock-interview" element={<MockInterview />} />
=======
          <Route path="settings" element={<Settings />} />
>>>>>>> 6f783d3fa3c3bd8ab72097364a0bf8337a445d20
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;