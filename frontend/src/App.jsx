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

  // --- 🔊 نظام الصوت ---
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

  // --- 🎙️ نظام الميكروفون ---
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

  // --- 🛠️ وظائف الحذف والتعديل (Operations) ---
  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/v1/operations/history');
      setHistory(res.data);
    } catch (e) { console.error("History fetch error"); }
  };

  const deleteLog = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/v1/operations/${id}`);
      setHistory(prev => prev.filter(log => log.id !== id));
      speak("Operation record purged from database.");
      toast.success("Log Deleted");
    } catch (e) { toast.error("Delete Failed"); }
  };

  const handleEdit = (log) => {
    try {
      const actions = JSON.parse(log.response_data);
      setProposedPlan(actions);
      speak("Reloading operation parameters for modification.");
      toast.success("Ready for Edit");
    } catch (e) { toast.error("Could not parse log data"); }
  };

  // --- 📡 معالجة الأوامر ---
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setChat(prev => [...prev, userMsg]);
    setLoading(true);
    const currentInput = input;
    setInput('');
    speak("Analyzing request.");

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/v1/operations/analyze', { command: currentInput });
      const botMsg = res.data.assistant_message;
      setChat(prev => [...prev, { role: 'bot', content: botMsg }]);
      
      if (res.data.actions?.length > 0) {
        setProposedPlan(res.data.actions);
        speak("Plan formulated. Human approval required.");
      } else {
        speak(botMsg);
      }
      fetchHistory();
    } catch (err) { speak("System link failure."); } finally { setLoading(false); }
  };

  const executePlan = async () => {
    setLoading(true);
    speak("Dispatching sequences.");
    try {
      for (const action of proposedPlan) {
        const res = await axios.post('http://127.0.0.1:8000/api/v1/operations/execute-confirmed', {
          intent: action.tool,
          data: action.parameters
        });
        if (action.tool === 'schedule_meeting' && res.data.status === 'success') {
          setChat(prev => [...prev, { role: 'bot', type: 'meeting_card', data: res.data.execution_result }]);
        }
      }
      speak("Mission accomplished.");
      setProposedPlan(null);
      fetchHistory();
    } catch (err) { speak("Execution error."); } finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 font-sans overflow-hidden">
      <Toaster position="top-right" theme="dark" />
      
      {/* 🟢 SIDEBAR: History with Edit & Delete */}
      <aside className="w-80 bg-[#070e1e] border-r border-white/5 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 font-black text-white italic tracking-tighter">
            <Cpu size={20} className="text-blue-500" /> SMART.OPS
          </div>
          <button onClick={toggleVocalSystem} className={`p-2 rounded-lg ${isVoiceActive ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
            {isVoiceActive ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">Operation Logs</p>
          {history.map((log) => (
            <div key={log.id} className="group bg-[#0f172a] border border-white/5 p-4 rounded-2xl hover:border-blue-500/40 transition-all">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-blue-400 uppercase">{log.intent}</span>
                <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(log)} className="p-1.5 bg-white/5 hover:bg-blue-600 rounded-md text-slate-400 hover:text-white" title="Edit/Re-run">
                    <RefreshCw size={12} />
                  </button>
                  <button onClick={() => deleteLog(log.id)} className="p-1.5 bg-white/5 hover:bg-red-600 rounded-md text-slate-400 hover:text-white" title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 truncate italic">"{log.command}"</p>
            </div>
          ))}
        </div>
      </aside>

      {/* 🔵 MAIN PANEL */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_top_right,_#0f172a_0%,_#020617_50%)]">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#020617]/50 backdrop-blur-md">
           <div className={`w-2 h-2 rounded-full mr-3 ${isVoiceActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Neural Link Active</span>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 pb-40 custom-scrollbar">
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-5 rounded-3xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#0f172a] border border-white/5 text-slate-200 shadow-2xl'}`}>
                <div className="text-sm leading-relaxed">{msg.content}</div>
                {msg.type === 'meeting_card' && (
                  <div className="mt-4 bg-[#1e293b] border border-emerald-500/20 p-6 rounded-[2rem] shadow-2xl">
                    <div className="text-emerald-400 text-[10px] font-black uppercase mb-2">Meeting Confirmed</div>
                    <h4 className="text-white font-bold mb-4">{msg.data.details}</h4>
                    <a href={msg.data.meeting_link} target="_blank" rel="noreferrer" className="block text-center bg-emerald-600 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all">Join Session</a>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* ⌨️ FLOATING INPUT */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center px-8">
          <div className="w-full max-w-3xl bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex gap-2 shadow-2xl">
            <input className="flex-1 bg-transparent text-white px-8 text-sm outline-none" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type mission command..." />
            <button onClick={toggleMic} className={`p-4 rounded-full transition-all ${isListening ? 'bg-red-500 text-white shadow-[0_0_15px_red]' : 'text-slate-500 hover:text-blue-500'}`}>
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full transition-all">
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>

      {/* 🔴 MODAL: Action Validation */}
      {proposedPlan && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-blue-500/20 w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-6 italic">RE-VALIDATE SEQUENCE</h2>
            <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto">
              {proposedPlan.map((act, idx) => (
                <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <div className="text-[10px] font-bold text-blue-400 uppercase mb-4">{act.tool}</div>
                  {Object.entries(act.parameters).map(([k, v]) => (
                    <div key={k} className="mb-3">
                      <label className="text-[9px] uppercase text-slate-600 block mb-1">{k}</label>
                      <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500" value={v} onChange={e => {
                        const copy = [...proposedPlan];
                        copy[idx].parameters[k] = e.target.value;
                        setProposedPlan(copy);
                      }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setProposedPlan(null)} className="flex-1 py-4 text-xs font-bold text-slate-500 uppercase">Cancel</button>
              <button onClick={executePlan} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2">
                <ShieldCheck size={18} /> Execute Modified Plan
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