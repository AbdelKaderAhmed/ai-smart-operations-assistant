import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Send, Bot, User, Loader2, Mail, Calendar, 
  Sparkles, Terminal, History, CheckCircle, 
  Trash2, AlertTriangle, X, ChevronRight, Info, Bell
} from 'lucide-react';

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); 
  const [chat, setChat] = useState([{ 
    role: 'bot', 
    content: 'Hello! I am your AI Operations Assistant. How can I help you today?' 
  }]);
  
  // Modal States
  const [deleteId, setDeleteId] = useState(null);
  const [selectedOp, setSelectedOp] = useState(null);
  
  const chatEndRef = useRef(null);

  // Fetch operation logs from Backend
  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/v1/operations/history');
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to fetch history");
    }
  };

  // Handle record deletion
  const confirmDelete = async (e) => {
    e.stopPropagation(); 
    if (!deleteId) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/v1/operations/${deleteId}`);
      setHistory(prev => prev.filter(op => op.id !== deleteId));
      toast.success('Log entry removed');
    } catch (err) {
      toast.error('Deletion failed');
    } finally {
      setDeleteId(null);
    }
  };

  // Poll for history updates every 5 seconds
  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  // Send command to AI
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setChat(prev => [...prev, userMsg]);
    setLoading(true);
    setInput('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/v1/operations/analyze', { command: input });
      setChat(prev => [...prev, { role: 'bot', content: response.data.assistant_message }]);
      toast.success('AI Command Executed');
      fetchHistory(); 
    } catch (err) {
      toast.error('Backend connection lost');
      setChat(prev => [...prev, { role: 'bot', content: "Error: Is the Backend running?" }]);
    } finally { setLoading(false); }
  };

  // Helper to parse JSON safely for the modal
  const getParsedData = (data) => {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      return {};
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-slate-200 font-sans overflow-hidden">
      <Toaster position="top-right" />

      {/* 1. DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Delete Record?</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">This will permanently remove the operation log from the database.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 rounded-xl bg-slate-800 text-sm">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-sm font-bold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. OPERATION DETAILS MODAL (Synced with client.py fields) */}
      {selectedOp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-2">
                {selectedOp.intent === 'send_email' ? <Mail size={16} className="text-blue-400" /> : 
                 selectedOp.intent === 'schedule_meeting' ? <Calendar size={16} className="text-emerald-400" /> : 
                 <Bell size={16} className="text-amber-400" />}
                <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">
                  {selectedOp.intent.replace('_', ' ')} Report
                </h3>
              </div>
              <button onClick={() => setSelectedOp(null)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* EMAIL VIEW (Matches: recipient, subject, content) */}
              {selectedOp.intent === 'send_email' && (
                <div className="bg-slate-900/80 border border-blue-500/20 rounded-xl p-5 relative overflow-hidden font-sans">
                  <div className="absolute top-0 right-0 p-2 text-[8px] bg-blue-500/10 text-blue-400 uppercase font-bold tracking-tighter">--- 📧 SIMULATING EMAIL SENDING ---</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2 border-b border-slate-800 pb-2">
                      <span className="text-slate-500 w-20">To:</span>
                      <span className="text-blue-300 font-medium">{getParsedData(selectedOp.response_data).recipient || 'N/A'}</span>
                    </div>
                    <div className="flex gap-2 border-b border-slate-800 pb-2">
                      <span className="text-slate-500 w-20">Subject:</span>
                      <span className="text-slate-200 font-bold">{getParsedData(selectedOp.response_data).subject || 'No Subject'}</span>
                    </div>
                    <div className="pt-3 text-slate-400 leading-relaxed whitespace-pre-line">
                      {getParsedData(selectedOp.response_data).content || 'No content provided.'}
                    </div>
                  </div>
                </div>
              )}

              {/* MEETING VIEW (Matches: title, attendees, start_time) */}
              {selectedOp.intent === 'schedule_meeting' && (
                <div className="bg-slate-900/80 border border-emerald-500/20 rounded-xl p-5 relative overflow-hidden font-sans">
                   <div className="absolute top-0 right-0 p-2 text-[8px] bg-emerald-500/10 text-emerald-400 uppercase font-bold tracking-tighter">--- 📅 SIMULATING CALENDAR EVENT ---</div>
                   <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-emerald-500/20 p-3 rounded-lg text-emerald-400">
                          <Calendar size={24} />
                        </div>
                        <div>
                          <h4 className="text-slate-200 font-bold">{getParsedData(selectedOp.response_data).title || 'Meeting'}</h4>
                          <p className="text-slate-400 text-xs mt-1">
                            Attendees: <span className="text-emerald-300">
                              {Array.isArray(getParsedData(selectedOp.response_data).attendees) 
                                ? getParsedData(selectedOp.response_data).attendees.join(', ') 
                                : getParsedData(selectedOp.response_data).attendees || 'None'}
                            </span>
                          </p>
                          <p className="text-emerald-400 text-sm font-mono mt-2 italic">
                            Time: {getParsedData(selectedOp.response_data).start_time || 'TBD'}
                          </p>
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {/* NOTIFY TEAM VIEW (Matches: team_name, message, priority) */}
              {selectedOp.intent === 'notify_team' && (
                <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-5 relative overflow-hidden font-sans">
                   <div className="absolute top-0 right-0 p-2 text-[8px] bg-amber-500/10 text-amber-400 uppercase font-bold tracking-tighter">--- 🔔 TEAM NOTIFICATION ---</div>
                   <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-amber-500/30 text-amber-400 px-2 py-0.5 rounded uppercase font-bold border border-amber-500/20">
                          {getParsedData(selectedOp.response_data).priority || 'normal'}
                        </span>
                        <h4 className="text-slate-200 font-bold">Target: {getParsedData(selectedOp.response_data).team_name} Team</h4>
                      </div>
                      <p className="text-slate-400 text-sm italic">"{getParsedData(selectedOp.response_data).message}"</p>
                   </div>
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] text-slate-600 font-mono pt-2 border-t border-slate-800/50">
                <span>LOG_ID: {selectedOp.id}</span>
                <div className="flex items-center gap-1 text-green-500/70">
                  <CheckCircle size={10} /> STATUS: SUCCESSFUL
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="w-80 bg-[#111827] border-r border-slate-800 p-4 hidden lg:flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/20"><Sparkles size={20} className="text-white" /></div>
          <span className="font-bold text-xl tracking-tight text-white italic">Smart<span className="text-blue-500">Ops</span></span>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-2">Live Activity Log</div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
            {history.map((op) => (
              <div 
                key={op.id} 
                onClick={() => setSelectedOp(op)}
                className="group p-3 rounded-xl bg-slate-900/30 border border-slate-800/50 text-[11px] relative cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-blue-400 font-mono font-bold uppercase">{op.intent.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteId(op.id); }}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 p-1 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                    <ChevronRight size={12} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
                <div className="text-slate-500 truncate italic">"{op.command}"</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-600/5 border border-blue-500/10 rounded-xl">
          <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div> Database Synced
          </div>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col relative bg-[#0b0f1a]">
        <header className="h-16 border-b border-slate-800/50 flex items-center px-6 bg-[#0b0f1a]/80 backdrop-blur-xl sticky top-0 z-10">
          <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <Terminal size={14} className="text-blue-500" /> Neural Interface v1.0
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`flex gap-4 max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xl ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'}`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} className="text-blue-400" />}
                </div>
                <div className={`p-4 rounded-2xl leading-relaxed text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[#161b2a] border border-slate-800/50 text-slate-200 rounded-tl-none shadow-2xl'}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 items-center text-slate-500 text-[12px] font-medium animate-pulse ml-14">
              <Loader2 className="animate-spin text-blue-500" size={16} /> Orchestrating tools...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* INPUT BOX */}
        <div className="p-8 pt-0 bg-gradient-to-t from-[#0b0f1a] via-[#0b0f1a] to-transparent">
          <div className="max-w-4xl mx-auto relative">
            <input 
              className="w-full bg-[#161b2a] border border-slate-800/50 text-white rounded-2xl py-5 pl-6 pr-16 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-2xl placeholder:text-slate-600"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Send an email, schedule a meeting, or just chat..."
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="absolute right-3 top-3 bottom-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-5 rounded-xl transition-all flex items-center justify-center shadow-lg active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;