import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const Login = () => {
  const navigate = useNavigate();
  const [formData,setFormData]= useState({email:"",password:""});
  const {login} = useAuthStore();

  const handleSubmit = async(e)=>{
    e.preventDefault();
    try {
      await login(formData)
      navigate('/chat'); // Success ke baad chat page pe bhejo
    } catch (error) {
      console.error("Login Failed:", error);
    }
  }


  return (
    <div className="min-h-screen flex text-white">
      {/* Left Side: Brand side */}
      <div className="hidden lg:flex w-1/2 bg-indigo-900 items-center justify-center p-12">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">NEXA</h1>
          <p className="text-xl text-indigo-200">Welcome back! Sign in to continue your conversations.</p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 bg-zinc-950 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2">Login</h2>
          <p className="text-zinc-400 mb-8">Enter your credentials to access your account.</p>

          <form  onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input 
                type="email" 
                placeholder="Email Address" 
                onChange={(e)=> setFormData({...formData,email: e.target.value})}
                className="w-full bg-zinc-900 p-3 pl-10 rounded-lg border border-zinc-700 outline-none focus:border-indigo-500" 
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                onChange={(e)=> setFormData({...formData,password:e.target.value})}
                className="w-full bg-zinc-900 p-3 pl-10 rounded-lg border border-zinc-700 outline-none focus:border-indigo-500" 
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-indigo-500 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-colors">
              Login
            </button>
          </form>

          {/* Google Login */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-700"></div>
            <span className="text-zinc-500 text-sm">OR</span>
            <div className="flex-1 h-px bg-zinc-700"></div>
          </div>

          <button className="w-full p-3 border border-zinc-700 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-900 transition-colors">
            Login with Google
          </button>

          <p className="mt-6 text-center text-zinc-400 text-sm">
            Don't have an account? <Link to="/" className="text-indigo-500 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;