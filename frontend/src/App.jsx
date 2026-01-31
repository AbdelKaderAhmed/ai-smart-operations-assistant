import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Send, Bot, User, Loader2, Mail, Calendar, 
  Sparkles, Terminal, CheckCircle, 
  Trash2, AlertTriangle, X, ChevronRight, 
  Bell, Save, Settings, Layers, Cpu, Mic, MicOff
} from 'lucide-react';

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [history, setHistory] = useState([]); 
  const [chat, setChat] = useState([{ 
    role: 'bot', 
    content: 'Neural Interface Active. Systems ready for natural language orchestration.' 
  }]);
  
  const [deleteId, setDeleteId] = useState(null);
  const [selectedOp, setSelectedOp] = useState(null);
  const [editData, setEditData] = useState({});
  const [activeField, setActiveField] = useState('body'); 
  
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // --- 🎙️ SMART VOICE LOGIC ---
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Browser not supported");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US'; 
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      toast('Voice Active', { icon: '🎙️', style: { background: '#1e293b', color: '#3b82f6' } });
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      
      if (finalTranscript) {
        if (selectedOp) {
          const fieldKey = activeField === 'body' ? 'content' : activeField;
          setEditData(prev => ({
            ...prev,
            [fieldKey]: (prev[fieldKey] || '') + ' ' + finalTranscript
          }));
        } else {
          setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // --- API Handlers ---
  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/v1/operations/history');
      setHistory(response.data);
    } catch (err) { console.error("Sync Error"); }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/v1/operations/${deleteId}`);
      setHistory(prev => prev.filter(op => op.id !== deleteId));
      toast.success('Record purged');
    } catch (err) { toast.error('Purge failed'); }
    finally { setDeleteId(null); }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (isListening) recognitionRef.current?.stop();
    const userMsg = { role: 'user', content: input };
    setChat(prev => [...prev, userMsg]);
    setLoading(true);
    setInput('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/v1/operations/analyze', { command: input });
      setChat(prev => [...prev, { role: 'bot', content: response.data.assistant_message }]);
      fetchHistory(); 
    } catch (err) { toast.error('Link Offline'); }
    finally { setLoading(false); }
  };

  const handleFinalExecute = async () => {
    setLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/v1/operations/execute-confirmed', {
        intent: selectedOp.intent,
        data: editData 
      });
      toast.success(`Action dispatched!`);
      setChat(prev => [...prev, { role: 'bot', content: `✅ Verified: ${selectedOp.intent.replace('_',' ')} executed.` }]);
      setSelectedOp(null);
      fetchHistory();
    } catch (err) { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedOp) setEditData(typeof selectedOp.response_data === 'string' ? JSON.parse(selectedOp.response_data) : selectedOp.response_data);
  }, [selectedOp]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  return (
    <div className="flex h-screen bg-[#05070a] text-slate-300 font-sans overflow-hidden">
      <Toaster position="top-right" />

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-red-500/20 p-8 rounded-3xl max-w-sm w-full animate-in zoom-in-95">
            <div className="flex items-center gap-4 text-red-500 mb-6">
              <AlertTriangle size={28} />
              <h3 className="text-xl font-bold text-white">Confirm Purge</h3>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-3 rounded-xl bg-slate-800">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {selectedOp && (
        <div className="fixed inset-0 bg-[#05070a]/90 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
              <h3 className="font-bold text-white uppercase tracking-tight flex items-center gap-2"><Sparkles size={18} className="text-blue-400"/> Refine Intelligence</h3>
              <button onClick={() => setSelectedOp(null)} className="p-2 hover:bg-slate-800 rounded-full"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              {selectedOp.intent === 'send_email' ? (
                <div className="space-y-4">
                  <input className={`w-full bg-[#05070a] border ${activeField === 'recipient' ? 'border-blue-500 shadow-[0_0_10px_#3b82f633]' : 'border-slate-800'} rounded-2xl px-5 py-3 text-blue-300 outline-none`} onFocus={() => setActiveField('recipient')} value={editData.recipient || ''} onChange={(e) => setEditData({...editData, recipient: e.target.value})} placeholder="Recipient" />
                  <input className={`w-full bg-[#05070a] border ${activeField === 'subject' ? 'border-blue-500 shadow-[0_0_10px_#3b82f633]' : 'border-slate-800'} rounded-2xl px-5 py-3 text-white outline-none`} onFocus={() => setActiveField('subject')} value={editData.subject || ''} onChange={(e) => setEditData({...editData, subject: e.target.value})} placeholder="Subject" />
                  <textarea rows={6} className={`w-full bg-[#05070a] border ${activeField === 'body' ? 'border-blue-500 shadow-[0_0_10px_#3b82f633]' : 'border-slate-800'} rounded-2xl px-5 py-4 text-slate-300 outline-none resize-none`} onFocus={() => setActiveField('body')} value={editData.content || ''} onChange={(e) => setEditData({...editData, content: e.target.value})} placeholder="Message" />
                </div>
              ) : (
                <input className="w-full bg-[#05070a] border border-slate-800 rounded-2xl px-5 py-3 text-emerald-400 font-mono" value={editData.start_time || ''} onChange={(e) => setEditData({...editData, start_time: e.target.value})} />
              )}
            </div>
            <div className="p-6 border-t border-slate-800">
              <button onClick={handleFinalExecute} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />} Authorize Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR WITH DELETE BUTTON */}
      <aside className="w-80 bg-[#0a0f1a] border-r border-slate-800/50 flex flex-col relative z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2 rounded-xl"><Cpu size={22} className="text-white" /></div>
            <span className="font-black text-2xl tracking-tighter text-white italic">Smart<span className="text-blue-500">Ops</span></span>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 custom-scrollbar">
            <h4 className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] mb-4">Neural Logs</h4>
            {history.map((op) => (
              <div key={op.id} onClick={() => setSelectedOp(op)} className="group p-4 mb-2 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-blue-500/50 transition-all cursor-pointer relative">
                <div className="flex justify-between items-start mb-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${op.intent === 'send_email' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{op.intent.replace('_', ' ')}</span>
                  {/* --- 🔥 RE-ADDED DELETE BUTTON --- */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeleteId(op.id); }} 
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-slate-400 truncate italic">"{op.command}"</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-20 border-b border-slate-800/30 flex items-center px-10">
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div> Neural Interface Stable
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,1)_0%,_rgba(5,7,10,1)_100%)]">
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
              <div className={`flex gap-5 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-900 border border-slate-800'}`}>
                  {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-blue-400" />}
                </div>
                <div className={`p-5 rounded-3xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[#0f172a] border border-slate-800/50 text-slate-200 rounded-tl-none'}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* INPUT TERMINAL */}
        <div className="p-10 bg-gradient-to-t from-[#05070a]">
          <div className="max-w-4xl mx-auto relative group">
            <div className="relative flex items-center">
              <input 
                className={`w-full bg-[#0f172a] border border-slate-800/50 text-white rounded-[2rem] py-6 pl-8 pr-44 text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600 ${isListening && !selectedOp ? 'ring-2 ring-blue-500/20' : ''}`} 
                value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && handleSend()} 
                placeholder={isListening ? "Listening to Active Field..." : "Talk or type to deploy..."} 
              />
              <div className="absolute right-3 flex gap-2">
                <button onClick={handleVoiceInput} className={`p-4 rounded-2xl border ${isListening ? 'bg-red-500/20 text-red-500 border-red-500/50 animate-pulse' : 'bg-slate-800 text-blue-400 border-transparent hover:bg-slate-700'}`}>
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button onClick={handleSend} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-600/20">
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default App;