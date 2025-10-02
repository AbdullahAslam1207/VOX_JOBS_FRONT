import React, { useEffect, useState } from 'react';
import TabButton from '../registeration/TabButton';
import RoleSelector from '../registeration/RoleSelector';
import LoginForm from '../registeration/LoginForm';
import SignupForm from '../registeration/SignupForm';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<'none' | 'admin' | 'jobseeker'>('none');
  const [mounted, setMounted] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  
  const slogans = [
    "Find your dream job with the power of your voice",
    "Speak your way to success", 
    "Where voice meets opportunity",
    "Your voice, your career, your future"
  ];

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    let currentSloganIndex = 0;
    let isRunning = true;
    
    const typeSlogan = async (text: string) => {
      // Type out
      for (let i = 0; i <= text.length && isRunning; i++) {
        setTypewriterText(text.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      
      // Wait
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Erase
      for (let i = text.length; i >= 0 && isRunning; i--) {
        setTypewriterText(text.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Wait before next
      await new Promise(resolve => setTimeout(resolve, 500));
    };
    
    const runLoop = async () => {
      while (isRunning) {
        await typeSlogan(slogans[currentSloganIndex]);
        currentSloganIndex = (currentSloganIndex + 1) % slogans.length;
      }
    };
    
    runLoop();
    
    return () => {
      isRunning = false;
    };
  }, [mounted]);

  return (
    <div className="relative h-screen overflow-hidden bg-[#1A1A1D] dark:bg-[#1A1A1D]">
      <div className="absolute inset-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: '#3B1C32', opacity: 0.35 }}></div>
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full blur-3xl" style={{ backgroundColor: '#6A1E55', opacity: 0.3 }}></div>
        <div className="absolute top-1/3 right-1/3 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: '#A64D79', opacity: 0.25 }}></div>
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="VoxJobs" className="w-16 h-16 object-contain" />
          <span className="text-2xl md:text-3xl font-bold text-white">VoxJobs</span>
        </div>
        <div />
      </header>

      <main className="relative z-10 h-[calc(100vh-72px)]">
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 items-center px-6 gap-6 -translate-y-12">
          <div className={`pl-4 md:pl-10 transition-all duration-700 ${showAuth ? 'opacity-0 pointer-events-none -translate-x-full' : 'opacity-100 translate-x-0'} ${mounted && !showAuth ? 'translate-x-0' : 'opacity-0 -translate-x-8'}` }>
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-4" style={{ color: '#A64D79' }}>VoxJobs</h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 min-h-[2.5rem]">
              {typewriterText}
              <span className="animate-pulse">|</span>
            </p>
            <button onClick={() => setShowAuth(true)} className="px-7 py-3 rounded-full text-sm font-semibold shadow-lg" style={{ backgroundColor: '#6A1E55', color: 'white' }}>
              Get Started
            </button>
          </div>
          <div className={`flex justify-center md:justify-end items-end md:items-center pr-6 md:pr-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <img src="/phone.png" alt="Phone" className="float-slow max-h-[72vh] md:max-h-[78vh] object-contain drop-shadow-2xl mr-8 md:mr-16 -translate-y-16" />
          </div>
        </div>

        {/* subtle bg blobs retained */}

        <aside
          className={`absolute left-6 md:left-12 w-[92%] md:w-[480px] rounded-3xl bg-[#3B1C32]/90 backdrop-blur-xl transition-all duration-700 ease-out overflow-hidden ${
            showAuth ? 'top-1/4 -translate-y-1/4 opacity-100' : 'bottom-6 md:bottom-12 translate-y-6 opacity-0 pointer-events-none'
          }`}
        >
          <div className="auth-scroll max-h-[60vh] min-h-[45vh] overflow-y-auto px-5 py-4 md:px-6 md:py-5 text-[14px]">
            <div className="mb-6">
              <h2 className="text-white text-2xl font-bold">Welcome</h2>
              <p className="text-white/70">Choose your role to continue</p>
            </div>

            {/* Role first */}
            <RoleSelector selectedRole={selectedRole} onRoleChange={setSelectedRole as any} />

            {/* No role selected yet */}
            {selectedRole === 'none' && (
              <div className="text-purple-200/80 text-sm mt-2">Please select a role to proceed.</div>
            )}

            {/* Admin: login only */}
            {selectedRole === 'admin' && (
              <div className="mt-4">
                <LoginForm selectedRole={'admin'} />
              </div>
            )}

            {/* Jobseeker: login or signup */}
            {selectedRole === 'jobseeker' && (
              <>
                <div className="flex gap-2 mt-4 mb-6 bg-purple-900/30 rounded-lg p-2">
                  <TabButton active={activeTab === 'login'} onClick={() => setActiveTab('login')}>Login</TabButton>
                  <TabButton active={activeTab === 'signup'} onClick={() => setActiveTab('signup')}>Sign Up</TabButton>
                </div>
                {activeTab === 'login' ? (
                  <LoginForm selectedRole={'jobseeker'} />
                ) : (
                  <SignupForm selectedRole={'jobseeker'} />
                )}
              </>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

