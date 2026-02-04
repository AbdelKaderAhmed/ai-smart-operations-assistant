import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Send, Bot, User, Loader2, Mail, Calendar, 
  CheckCircle, X, Layers, Cpu, Trash2, 
  Activity, Terminal, ShieldCheck, Video, Clock, Mic, MicOff, RefreshCw, Volume2, VolumeX, ExternalLink, AlertTriangle, Fingerprint, Zap
} from 'lucide-react';

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [history, setHistory] = useState([]);
  const [chat, setChat] = useState([{ 
    role: 'bot', 
    content: 'SmartOps Neural Core Online. Encryption established. Standing by for operations.' 
  }]);
  const [proposedPlan, setProposedPlan] = useState(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // --- 🎙️ SmartOps Vocal System ---
  const speak = (text) => {
    if (!isVoiceActive) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const toggleVocalSystem = () => {
    if (isVoiceActive) {
      window.speechSynthesis.cancel();
      setIsVoiceActive(false);
      toast("Vocal Interface Terminated", { icon: '🔇', style: { background: '#0f172a', color: '#fff' } });
    } else {
      setIsVoiceActive(true);
      setTimeout(() => speak("SmartOps vocal system active."), 100);
      toast("Vocal Interface Online", { icon: '🔊', style: { background: '#0f172a', color: '#fff' } });
    }
  };

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

  // --- 📊 Core Operations ---
  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/v1/operations/history');
      setHistory(res.data);
    } catch (e) { console.error("SmartOps DB Sync Failure"); }
  };

  const deleteLog = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/v1/operations/${id}`);
      setHistory(prev => prev.filter(log => log.id !== id));
      speak("Operation record purged.");
      toast.success("Log Deleted");
    } catch (e) { toast.error("Purge Failed"); }
  };

  const handleEdit = (log) => {
    try {
      const actions = JSON.parse(log.response_data);
      setProposedPlan(actions);
      speak("Reloading operational parameters.");
      toast.success("Ready for modification");
    } catch (e) { toast.error("Data Parse Error"); }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input, timestamp: new Date().toLocaleTimeString() };
    setChat(prev => [...prev, userMsg]);
    setLoading(true);
    const currentInput = input;
    setInput('');
    speak("Analyzing operational vector.");

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
        speak("Operational plan ready for authorization.");
      } else {
        speak(botMsg);
      }
      fetchHistory();
    } catch (err) { 
      speak("SmartOps link failure."); 
      toast.error("System Offline");
    } finally { setLoading(false); }
  };

  const executePlan = async () => {
    setLoading(true);
    speak("Deploying confirmed sequence.");
    try {
      for (const action of proposedPlan) {
        const res = await axios.post('http://127.0.0.1:8000/api/v1/operations/execute-confirmed', {
          intent: action.tool,
          data: action.parameters
        });
        
        // 1. Scheduled Card
        if (res.data.status === 'scheduled') {
          setChat(prev => [...prev, { 
            role: 'bot', 
            type: 'scheduled_card', 
            data: {
                operation_type: action.parameters.operation_type,
                time: action.parameters.execution_time,
                target: action.parameters.parameters.recipient || action.parameters.parameters.attendees?.[0] || "Global Target"
            } 
          }]);
        } 
        // 2. Beautiful Email Success Card
        else if (action.tool === 'send_email' && res.data.status === 'success') {
          setChat(prev => [...prev, { 
            role: 'bot', 
            type: 'email_success_card', 
            data: {
              recipient: action.parameters.recipient,
              subject: action.parameters.subject
            } 
          }]);
        }
        // 3. Beautiful Meeting Success Card
        else if (action.tool === 'schedule_meeting' && res.data.status === 'success') {
          setChat(prev => [...prev, { 
            role: 'bot', 
            type: 'meeting_success_card', 
            data: res.data.execution_result 
          }]);
        }
        else if (res.data.status === 'success') {
          toast.success("Deployment Complete");
        }
      }
      speak("Mission successful.");
      setProposedPlan(null);
      fetchHistory();
    } catch (err) { 
      speak("Execution failure."); 
      toast.error(err.response?.data?.detail || "Execution Error");
    } finally { setLoading(false); }
  };

  const updateParameter = (actionIdx, key, value, isNested = false) => {
    const copy = [...proposedPlan];
    if (isNested) {
      copy[actionIdx].parameters.parameters[key] = key === 'attendees' ? value.split(',').map(s => s.trim()) : value;
    } else {
      copy[actionIdx].parameters[key] = key === 'attendees' ? value.split(',').map(s => s.trim()) : value;
    }
    setProposedPlan(copy);
  };

  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden">
      <Toaster position="top-right" />
      
      <aside className="w-80 bg-[#070e1e]/80 border-r border-white/5 flex flex-col hidden lg:flex backdrop-blur-xl">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                <Layers size={20} className="text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tighter uppercase">SmartOps</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2 mb-4">Neural Archives</p>
          {history.map((log) => (
            <div key={log.id} className="group bg-[#0f172a]/40 border border-white/5 p-4 rounded-2xl hover:border-blue-500/30 transition-all cursor-pointer">
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

      <main className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>
        
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#020617]/80 backdrop-blur-2xl z-20">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isVoiceActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Status: {isVoiceActive ? 'Vocal' : 'Encrypted'}</span>
                </div>
            </div>
            <button onClick={toggleVocalSystem} className={`p-3 rounded-xl transition-all border ${isVoiceActive ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-transparent border-white/5 text-slate-500'}`}>
                {isVoiceActive ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 pb-40 custom-scrollbar z-10">
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className="max-w-[85%] sm:max-w-[70%]">
                
                {msg.content && (
                  <div className={`p-5 rounded-[1.5rem] text-sm leading-relaxed border shadow-2xl ${
                    msg.role === 'user' 
                    ? 'bg-blue-700 border-blue-600 text-white rounded-tr-none' 
                    : 'bg-[#0f172a]/90 backdrop-blur-xl border-white/5 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                )}

                {/* 📧 Email Success Card */}
                {msg.type === 'email_success_card' && (
                  <div className="mt-4 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-blue-500/30 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-2 -top-2 text-blue-500/10 group-hover:rotate-12 transition-transform duration-500">
                      <Mail size={80} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg"><Send size={18} className="text-blue-400" /></div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Dispatch Success</span>
                      </div>
                      <h4 className="text-white font-bold mb-2">Email Transmitted</h4>
                      <div className="text-[11px] text-slate-400 space-y-1 bg-black/20 p-3 rounded-xl border border-white/5 font-mono">
                        <p><span className="text-slate-500">TO:</span> {msg.data.recipient}</p>
                        <p><span className="text-slate-500">SUB:</span> {msg.data.subject}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-emerald-500 uppercase">
                        <CheckCircle size={12} /> Encrypted Gateway Verified
                      </div>
                    </div>
                  </div>
                )}

                {/* 📅 Meeting Success Card */}
                {msg.type === 'meeting_success_card' && (
                  <div className="mt-4 bg-gradient-to-br from-[#064e3b]/20 to-[#020617] border border-emerald-500/30 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-2 -top-2 text-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
                      <Calendar size={80} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/20 rounded-lg"><Video size={18} className="text-emerald-400" /></div>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Neural Sync</span>
                      </div>
                      <h4 className="text-white font-bold mb-1">Meeting Established</h4>
                      <p className="text-xs text-slate-400 mb-4">{msg.data.details}</p>
                      <a href={msg.data.meeting_link} target="_blank" rel="noreferrer" 
                         className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20">
                        Launch Conference <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                )}

                {/* ⏳ Scheduled Card */}
                {msg.type === 'scheduled_card' && (
                  <div className="mt-4 bg-[#070e1e] border border-blue-500/30 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-blue-500/5 group-hover:scale-110 transition-transform">
                        <Fingerprint size={100} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                          {msg.data.operation_type === 'send_email' ? <Mail className="text-blue-400" size={22} /> : <Calendar className="text-emerald-400" size={22} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-blue-500 uppercase">SmartOps Locked</p>
                          <h4 className="text-white font-bold text-lg capitalize">{msg.data.operation_type.replace('_', ' ')}</h4>
                        </div>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold uppercase tracking-tighter">Execution:</span>
                          <span className="text-blue-300 font-mono">{msg.data.time}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold uppercase tracking-tighter">Target:</span>
                          <span className="text-slate-200 truncate">{msg.data.target}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="absolute bottom-10 left-0 right-0 flex justify-center px-10 z-30">
          <div className="w-full max-w-4xl bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 flex gap-2 shadow-2xl focus-within:border-blue-500/50 transition-all">
            <div className="flex items-center pl-6 text-slate-600"><Terminal size={18} /></div>
            <input 
              className="flex-1 bg-transparent text-white px-4 text-sm outline-none placeholder:text-slate-700" 
              value={input} onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()} 
              placeholder="Enter SmartOps command..." 
            />
            <button onClick={toggleMic} className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
               {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button onClick={handleSend} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-2xl shadow-lg transition-all font-black text-xs uppercase tracking-widest active:scale-95 flex items-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Execute"}
            </button>
          </div>
        </div>
      </main>

      {proposedPlan && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-blue-500/20 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
            <div className="flex items-center gap-4 mb-8">
                <Fingerprint size={32} className="text-blue-500" />
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Confirm Deployment</h2>
            </div>
            
            <div className="space-y-6 mb-10 max-h-[45vh] overflow-y-auto custom-scrollbar pr-4">
              {proposedPlan.map((act, idx) => (
                <div key={idx} className={`bg-white/5 p-6 rounded-[2rem] border ${act.tool === 'cancel_operation' ? 'border-red-500/30' : 'border-white/5'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{act.tool}</span>
                    <Zap size={14} className="text-blue-500" />
                  </div>
                  <div className="space-y-4">
                    {Object.entries(act.parameters).map(([k, v]) => (
                      <div key={k}>
                        {k === 'parameters' ? (
                          <div className="mt-4 p-5 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                            {Object.entries(v).map(([nk, nv]) => (
                              <div key={nk}>
                                <label className="text-[9px] uppercase text-slate-500 font-black mb-1 block ml-1">{nk}</label>
                                <input className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white outline-none focus:border-blue-500 transition-all font-mono" 
                                  value={Array.isArray(nv) ? nv.join(', ') : nv} 
                                  onChange={e => updateParameter(idx, nk, e.target.value, true)} 
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <label className="text-[9px] uppercase text-slate-600 font-black mb-1 block ml-1">{k}</label>
                            <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500 font-mono" 
                              value={v} onChange={e => updateParameter(idx, k, e.target.value)} 
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
              <button onClick={() => setProposedPlan(null)} className="flex-1 py-4 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Abort</button>
              <button onClick={executePlan} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
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