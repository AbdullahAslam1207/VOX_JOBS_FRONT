// LoginForm.jsx
import React, { useState } from 'react';
import InputField from './InputField';
import SubmitButton from './SubmitButton';
import { loginUser, mapUiRoleToBackend, persistUserFromAuthResponse, setStoredUser } from '../../api';

const LoginForm = ({ selectedRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const role = mapUiRoleToBackend(selectedRole);
      const res = await loginUser({ email, password, role });
      // Persist user details; ensure we keep email even if API omits it
      const stored = persistUserFromAuthResponse(res, email);
      if (!stored || !stored.email) {
        setStoredUser({ ...(stored || {}), email, role, user_id: stored?.user_id ?? res?.user_id ?? res?.id });
      }
      if (selectedRole === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/user';
      }
    } catch (e: any) {
      const errorMessage = e?.message || '';
      // Provide user-friendly error messages
      if (errorMessage.includes('404') || errorMessage.includes('Not Found') || errorMessage.includes('detail')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Invalid email or password. Please try again.');
      } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        setError('Please check your email and password format.');
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server')) {
        setError('Server error. Please try again later.');
      } else if (errorMessage) {
        // If it's a user-friendly message, use it; otherwise show generic error
        setError(errorMessage.length < 100 ? errorMessage : 'Login failed. Please try again.');
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
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <InputField
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div className="text-red-300 text-sm mb-2">{error}</div>}
      <SubmitButton onClick={handleLogin}>
        {loading ? 'Signing in…' : `Login as ${selectedRole === 'admin' ? 'Admin' : 'Job Seeker'}`}
      </SubmitButton>
    </div>
  );
};

export default LoginForm;