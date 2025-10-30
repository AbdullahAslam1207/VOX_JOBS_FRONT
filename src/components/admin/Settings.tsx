import React, { useState } from 'react';

export default function AdminSettings() {
  const [fullName, setFullName] = useState('Admin User');
  const [email, setEmail] = useState('admin@voxjobs.com');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = () => {
    // Validate required fields
    if (!fullName || !email) {
      alert('Please fill in all required fields');
      return;
    }

    console.log('Admin profile update:', { fullName, email });
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

    console.log('Admin password update:', { currentPassword, newPassword });
    
    // Clear password fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingPassword(false);
    alert('Password updated successfully!');
  };

  return (
    <div className="p-6 md:p-8 text-white/90">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold mb-8">Admin Settings</h1>

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

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value="Administrator"
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white/50 cursor-not-allowed"
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

          {/* Admin Preferences */}
          <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'linear-gradient(160deg, rgba(19,16,34,0.7), rgba(19,16,34,0.4))' }}>
            <h2 className="text-lg font-semibold mb-4">Admin Preferences</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white/90">Email Notifications</h3>
                  <p className="text-xs text-white/60">Receive notifications for new job applications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white/90">Auto-approve Jobs</h3>
                  <p className="text-xs text-white/60">Automatically approve job postings from verified employers</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
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

