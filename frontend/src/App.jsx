import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Send, Bot, User, Loader2, Mail, Calendar, 
  CheckCircle, X, Layers, Cpu, Trash2, 
  Activity, Terminal, ShieldCheck, Video, Clock, Mic, MicOff, RefreshCw, Volume2, VolumeX, ExternalLink
} from 'lucide-react';

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [history, setHistory] = useState([]);
  const [chat, setChat] = useState([{ 
    role: 'bot', 
    content: 'Neural Core Online. Standing by for operations.' 
  }]);
  const [proposedPlan, setProposedPlan] = useState(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // --- 🔊 نظام النطق ---
  const speak = (text) => {
    if (!isVoiceActive) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const toggleVocalSystem = () => {
    if (isVoiceActive) {
      window.speechSynthesis.cancel();
      setIsVoiceActive(false);
      toast("Vocal System Offline", { icon: '🔇' });
    } else {
      setIsVoiceActive(true);
      setTimeout(() => speak("Vocal system active."), 100);
      toast("Vocal System Online", { icon: '🔊' });
    }
  };

  // --- 🎙️ نظام التعرف على الصوت ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (e) => setInput(e.results[0][0].transcript);
    }
  }, []);

  const toggleMic = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };

  // --- 🛠️ إدارة العمليات ---
  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/v1/operations/history');
      setHistory(res.data);
    } catch (e) { console.error("Database sync error"); }
  };

  const deleteLog = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/v1/operations/${id}`);
      setHistory(prev => prev.filter(log => log.id !== id));
      speak("Record purged.");
      toast.success("Log Deleted");
    } catch (e) { toast.error("Delete Failed"); }
  };

  const handleEdit = (log) => {
    try {
      const actions = JSON.parse(log.response_data);
      setProposedPlan(actions);
      speak("Reloading parameters.");
      toast.success("Ready for modification");
    } catch (e) { toast.error("Data Parse Error"); }
  };

  // --- 📡 معالجة الأوامر ---
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    const currentChat = [...chat, userMsg];
    setChat(currentChat);
    setLoading(true);
    const currentInput = input;
    setInput('');
    speak("Analyzing context.");

    try {
      const sanitizedHistory = chat
        .filter(m => m.content && m.content.trim() !== "")
        .map(m => ({ 
          role: m.role === 'bot' ? 'assistant' : 'user', 
          content: m.content 
        }));

      const res = await axios.post('http://127.0.0.1:8000/api/v1/operations/analyze', { 
        command: currentInput,
        history: sanitizedHistory 
      });

      const botMsg = res.data.assistant_message;
      setChat(prev => [...prev, { role: 'bot', content: botMsg }]);
      
      if (res.data.actions?.length > 0) {
        setProposedPlan(res.data.actions);
        speak("Plan ready for review.");
      } else {
        speak(botMsg);
      }
      fetchHistory();
    } catch (err) { 
      speak("Connection lost."); 
      toast.error("System Offline");
    } finally { 
      setLoading(false); 
    }
  };

  const executePlan = async () => {
    setLoading(true);
    speak("Executing confirmed sequence.");
    try {
      for (const action of proposedPlan) {
        const res = await axios.post('http://127.0.0.1:8000/api/v1/operations/execute-confirmed', {
          intent: action.tool,
          data: action.parameters
        });
        
        // التعامل مع حالة الجدولة الناجحة
        if (res.data.status === 'scheduled') {
          toast.success(res.data.message, { icon: '⏰' });
        }

        if (action.tool === 'schedule_meeting' && res.data.status === 'success') {
          setChat(prev => [...prev, { role: 'bot', type: 'meeting_card', data: res.data.execution_result }]);
        }
      }
      speak("Operation successful.");
      setProposedPlan(null);
      fetchHistory();
    } catch (err) { 
      speak("Execution failure."); 
      toast.error("Execution Error");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  // دالة مساعدة لتحديث المعاملات المتداخلة
  const updateParameter = (actionIdx, key, value, isNested = false) => {
    const copy = [...proposedPlan];
    if (isNested) {
      copy[actionIdx].parameters.parameters[key] = key === 'attendees' ? value.split(',').map(s => s.trim()) : value;
    } else {
      copy[actionIdx].parameters[key] = key === 'attendees' ? value.split(',').map(s => s.trim()) : value;
    }
    setProposedPlan(copy);
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden">
      <Toaster position="top-right" theme="dark" />
      
      {/* 🟢 SIDEBAR */}
      <aside className="w-80 bg-[#070e1e] border-r border-white/5 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 font-black text-white italic tracking-tighter">
            <Cpu size={20} className="text-blue-500 shadow-[0_0_10px_#3b82f6]" /> SMART.OPS
          </div>
          <button onClick={toggleVocalSystem} className={`p-2 rounded-lg transition-all ${isVoiceActive ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
            {isVoiceActive ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-2 mb-4">Neural Logs</p>
          {history.map((log) => (
            <div key={log.id} className="group bg-[#0f172a]/40 border border-white/5 p-4 rounded-2xl hover:border-blue-500/30 transition-all">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-blue-500 bg-blue-500/5 px-2 py-0.5 rounded uppercase">{log.intent}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(log)} className="p-1.5 hover:bg-blue-600/20 rounded-md text-slate-500"><RefreshCw size={12} /></button>
                  <button onClick={() => deleteLog(log.id)} className="p-1.5 hover:bg-red-600/20 rounded-md text-slate-500"><Trash2 size={12} /></button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 truncate italic">"{log.command}"</p>
            </div>
          ))}
        </div>
      </aside>

      {/* 🔵 MAIN PANEL */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_top_right,_#0f172a_0%,_#020617_60%)]">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#020617]/50 backdrop-blur-xl z-20">
           <div className={`w-2 h-2 rounded-full mr-3 animate-pulse ${isVoiceActive ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`}></div>
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Status: {isVoiceActive ? 'Vocal' : 'Silent'}</span>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-40 custom-scrollbar">
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-[2rem] rounded-tr-none px-6 py-4 shadow-xl shadow-blue-900/20' : ''}`}>
                {msg.content && <div className={`p-5 rounded-[2rem] text-sm leading-relaxed ${msg.role === 'bot' ? 'bg-[#0f172a]/80 backdrop-blur-md border border-white/5 rounded-tl-none text-slate-200' : ''}`}>{msg.content}</div>}
                {msg.type === 'meeting_card' && (
                  <div className="mt-4 bg-[#1e293b] border border-emerald-500/20 p-6 rounded-[2.5rem] shadow-2xl">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-emerald-500/20 rounded-2xl"><Calendar className="text-emerald-400" size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Confirmed</p>
                        <h4 className="text-white font-bold">{msg.data.details}</h4>
                      </div>
                    </div>
                    <a href={msg.data.meeting_link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all">Launch Meeting <ExternalLink size={14} /></a>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* ⌨️ INPUT */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center px-8 z-30">
          <div className="w-full max-w-3xl bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex gap-2 shadow-2xl">
            <input 
              className="flex-1 bg-transparent text-white px-8 text-sm outline-none placeholder:text-slate-600" 
              value={input} onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()} 
              placeholder="Enter neural command..." 
            />
            <button onClick={toggleMic} className={`p-4 rounded-full transition-all ${isListening ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'text-slate-500 hover:text-blue-500 hover:bg-white/5'}`}>
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button onClick={handleSend} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-[1.5rem] shadow-lg transition-all active:scale-95 flex items-center justify-center min-w-[56px]">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </main>

      {/* 🔴 VALIDATION MODAL (Updated for Scheduling) */}
      {proposedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-blue-500/20 w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative">
            <h2 className="text-xl font-black text-white mb-8 italic flex items-center gap-3">
              <Terminal size={20} className="text-blue-500" /> Confirm Operation
            </h2>
            <div className="space-y-6 mb-10 max-h-[45vh] overflow-y-auto custom-scrollbar pr-4">
              {proposedPlan.map((act, idx) => (
                <div key={idx} className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{act.tool}</div>
                    {act.tool === 'schedule_operation' && <Clock size={16} className="text-amber-500 animate-pulse" />}
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(act.parameters).map(([k, v]) => (
                      <div key={k}>
                        {/* إذا كان المعامل هو parameters (متداخل) */}
                        {k === 'parameters' ? (
                          <div className="mt-4 p-4 bg-black/20 rounded-2xl border border-white/5 space-y-4">
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Operation Data:</p>
                            {Object.entries(v).map(([nk, nv]) => (
                              <div key={nk}>
                                <label className="text-[9px] uppercase text-slate-600 font-black mb-1 block tracking-widest ml-1">{nk}</label>
                                <input className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-500" 
                                  value={Array.isArray(nv) ? nv.join(', ') : nv} 
                                  onChange={e => updateParameter(idx, nk, e.target.value, true)} 
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <label className="text-[9px] uppercase text-slate-600 font-black mb-1 block tracking-widest ml-1">{k}</label>
                            <input className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500" 
                              value={v} 
                              onChange={e => updateParameter(idx, k, e.target.value)} 
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setProposedPlan(null)} className="flex-1 py-4 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest">Abort</button>
              <button onClick={executePlan} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3">
                <ShieldCheck size={18} /> Authorize Deployment
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default App;