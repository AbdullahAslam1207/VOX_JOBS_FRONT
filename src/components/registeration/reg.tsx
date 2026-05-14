// Registration.tsx
import React, { useState } from 'react';
import Header from './Header';
import TabButton from './TabButton';
import RoleSelector from './RoleSelector';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

export default function Registration() {
  const [activeTab, setActiveTab] = useState('login');
  // Start with no role chosen; user must pick Admin or Job Seeker first
  const [selectedRole, setSelectedRole] = useState<'none' | 'admin' | 'jobseeker' | 'recruiter'>('none');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Header />
        
        <div className="bg-purple-950/60 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-800/30">
          {/* Role first */}
          <RoleSelector
            selectedRole={selectedRole}
            onRoleChange={(role) => setSelectedRole(role)}
          />

          {/* If no role yet */}
          {selectedRole === 'none' && (
            <div className="text-purple-200/80 text-sm mt-4">Please select a role to continue.</div>
          )}

          {/* Admin: login only */}
          {selectedRole === 'admin' && (
            <div className="mt-6">
              <LoginForm selectedRole={'admin'} />
            </div>
          )}

          {/* Jobseeker and recruiter: login or signup */}
          {(selectedRole === 'jobseeker' || selectedRole === 'recruiter') && (
            <>
              <div className="flex gap-2 mt-6 mb-6 bg-purple-900/30 rounded-lg p-2">
                <TabButton
                  active={activeTab === 'login'}
                  onClick={() => setActiveTab('login')}
                >
                  Login
                </TabButton>
                <TabButton
                  active={activeTab === 'signup'}
                  onClick={() => setActiveTab('signup')}
                >
                  Sign Up
                </TabButton>
              </div>
              {activeTab === 'login' ? (
                <LoginForm selectedRole={selectedRole} />
              ) : (
                <SignupForm selectedRole={selectedRole} />
              )}
            </>
          )}
        </div>

        <p className="text-center text-purple-300 mt-6">
          Empowering careers through voice-driven technology
        </p>
      </div>
    </div>
  );
}