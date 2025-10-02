// SignupForm.jsx
import React, { useState } from 'react';
import InputField from './InputField';
import SubmitButton from './SubmitButton';

const SignupForm = ({ selectedRole }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = () => {
    // Admin signup is not allowed. Only job seeker accounts can be created.
    const role = 'jobseeker';
    console.log('Signup:', { role, fullName, email, password, confirmPassword });
    // Redirect new job seeker to user dashboard for now
    window.location.href = '/user';
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
      <SubmitButton onClick={handleSignup}>
        Create Job Seeker Account
      </SubmitButton>
    </div>
  );
};

export default SignupForm;