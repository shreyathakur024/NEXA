import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import ProfileUpdate from "./pages/ProfileUpdate";
import Home from "./pages/Home";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import toast from 'react-hot-toast';

function App() {
  const {checkAuth,authUser,isCheckingAuth}=useAuthStore()

  useEffect(()=>{
    if (typeof checkAuth === 'function') {
      checkAuth();
    }
  },[ ]);

  useEffect(() => {
    if (authUser) {
      toast.success(`Welcome back, ${authUser.fullName || authUser.name || 'there'}!`);
    }
  }, [authUser]);

  if(isCheckingAuth) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={!authUser? <Login />: <Navigate to="/chat" />} />
        <Route path="/chat" element={authUser ? <Chat />: <Navigate to ="/login" />} />
        <Route path="/profile" element={authUser ? <ProfileUpdate /> : <Navigate to="/login"/>} />
      </Routes>
    </Router>
  );
}

export default App;