import React, { useState, useEffect, useRef } from 'react';
import { Camera, User, ArrowLeft, X, Image as ImageIcon, Smile } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../service/userService';

const ProfileUpdate = () => {

  const navigate = useNavigate();

  const { authUser, getProfile, updateProfile: updateAuthProfile } = useAuthStore();
  const [image, setImage] = useState(null);
  const [name, setName] = useState(authUser?.fullName || authUser?.name || '');
  const [bio, setBio] = useState(authUser?.bio || '');
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!authUser) {
      getProfile();
    }
  }, [authUser, getProfile]);

  useEffect(() => {
    if (authUser) {
      setName(authUser.fullName || authUser.name || '');
      setBio(authUser.bio || '');
    }
  }, [authUser]);

  const profileImage = image
    ? URL.createObjectURL(image)
    : authUser?.profilePic || authUser?.avatar || "";

  return (
    <div className="h-screen bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl relative">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <ArrowLeft onClick={() => navigate('/Chat')} className="cursor-pointer" size={24} />
          <h2 className="text-2xl font-bold">Edit Profile</h2>
        </div>

        {/* Profile Pic Section */}
        <div className="flex flex-col items-center mb-8">
          <div 
            className="relative w-32 h-32 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowOptions(true)}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={64} className="text-zinc-500" />
            )}
            <div className="absolute bottom-2 right-2 bg-indigo-600 p-2 rounded-full text-white">
              <Camera size={16} />
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-500">Click avatar to change</p>
        </div>

        {/* Input Fields */}
        <form className="space-y-6">
          <div className="relative">
            <label className="text-sm text-zinc-500 block mb-1">Profile Image</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          <div className="relative">
            <label className="text-sm text-zinc-500 block mb-1">Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-700 p-2 outline-none focus:border-indigo-500 transition-colors" 
              placeholder="Enter your name" 
            />
          </div>
          
          <div className="relative">
            <label className="text-sm text-zinc-500 block mb-1">Bio</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-700 p-2 outline-none focus:border-indigo-500 transition-colors resize-none" 
              placeholder="Enter your bio" 
              rows="2"
            />
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                const formData = new FormData();
                if (image) formData.append('profilePic', image);
                formData.append('name', name);
                formData.append('bio', bio);
                const updatedUser = await updateProfile(formData);
                await updateAuthProfile(updatedUser);
                toast.success('Profile updated');
              } catch (error) {
                console.log(error);
                toast.error('Failed to update profile');
              }
            }}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all mt-4"
          >
            Save Profile
          </button>
        </form>

        {/* Modal (Popup) */}
        {showOptions && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4 rounded-3xl">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl w-full max-w-xs shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Change Photo</h3>
                <X size={20} className="cursor-pointer" onClick={() => setShowOptions(false)} />
              </div>
              
              <div className="space-y-2">
                <button 
                  className="w-full flex items-center gap-3 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  onClick={() => { fileInputRef.current.click(); setShowOptions(false); }}
                >
                  <ImageIcon size={20} /> Upload Image
                </button>
                <button 
                  className="w-full flex items-center gap-3 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  onClick={() => alert("Avatar selection menu...")}
                >
                  <Smile size={20} /> Select Avatar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Input */}
        <input type="file" ref={fileInputRef} hidden onChange={(e) => setImage(e.target.files?.[0] || null)} />

      </div>
    </div>
  );
};

export default ProfileUpdate;