import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, CheckSquare } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const Signup=()=>{
  const navigate = useNavigate();
  
  const {signup} = useAuthStore();

  const [agreed, setAgreed] = useState(false);
  const [formData,setFormData] = useState({name:"",email:"",password:""})

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return; // Safety check

    try {
      // 3. Yahan 'signup' call karo
      await signup(formData); 
      
      console.log("SignUp Successful");
      navigate('/chat'); // Login ke bajaye seedha Chat par bhej do
    } catch (error) {
      console.error("Signup failed:", error);
      alert(error.message || "Something went wrong!");
    }
  };


  return (
    <div className="min-h-screen flex text-white">
      {/* Left Side: Background Visual */}
      <div className="hidden lg:flex w-1/2 bg-indigo-900 items-center justify-center p-12">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">NEXA</h1>
          <p className="text-xl text-indigo-200">Connect, Share, and Chat in Real-time.</p>
          {/* Yahan aap koi bhi cool abstract image ya illustration daal sakti hain */}
          <div className="mt-10 w-full h-64 bg-indigo-500/20 rounded-3xl backdrop-blur-sm border border-indigo-400/30"></div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="w-full lg:w-1/2 bg-zinc-950 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2">Create Account</h2>
          <p className="text-zinc-400 mb-8">Join NEXA today and start chatting!</p>

          <form onSubmit={handleSubmit} className="space-y-4  ">
            <div className="relative">
              <User className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input type="text" placeholder="Full Name" 
              onChange={(e)=>setFormData({...formData , name:e.target.value})}
              className="w-full bg-zinc-900 p-3 pl-10 rounded-lg border border-zinc-700 outline-none focus:border-indigo-500" />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input type="email" placeholder="Email Address"
              onChange={(e)=> setFormData({...formData,email:e.target.value})}
              className="w-full bg-zinc-900 p-3 pl-10 rounded-lg border border-zinc-700 outline-none focus:border-indigo-500" />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input type="password" placeholder="Password"
              onChange={(e)=> setFormData({...formData,password:e.target.value})}
              className="w-full bg-zinc-900 p-3 pl-10 rounded-lg border border-zinc-700 outline-none focus:border-indigo-500" />
            </div>

            {/* Mandatory Checkbox */}
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input 
                type="checkbox" 
                className="accent-indigo-500" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)} 
              />
              I agree to the Terms & Conditions (Required)
            </label>

            <button 
              disabled={!agreed}
              className={`w-full p-3 rounded-lg font-semibold ${agreed ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-zinc-700 cursor-not-allowed'}`}
            >
              Create Account
            </button>
          </form>

          {/* Google Sign-in */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-700"></div>
            <span className="text-zinc-500 text-sm">OR</span>
            <div className="flex-1 h-px bg-zinc-700"></div>
          </div>

          <button className="w-full p-3 border border-zinc-700 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-900">
            Sign up with Google
          </button>

          <p className="mt-6 text-center text-zinc-400 text-sm">
            Already have an account? <Link to="/login" className="text-indigo-500 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}


export default Signup;