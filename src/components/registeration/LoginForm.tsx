// LoginForm.jsx
import React, { useState } from 'react';
import InputField from './InputField';
import SubmitButton from './SubmitButton';
import { loginUser } from '../../lib/api';
import ErrorDialog from '../common/ErrorDialog';

const LoginForm = ({ selectedRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <SubmitButton onClick={handleLogin}>
        Login as {selectedRole === 'admin' ? 'Admin' : 'Job Seeker'}
      </SubmitButton>

      <ErrorDialog open={!!error} message={error || ''} onClose={() => setError(null)} />
    </div>
  );
};

export default LoginForm;