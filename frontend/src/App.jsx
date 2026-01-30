import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Send, Bot, User, Loader2, Mail, Calendar, 
  Sparkles, Terminal, History, CheckCircle, 
  Bell, Trash2 
} from 'lucide-react';

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); 
  const [chat, setChat] = useState([{ 
    role: 'bot', 
    content: 'Hello! I am your AI Operations Assistant. How can I help you today?' 
  }]);
  const chatEndRef = useRef(null);

  
  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/v1/operations/history');
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to fetch history");
    }
  };

  
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/v1/operations/${id}`);
      // تحديث الواجهة محلياً فوراً
      setHistory(prev => prev.filter(op => op.id !== id));
    } catch (err) {
      console.error("Failed to delete operation:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000); 
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom() }, [chat]);

  
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setChat(prev => [...prev, userMsg]);
    setLoading(true);
    setInput('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/v1/operations/analyze', { command: input });
      setChat(prev => [...prev, { role: 'bot', content: response.data.assistant_message }]);
      fetchHistory(); 
    } catch (err) {
      setChat(prev => [...prev, { role: 'bot', content: "Connection error. Is the Backend running?" }]);
    } finally { setLoading(false); }
  };

  const quickAction = (text) => setInput(text);

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-slate-200 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-80 bg-[#111827] border-r border-slate-800 p-4 hidden lg:flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="bg-blue-600 p-1.5 rounded-lg"><Sparkles size={20} className="text-white" /></div>
          <span className="font-bold text-xl tracking-tight text-white">SmartAI</span>
        </div>
        
        {/* Quick Actions */}
        <nav className="space-y-2 mb-8">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Quick Actions</div>
          <button onClick={() => quickAction("Send an email to Khalid about the project update")} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-600/10 hover:text-blue-400 transition-all text-sm group">
            <Mail size={16} className="text-slate-400 group-hover:text-blue-400" /> <span>Send Email</span>
          </button>
          <button onClick={() => quickAction("Schedule a meeting with Sarah tomorrow at 10 AM")} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-emerald-600/10 hover:text-emerald-400 transition-all text-sm group">
            <Calendar size={16} className="text-slate-400 group-hover:text-emerald-400" /> <span>Schedule</span>
          </button>
        </nav>

        {/* Live Logs (Database History) with Delete Button */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
            <History size={14} /> Recent Operations
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
            {history.map((op) => (
              <div key={op.id} className="group p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px] relative transition-all hover:border-slate-700">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-blue-400 font-mono uppercase font-semibold">{op.intent.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={12} className="text-green-500" />
                    <button 
                      onClick={() => handleDelete(op.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-all p-1 hover:bg-red-500/10 rounded"
                      title="Delete log"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="text-slate-400 italic line-clamp-1 pr-4">"{op.command}"</div>
                <div className="text-[9px] text-slate-600 mt-2 flex justify-between">
                  <span>{new Date(op.created_at).toLocaleTimeString()}</span>
                  <span className="text-[8px] opacity-50">#{op.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backend Status */}
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 mt-4">
          <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Backend Online
          </div>
          <div className="text-[10px] text-slate-500">Port: 8000 | SQLite Active</div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#0b0f1a]">
        <header className="h-16 border-b border-slate-800 flex items-center px-6 bg-[#0b0f1a]/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Terminal size={16} /> Operations Console
          </h2>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`flex gap-4 max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 shadow-lg shadow-blue-900/20' : 'bg-slate-800 border border-slate-700'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[#1e293b] border border-slate-700 text-slate-200 rounded-tl-none shadow-xl'}`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 items-center text-slate-500 text-sm animate-pulse ml-12">
              <Loader2 className="animate-spin" size={16} /> AI is thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Field */}
        <div className="p-6">
          <div className="max-w-3xl mx-auto relative group">
            <input 
              className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xl placeholder:text-slate-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a command (e.g., 'Schedule meeting with Ahmed')..."
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-4 rounded-xl transition-colors shadow-lg flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-600 mt-3 uppercase tracking-widest">Powered by Groq & Llama 3.1</p>
        </div>
      </div>
    </div>
  );
}

export default App;