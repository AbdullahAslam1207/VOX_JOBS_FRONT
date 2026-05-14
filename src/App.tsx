// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/landingpage/LandingPage';
import Registration from './components/registeration/reg';
import AdminLayout from './components/admin/Layout';
import AdminDashboard from './components/admin/Dashboard';
import AdminSettings from './components/admin/Settings';
import AdminListings from './components/admin/Listings';
import AdminUsers from './components/admin/Users';
import UnderDevelopment from './components/admin/UnderDevelopment';
import UserLayout from './components/user/Layout';
import UserDashboard from './components/user/Dashboard';
import UserJobs from './components/user/Jobs';
import SavedJobs from './components/user/Saved';
import UserProfile from './components/user/Profile';
import AppliedJobs from './components/user/AppliedJobs';
import MockInterview from './components/user/MockInterview';
import CVRecommendations from './components/user/CVRecommendations';
import RecruiterLayout from './components/recruiter/RecruiterLayout';
import RecruiterDashboard from './components/recruiter/Dashboard';
import RecruiterCreateJob from './components/recruiter/CreateJob';
import RecruiterJobApplicants from './components/recruiter/JobApplicants';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Registration />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="listings" element={<AdminListings />} />
          <Route path="scrapers" element={<UnderDevelopment />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
          <Route path="jobs" element={<UserJobs />} />
          <Route path="saved" element={<SavedJobs />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="applied-jobs" element={<AppliedJobs />} />
          <Route path="mock-interview" element={<MockInterview />} />
          <Route path="cv-recommendations" element={<CVRecommendations />} />
        </Route>
        <Route path="/recruiter" element={<RecruiterLayout />}>
          <Route index element={<RecruiterDashboard />} />
          <Route path="create-job" element={<RecruiterCreateJob />} />
          <Route path="applicants/:jobId" element={<RecruiterJobApplicants />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
