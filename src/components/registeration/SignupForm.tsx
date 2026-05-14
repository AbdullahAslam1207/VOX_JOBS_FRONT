// SignupForm.jsx
import React, { useState } from 'react';
import InputField from './InputField';
import SubmitButton from './SubmitButton';
import {
  registerRecruiter,
  registerUser,
  mapUiRoleToBackend,
  persistUserFromAuthResponse,
  setStoredUser,
} from '../../api';

const SignupForm = ({ selectedRole }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    try {
      setError('');
      if (!fullName || !email || !password || !confirmPassword) {
        setError('Please fill all fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (selectedRole === 'recruiter' && !companyName.trim()) {
        setError('Please provide your company details');
        return;
      }
      setLoading(true);
      const res = selectedRole === 'recruiter'
        ? await registerRecruiter({
            name: fullName,
            email,
            password,
            companyName: companyName.trim(),
            companyWebsite: companyWebsite.trim() || undefined,
          })
        : await registerUser({ fullname: fullName, email, password, role: mapUiRoleToBackend('jobseeker') });
      // Persist user details if available; otherwise store minimal info
      const stored = persistUserFromAuthResponse(res, email);
      if (!stored || !stored.email) {
        setStoredUser({
          ...(stored || {}),
          email,
          fullname: fullName,
          role: res?.role || mapUiRoleToBackend('jobseeker'),
          company_name: companyName.trim() || undefined,
          company_website: companyWebsite.trim() || undefined,
          user_id: stored?.user_id ?? res?.user_id ?? res?.id,
        });
      }
      window.location.href = selectedRole === 'recruiter' ? '/recruiter' : '/user';
    } catch (e: any) {
      const errorMessage = e?.message || '';
      // Provide user-friendly error messages
      if (errorMessage.includes('404') || errorMessage.includes('Not Found') || errorMessage.includes('detail')) {
        setError('Unable to create account. Please try again.');
      } else if (errorMessage.includes('409') || errorMessage.includes('Conflict') || errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        setError('An account with this email already exists. Please use a different email or try logging in.');
      } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        setError('Please check that all fields are filled correctly.');
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server')) {
        setError('Server error. Please try again later.');
      } else if (errorMessage.includes('email') && errorMessage.includes('invalid')) {
        setError('Please enter a valid email address.');
      } else if (errorMessage) {
        // If it's a user-friendly message, use it; otherwise show generic error
        setError(errorMessage.length < 100 ? errorMessage : 'Unable to create account. Please try again.');
      } else {
        setError('Unable to connect. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
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
      {selectedRole === 'recruiter' && (
        <>
          <InputField
            label="Company Name"
            type="text"
            placeholder="Enter your company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <InputField
            label="Company Website"
            type="url"
            placeholder="https://yourcompany.com"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
          />
        </>
      )}
      {error && <div className="text-red-300 text-sm mb-2">{error}</div>}
      <SubmitButton onClick={handleSignup}>
        {loading ? 'Creating account…' : selectedRole === 'recruiter' ? 'Create Recruiter Account' : 'Create Job Seeker Account'}
      </SubmitButton>
    </div>
  );
};

export default SignupForm;
