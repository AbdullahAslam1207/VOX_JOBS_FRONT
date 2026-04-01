import React, { useEffect, useState } from 'react';
import ErrorPopup from './ErrorPopup';
import {
  getMustaqbilCredentials,
  getProfilePictureDownloadUrl,
  getProfilePictureMetadata,
  getResumeDownloadUrl,
  getResumeMetadata,
  saveMustaqbilCredentials,
  getStoredProfile,
  getStoredUser,
  setStoredProfile,
  setStoredUser,
  uploadProfilePicture,
  uploadResume,
} from '../../api';

export default function UserProfile() {
  const user = getStoredUser();
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  const [resumeMeta, setResumeMeta] = useState<{ file_name: string; file_size: number; updated_at: string } | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeMsg, setResumeMsg] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePictureMeta, setProfilePictureMeta] = useState<{ file_name: string; updated_at: string } | null>(null);
  const [profilePictureLoading, setProfilePictureLoading] = useState(false);
  const [profilePictureMsg, setProfilePictureMsg] = useState('');
  const [mustaqbilEmail, setMustaqbilEmail] = useState('');
  const [mustaqbilPassword, setMustaqbilPassword] = useState('');
  const [mustaqbilMsg, setMustaqbilMsg] = useState('');
  const [mustaqbilSaving, setMustaqbilSaving] = useState(false);
  const [popupError, setPopupError] = useState('');

  useEffect(() => {
    const profile = getStoredProfile();
    if (profile?.fullname) setFullname(profile.fullname);
    if (profile?.phone) setPhone(profile.phone);
    if (profile?.city) setCity(profile.city);
    if (profile?.bio) setBio(profile.bio);
  }, []);

  useEffect(() => {
    const loadProfilePicture = async () => {
      if (!user?.email) return;
      try {
        const res = await getProfilePictureMetadata(user.email);
        setProfilePictureMeta({ file_name: res.file_name, updated_at: res.updated_at });
      } catch {
        setProfilePictureMeta(null);
      }
    };
    loadProfilePicture();
  }, [user?.email]);

  useEffect(() => {
    const loadMustaqbilCredentials = async () => {
      if (!user?.email) return;
      try {
        const res = await getMustaqbilCredentials(user.email);
        setMustaqbilEmail(res.mustaqbil_email || '');
        setMustaqbilPassword(res.mustaqbil_password || '');
      } catch {
        setMustaqbilEmail('');
        setMustaqbilPassword('');
      }
    };
    loadMustaqbilCredentials();
  }, [user?.email]);

  useEffect(() => {
    const loadResume = async () => {
      if (!user?.email) return;
      try {
        const res = await getResumeMetadata(user.email);
        setResumeMeta({
          file_name: res.file_name,
          file_size: res.file_size,
          updated_at: res.updated_at,
        });
      } catch {
        setResumeMeta(null);
      }
    };
    loadResume();
  }, [user?.email]);

  function saveProfile() {
    if (!user?.email) {
      setPopupError('Please login first.');
      return;
    }

    const nextProfile = { fullname, phone, city, bio };
    setStoredProfile(nextProfile);
    setStoredUser({ ...user, fullname });
    setProfileMsg('Profile updated successfully.');
    setTimeout(() => setProfileMsg(''), 2500);
  }

  async function onSaveMustaqbilCredentials() {
    if (!user?.email) {
      setPopupError('Please login first.');
      return;
    }
    if (!mustaqbilEmail.trim() || !mustaqbilPassword.trim()) {
      setPopupError('Please enter Mustaqbil email and password.');
      return;
    }

    setMustaqbilSaving(true);
    setMustaqbilMsg('');
    try {
      await saveMustaqbilCredentials({
        email: user.email,
        mustaqbil_email: mustaqbilEmail.trim(),
        mustaqbil_password: mustaqbilPassword,
      });
      setMustaqbilMsg('Mustaqbil credentials saved successfully.');
    } catch (err: any) {
      setPopupError(err?.message || 'Unable to save Mustaqbil credentials.');
    } finally {
      setMustaqbilSaving(false);
    }
  }

  async function onUploadResume() {
    if (!user?.email) {
      setPopupError('Please login first.');
      return;
    }
    if (!resumeFile) {
      setPopupError('Please select a PDF, DOC, or DOCX file.');
      return;
    }

    setResumeLoading(true);
    setResumeMsg('');
    try {
      await uploadResume(user.email, resumeFile);
      const updated = await getResumeMetadata(user.email);
      setResumeMeta({
        file_name: updated.file_name,
        file_size: updated.file_size,
        updated_at: updated.updated_at,
      });
      setResumeMsg('Resume uploaded successfully.');
      setResumeFile(null);
    } catch (err: any) {
      setPopupError(err?.message || 'Resume upload failed.');
    } finally {
      setResumeLoading(false);
    }
  }

  async function onUploadProfilePicture() {
    if (!user?.email) {
      setPopupError('Please login first.');
      return;
    }
    if (!profilePictureFile) {
      setPopupError('Please select a PNG, JPG, JPEG, or WEBP image.');
      return;
    }

    setProfilePictureLoading(true);
    setProfilePictureMsg('');
    try {
      await uploadProfilePicture(user.email, profilePictureFile);
      const updated = await getProfilePictureMetadata(user.email);
      setProfilePictureMeta({ file_name: updated.file_name, updated_at: updated.updated_at });
      setProfilePictureMsg('Profile picture uploaded successfully.');
      setProfilePictureFile(null);
    } catch (err: any) {
      setPopupError(err?.message || 'Profile picture upload failed.');
    } finally {
      setProfilePictureLoading(false);
    }
  }

  const resumeDownloadUrl = user?.email ? getResumeDownloadUrl(user.email) : '#';
  const profilePictureDownloadUrl = user?.email ? getProfilePictureDownloadUrl(user.email) : '#';

  return (
    <div className="p-6 md:p-8 text-white/90">
      <ErrorPopup message={popupError} onClose={() => setPopupError('')} />
      <h1 className="text-xl md:text-2xl font-semibold mb-5">Profile</h1>

      <section className="rounded-2xl p-6 border border-white/10 mb-6 bg-white/5">
        <h2 className="text-lg font-semibold mb-4">Update Profile</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Full Name</label>
            <input
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Email</label>
            <input
              value={user?.email || ''}
              readOnly
              className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none opacity-70"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none"
              placeholder="03xx-xxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none"
              placeholder="Lahore"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-white/70 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none min-h-24"
              placeholder="Short profile summary"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={saveProfile} className="px-4 py-2 rounded-md text-sm font-semibold bg-[#6A1E55] text-white">
            Save Profile
          </button>
          {profileMsg && <span className="text-sm text-emerald-300">{profileMsg}</span>}
        </div>
      </section>

      <section className="rounded-2xl p-6 border border-white/10 bg-white/5">
        <h2 className="text-lg font-semibold mb-4">Mustaqbil Credentials</h2>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Mustaqbil Email</label>
            <input
              value={mustaqbilEmail}
              onChange={(e) => setMustaqbilEmail(e.target.value)}
              className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Mustaqbil Password</label>
            <input
              type="password"
              value={mustaqbilPassword}
              onChange={(e) => setMustaqbilPassword(e.target.value)}
              className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none"
              placeholder="Enter password"
            />
          </div>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={onSaveMustaqbilCredentials}
            disabled={mustaqbilSaving}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-[#6A1E55] text-white disabled:opacity-60"
          >
            {mustaqbilSaving ? 'Saving...' : 'Save Mustaqbil Credentials'}
          </button>
          {mustaqbilMsg && <span className="text-sm text-emerald-300">{mustaqbilMsg}</span>}
        </div>

        <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={(e) => setProfilePictureFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <button
            onClick={onUploadProfilePicture}
            disabled={profilePictureLoading}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-[#6A1E55] text-white disabled:opacity-60"
          >
            {profilePictureLoading ? 'Uploading...' : 'Upload Picture'}
          </button>
        </div>

        {profilePictureMeta && (
          <div className="mb-4 text-sm text-white/80 space-y-1">
            <div>Current image: {profilePictureMeta.file_name}</div>
            <div>Last updated: {new Date(profilePictureMeta.updated_at).toLocaleString()}</div>
            <a href={profilePictureDownloadUrl} className="inline-block mt-1 underline text-white" target="_blank" rel="noreferrer">
              View Profile Picture
            </a>
          </div>
        )}

        {profilePictureMsg && <div className="mb-5 text-sm text-emerald-300">{profilePictureMsg}</div>}

        <h2 className="text-lg font-semibold mb-4">Resume</h2>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <button
            onClick={onUploadResume}
            disabled={resumeLoading}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-[#6A1E55] text-white disabled:opacity-60"
          >
            {resumeLoading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </div>

        {resumeMeta && (
          <div className="mt-4 text-sm text-white/80 space-y-1">
            <div>Current file: {resumeMeta.file_name}</div>
            <div>Size: {(resumeMeta.file_size / 1024).toFixed(1)} KB</div>
            <div>Last updated: {new Date(resumeMeta.updated_at).toLocaleString()}</div>
            <a href={resumeDownloadUrl} className="inline-block mt-1 underline text-white" target="_blank" rel="noreferrer">
              Download Resume
            </a>
          </div>
        )}

        {resumeMsg && <div className="mt-3 text-sm text-emerald-300">{resumeMsg}</div>}
      </section>
    </div>
  );
}
