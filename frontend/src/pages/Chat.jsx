import React, { useState, useEffect, useRef } from 'react';
import { Search, Phone, Video, Send, Image as ImageIcon, MoreVertical, Sun, Moon, User, LogOut, X, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { socket } from '../lib/socket';
import toast from 'react-hot-toast';
import Peer from 'simple-peer';


const Chat = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isCalling, setIsCalling] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [stream, setStream] = useState();
  const [remoteStream, setRemoteStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerName, setCallerName] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callType, setCallType] = useState("video");
  

  const { logout, authUser } = useAuthStore();
  const { messages, getMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages, users, getUsers,searchUsers } = useChatStore();
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const streamRef = useRef();

  const getImageUrl = (value) => {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5004";
    return `${baseUrl}/${String(value).replace(/^\/+/, "")}`;
  };

  useEffect(() => {
    getUsers(); // Sidebar users fetch karne ke liye
  }, []);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      subscribeToMessages(selectedUser._id);
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser]);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);


  const handleLogout = async () => { await logout(); navigate('/login'); };

  const handleImageSend = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUser) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('text', messageText.trim());

    try {
      await sendMessage(selectedUser._id, formData);
      setMessageText("");
      toast.success('Image sent');
    } catch (error) {
      console.log(error);
      toast.error('Failed to send image');
    }

    event.target.value = "";
  };


  const callUser = (id, type = "video") => {
    setCallType(type);
    setIsCalling(true);
    const constraints = {
      video: type === "video",
      audio: true
    };
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      setStream(stream);
      streamRef.current = stream;
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
      });

      peer.on("signal", (data) => {
        // Backend ke "callUser" event ko emit kar rahe hain
        socket.emit("callUser", {
          userToCall: id,
          signalData: data,
          from: authUser._id,
          name: authUser.fullName,
          callType: type,
        });
      });

      peer.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      peer.on("connect", () => {
        console.log("Peer connection established (Initiator)!");
      });

      peer.on("error", (err) => {
        console.error("Peer error (Initiator):", err);
      });

      connectionRef.current = peer;
    }).catch((error) => {
      console.error("Failed to get media devices:", error);
      toast.error("Could not access camera/microphone.");
      setIsCalling(false);
    });
  };

  useEffect(() => {
    if (stream && myVideo.current) {
      myVideo.current.srcObject = stream;
    }
  }, [stream, callAccepted, isCalling]);

  useEffect(() => {
    if (remoteStream && userVideo.current) {
      userVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream, callAccepted, isCalling]);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const cleanupCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setRemoteStream(null);
    if (connectionRef.current) {
      try {
        connectionRef.current.destroy();
      } catch (err) {
        console.error("Error destroying peer connection:", err);
      }
      connectionRef.current = null;
    }
    setIsCalling(false);
    setCallAccepted(false);
    setReceivingCall(false);
    setCaller("");
    setCallerName("");
    setCallerSignal(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const endCall = () => {
    const otherUserId = selectedUser?._id || caller;
    if (otherUserId) {
      socket.emit("endCall", { to: otherUserId });
    }
    cleanupCall();
  };

  // Handle incoming call ringtone using Web Audio API
  useEffect(() => {
    let audioCtx;
    let ringInterval;

    const playRingtone = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioCtx = new AudioContext();

        const playRingPattern = () => {
          if (!audioCtx || audioCtx.state === 'closed') return;
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          osc1.frequency.value = 440;
          osc2.frequency.value = 480;

          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime + 1.2);
          gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.3);

          osc1.start();
          osc2.start();

          osc1.stop(audioCtx.currentTime + 1.4);
          osc2.stop(audioCtx.currentTime + 1.4);
        };

        playRingPattern();
        ringInterval = setInterval(playRingPattern, 3000);
      } catch (err) {
        console.error("Failed to play ringtone:", err);
      }
    };

    const stopRingtone = () => {
      if (ringInterval) {
        clearInterval(ringInterval);
        ringInterval = null;
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
        audioCtx = null;
      }
    };

    if (receivingCall && !callAccepted) {
      playRingtone();
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [receivingCall, callAccepted]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerName(data.name || "Unknown");
      setCallerSignal(data.signal);
      setCallType(data.callType || "video");
    };

    const handleCallAccepted = (signal) => {
      setCallAccepted(true);
      if (connectionRef.current) {
        connectionRef.current.signal(signal);
      }
    };

    const handleCallEnded = () => {
      toast.error("Call ended");
      cleanupCall();
    };

    socket.on("callUser", handleIncomingCall);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("endCall", handleCallEnded);

    return () => {
      socket.off("callUser", handleIncomingCall);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("endCall", handleCallEnded);
    };
  }, [socket]);

  const answerCall = () => {
    if (!callerSignal || !caller) {
      toast.error("No incoming call to answer.");
      return;
    }

    setCallAccepted(true);
    const constraints = {
      video: callType === "video",
      audio: true
    };
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      setStream(stream);
      streamRef.current = stream;
      const peer = new Peer({ initiator: false, trickle: false, stream: stream });

      peer.on("signal", (data) => {
        socket.emit("answerCall", { signal: data, to: caller });
      });

      peer.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      peer.on("connect", () => {
        console.log("Peer connection established (Receiver)!");
      });

      peer.on("error", (err) => {
        console.error("Peer error (Receiver):", err);
      });

      peer.signal(callerSignal);
      connectionRef.current = peer;
    }).catch((error) => {
      console.error("Failed to get media devices:", error);
      toast.error("Could not access camera/microphone.");
    });
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="h-screen flex bg-white dark:bg-zinc-950 text-black dark:text-white transition-colors">
        
        {/* Sidebar */}
        <aside className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
          <header className="p-4 border-b flex justify-between items-center">
            <h1 className="font-bold text-xl text-indigo-500">NEXA</h1>
            <div className="flex items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
              <div className="relative">
                <MoreVertical className="cursor-pointer" onClick={() => setShowMenu(!showMenu)} />
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-zinc-900 border rounded-lg shadow-xl z-50">
                    <button onClick={() => navigate('/profile')} className="w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"><User size={16}/> Profile</button>
                    <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"><LogOut size={16}/> Logout</button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full bg-zinc-100 dark:bg-zinc-900 p-2 pl-10 rounded-lg outline-none"
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);

                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }

                  if (!value.trim()) {
                    searchTimeoutRef.current = setTimeout(() => {
                      getUsers();
                    }, 250);
                    return;
                  }

                  searchTimeoutRef.current = setTimeout(() => {
                    searchUsers(value);
                  }, 250);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchUsers(searchTerm);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {users && users.length > 0 ? (
              users.map((user) => (
                <div 
                  key={user._id} 
                  onClick={() => setSelectedUser(user)} 
                  className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 ${selectedUser?._id === user._id ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden">
                    {user.profilePic || user.avatar ? (
                      <img src={getImageUrl(user.profilePic || user.avatar)} alt={user.fullName || user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(user.fullName || user.name || "U")?.[0]}</span>
                    )}
                  </div>
                  <div><p className="font-semibold">{user.fullName || user.name}</p><p className="text-xs text-zinc-500">Click to chat</p></div>
                </div>
              ))
            ) : (
              <p className="p-4 text-center text-zinc-500">No users found</p>
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-900">
          {selectedUser ? (
            <>
              <header className="p-4 border-b flex justify-between items-center cursor-pointer" onClick={() => setShowProfile(true)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden">
                    {selectedUser.profilePic || selectedUser.avatar ? (
                      <img src={getImageUrl(selectedUser.profilePic || selectedUser.avatar)} alt={selectedUser.fullName || selectedUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(selectedUser.fullName || selectedUser.name || "U")?.[0]}</span>
                    )}
                  </div>
                  <h2 className="font-semibold">{selectedUser.fullName || selectedUser.name}</h2>
                </div>
                {/* Line 225 ke pass icons ko update karo */}
                <div className="flex gap-4 text-indigo-500">
                  <Phone size={20} className="cursor-pointer" onClick={() => callUser(selectedUser._id, "voice")} />
                  <Video size={20} className="cursor-pointer" onClick={() => callUser(selectedUser._id, "video")} />
                </div>
              </header>
              

              {showProfile && (
                <div className="absolute top-16 right-4 w-60 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-2xl z-50">
                  <X className="ml-auto cursor-pointer" onClick={() => setShowProfile(false)} />
                  <div className="w-20 h-20 bg-indigo-600 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold mb-2 overflow-hidden">
                    {selectedUser.profilePic || selectedUser.avatar ? (
                      <img src={getImageUrl(selectedUser.profilePic || selectedUser.avatar)} alt={selectedUser.fullName || selectedUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(selectedUser.fullName || selectedUser.name || "U")?.[0]}</span>
                    )}
                  </div>
                  <h3 className="text-center font-bold">{selectedUser.fullName || selectedUser.name}</h3>
                </div>
              )}

              <div className="flex-1 p-6 overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg._id} className={`mb-4 flex ${msg.senderId === authUser._id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg max-w-xs overflow-hidden ${msg.senderId === authUser._id ? 'bg-indigo-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                      {msg.image ? (
                        <img src={msg.image} alt="sent attachment" className="max-w-full rounded-md mb-2" />
                      ) : null}
                      {msg.text ? <div>{msg.text}</div> : null}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={async (e) => { e.preventDefault(); if(!messageText.trim()) return;
               const formData = new FormData(); 
               formData.append('text', messageText); 
               await sendMessage(selectedUser._id, formData); 
               
               setMessageText(""); 
               toast.success('Message sent'); }} 

               className="p-4 border-t flex items-center gap-4">
                <input value={messageText} onChange={(e) => setMessageText(e.target.value)} type="text" placeholder="Type a message..." className="flex-1 bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg outline-none" />
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSend} />
                <button type="button" onClick={() => fileInputRef.current?.click()}><ImageIcon className="text-indigo-500" /></button>
                <button type="submit"><Send className="text-indigo-500" /></button>
              </form>

              {(isCalling || receivingCall || callAccepted) && (
  <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center px-4">
    {receivingCall && !callAccepted ? (
      <div className="bg-zinc-900 border border-zinc-800 text-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full">
        <div className="w-20 h-20 bg-indigo-600 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-4 overflow-hidden shadow-lg animate-bounce">
          {selectedUser?.profilePic || selectedUser?.avatar ? (
            <img src={getImageUrl(selectedUser.profilePic || selectedUser.avatar)} alt={selectedUser.fullName || selectedUser.name} className="w-full h-full object-cover" />
          ) : (
            <span>{(selectedUser?.fullName || selectedUser?.name || callerName)?.[0]}</span>
          )}
        </div>
        <p className="text-xl font-semibold text-white">Incoming {callType} call</p>
        <p className="mt-2 text-zinc-400">{callerName} is calling you...</p>
        <div className="mt-8 flex justify-center gap-4">
          <button onClick={answerCall} className="bg-green-500 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-white px-6 py-3 rounded-full font-semibold shadow-lg">Answer</button>
          <button onClick={endCall} className="bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-95 transition-all text-white px-6 py-3 rounded-full font-semibold shadow-lg">Decline</button>
        </div>
      </div>
    ) : (
      <>
        {callType === "video" ? (
          <div className="relative w-full max-w-4xl h-[75vh] md:h-[80vh] rounded-3xl overflow-hidden bg-zinc-950 shadow-2xl border border-zinc-800 flex items-center justify-center">
            {/* Remote Video (Full Screen inside container) */}
            {callAccepted && remoteStream ? (
              <video
                playsInline
                ref={userVideo}
                autoPlay
                className="w-full h-full object-cover rounded-3xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-500">
                <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-2xl font-semibold text-indigo-500 mb-3 animate-pulse">
                  {(selectedUser?.fullName || selectedUser?.name || callerName)?.[0]}
                </div>
                <p className="text-zinc-400">Connecting to {selectedUser?.fullName || selectedUser?.name || callerName}...</p>
              </div>
            )}

            {/* Local Video (Floating Picture-in-Picture) */}
            <div className="absolute top-4 right-4 w-28 md:w-44 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20 z-10 bg-zinc-900">
              <video
                playsInline
                muted
                ref={myVideo}
                autoPlay
                className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500 text-xs">
                  Camera Off
                </div>
              )}
            </div>

            {/* Caller Name and Connection Status Overlay */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-10 flex items-center gap-2 text-white">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                {selectedUser?.fullName || selectedUser?.name || callerName}
              </span>
            </div>

            {/* Floating Action Controls Overlay at the bottom */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/90 backdrop-blur-lg px-6 py-3 rounded-full border border-white/10 shadow-2xl z-10">
              {/* Mic Toggle Button */}
              <button
                type="button"
                onClick={toggleMute}
                className={`p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
                  isMuted
                    ? "bg-red-500 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Video Toggle Button */}
              <button
                type="button"
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
                  isVideoOff
                    ? "bg-red-500 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={endCall}
                className="p-3 bg-red-600 hover:bg-red-700 hover:scale-110 active:scale-95 text-white rounded-full transition-all duration-300 shadow-lg"
              >
                <PhoneOff size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-between p-8 bg-zinc-900 border border-zinc-800 rounded-3xl text-white shadow-2xl max-w-sm w-full h-[55vh] md:h-[60vh]">
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4 overflow-hidden ring-4 ring-indigo-500/20 shadow-xl">
                {selectedUser?.profilePic || selectedUser?.avatar ? (
                  <img src={getImageUrl(selectedUser.profilePic || selectedUser.avatar)} alt={selectedUser.fullName || selectedUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{(selectedUser?.fullName || selectedUser?.name || callerName)?.[0]}</span>
                )}
              </div>
              <p className="text-xl font-semibold text-white">{selectedUser?.fullName || selectedUser?.name || callerName}</p>
              <p className="text-sm text-zinc-400 mt-2.5 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {callAccepted ? "On-going Voice Call..." : "Calling..."}
              </p>
            </div>
            
            {/* Hidden media elements to handle/play stream */}
            <audio ref={myVideo} autoPlay muted style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }} />
            <audio ref={userVideo} autoPlay style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }} />

            {/* Voice call action controls */}
            <div className="flex items-center gap-4 bg-zinc-800/80 backdrop-blur px-6 py-3 rounded-full border border-white/5 shadow-xl w-full justify-center">
              <button
                type="button"
                onClick={toggleMute}
                className={`p-3 rounded-full transition-all duration-300 hover:scale-115 active:scale-95 ${
                  isMuted
                    ? "bg-red-500 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                type="button"
                onClick={endCall}
                className="p-3 bg-red-600 hover:bg-red-700 hover:scale-115 active:scale-95 text-white rounded-full transition-all duration-300 shadow-lg animate-pulse"
              >
                <PhoneOff size={20} />
              </button>
            </div>
          </div>
        )}
      </>
    )}
  </div>
)}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">Select a user to start conversation</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;