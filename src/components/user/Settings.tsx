import React, { useState } from 'react';

export default function Settings() {
  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [currentResume, setCurrentResume] = useState('resume.pdf');
  const [newResume, setNewResume] = useState(null);
  const [newResumeFileName, setNewResumeFileName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF or Word document');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setNewResume(file);
      setNewResumeFileName(file.name);
    }
  };

  const handleSaveProfile = () => {
    // Validate required fields
    if (!fullName || !email) {
      alert('Please fill in all required fields');
      return;
    }

    console.log('Profile update:', { fullName, email, newResume: newResume?.name });
    
    // If new resume is uploaded, replace the current one
    if (newResume) {
      setCurrentResume(newResumeFileName);
      setNewResume(null);
      setNewResumeFileName('');
    }
    
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleSavePassword = () => {
    // Validate password fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    console.log('Password update:', { currentPassword, newPassword });
    
    // Clear password fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(false);
    alert('Password updated successfully!');
  };

  const handleDiscardResume = () => {
    setNewResume(null);
    setNewResumeFileName('');
  };

  return (
    <div className="p-6 md:p-8 text-white/90">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold mb-8">Profile Settings</h1>

        <div className="space-y-6">
          {/* Profile Information */}
          <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'linear-gradient(160deg, rgba(19,16,34,0.7), rgba(19,16,34,0.4))' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Personal Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                style={{ backgroundColor: isEditing ? '#6A1E55' : 'rgba(255,255,255,0.1)' }}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'linear-gradient(160deg, rgba(19,16,34,0.7), rgba(19,16,34,0.4))' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Password & Security</h2>
              <button
                onClick={() => setIsEditingPassword(!isEditingPassword)}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                style={{ backgroundColor: isEditingPassword ? '#6A1E55' : 'rgba(255,255,255,0.1)' }}
              >
                {isEditingPassword ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {isEditingPassword && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Confirm your new password"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setIsEditingPassword(false)}
                    className="px-6 py-3 rounded-lg font-medium text-sm border border-white/20 text-white/80 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePassword}
                    className="px-6 py-3 rounded-lg font-medium text-sm text-white transition-colors"
                    style={{ backgroundColor: '#6A1E55' }}
                  >
                    Update Password
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resume Section */}
          <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'linear-gradient(160deg, rgba(19,16,34,0.7), rgba(19,16,34,0.4))' }}>
            <h2 className="text-lg font-semibold mb-4">Resume/CV</h2>

            {/* Current Resume */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Current Resume
              </label>
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/20 bg-white/5">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white/90">{currentResume}</span>
                </div>
                <button className="text-blue-400 hover:text-blue-300 text-sm">
                  Download
                </button>
              </div>
            </div>

            {/* New Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Upload New Resume
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  id="newResume"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                  className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                />
                
                {newResumeFileName && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-green-400 text-sm">{newResumeFileName}</span>
                    </div>
                    <button
                      onClick={handleDiscardResume}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Discard
                    </button>
                  </div>
                )}
                
                <p className="text-xs text-white/60">
                  Upload your resume in PDF or Word format (max 5MB). This will replace your current resume.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-lg font-medium text-sm border border-white/20 text-white/80 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-6 py-3 rounded-lg font-medium text-sm text-white transition-colors"
                style={{ backgroundColor: '#6A1E55' }}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
