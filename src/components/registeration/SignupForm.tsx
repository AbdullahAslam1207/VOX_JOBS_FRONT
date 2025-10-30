// SignupForm.jsx
import React, { useState } from 'react';
import InputField from './InputField';
import SubmitButton from './SubmitButton';
import { registerUser } from '../../lib/api';
import ErrorDialog from '../common/ErrorDialog';

const SignupForm = ({ selectedRole }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resume, setResume] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setResume(file);
      setResumeFileName(file.name);
    }
  };

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await registerUser({ fullname: fullName, email, password, role: 'Job_Seeker' });
      window.location.href = '/user/jobs';
    } catch (e: any) {
      setError(e?.message || 'Registration failed');
    }
  };

  return (
    <div>
      <InputField
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <InputField
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <InputField
        label="Password"
        type="password"
        placeholder="Create a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <InputField
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-2">
          Resume/CV <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            type="file"
            id="resume"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeChange}
            className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition-colors"
          />
        </div>
        {resumeFileName && (
          <p className="mt-1 text-sm text-green-400">
            ✓ {resumeFileName} selected
          </p>
        )}
        <p className="mt-1 text-xs text-white/60">
          Upload your resume in PDF or Word format (max 5MB)
        </p>
      </div>
      <SubmitButton onClick={handleSignup}>
        Create Job Seeker Account
      </SubmitButton>

      <ErrorDialog open={!!error} message={error || ''} onClose={() => setError(null)} />
    </div>
  );
};

export default SignupForm;