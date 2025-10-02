// LoginForm.jsx
import React, { useState } from 'react';
import InputField from './InputField';
import SubmitButton from './SubmitButton';

const LoginForm = ({ selectedRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (selectedRole === 'admin') {
      window.location.href = '/admin';
      return;
    }
    // Jobseeker login goes to user dashboard
    window.location.href = '/user';
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
    </div>
  );
};

export default LoginForm;