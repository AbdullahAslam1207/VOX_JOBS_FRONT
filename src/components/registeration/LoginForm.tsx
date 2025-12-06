// LoginForm.jsx
import React, { useState } from 'react';
import InputField from './InputField';
import SubmitButton from './SubmitButton';
<<<<<<< HEAD
import { loginUser, mapUiRoleToBackend } from '../../api';
=======
import { loginUser } from '../../lib/api';
import ErrorDialog from '../common/ErrorDialog';
>>>>>>> 46a1eaef149893e9c722aaf740180cea9c62b523

const LoginForm = ({ selectedRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
<<<<<<< HEAD
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      const role = mapUiRoleToBackend(selectedRole);
      await loginUser({ email, password, role });
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
=======
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    const role = selectedRole === 'admin' ? 'Admin' : 'Job_Seeker';
    try {
      await loginUser({ email, password, role });
      if (selectedRole === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/user/jobs';
      }
    } catch (e: any) {
      setError(e?.message || 'Invalid credentials. Please try again.');
    }
>>>>>>> 46a1eaef149893e9c722aaf740180cea9c62b523
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

      <ErrorDialog open={!!error} message={error || ''} onClose={() => setError(null)} />
    </div>
  );
};

export default LoginForm;