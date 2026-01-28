import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2, Mail, Calendar, Sparkles, Terminal } from 'lucide-react';

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([{ role: 'bot', content: 'Hello! I am your AI Operations Assistant. How can I help you today?' }]);
  const chatEndRef = useRef(null);

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
    } catch (err) {
      setChat(prev => [...prev, { role: 'bot', content: "Connection error. Is the Backend running?" }]);
    } finally { setLoading(false); }
  };

 
  const quickAction = (text) => {
    setInput(text);
  };

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-slate-200 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#111827] border-r border-slate-800 p-4 hidden md:flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="bg-blue-600 p-1.5 rounded-lg"><Sparkles size={20} className="text-white" /></div>
          <span className="font-bold text-xl tracking-tight text-white">SmartAI</span>
        </div>
        
        <nav className="space-y-2 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Quick Actions</div>
          
          <button 
            onClick={() => quickAction("Send an email to Khalid about the project update")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-blue-600/10 hover:text-blue-400 border border-transparent hover:border-blue-900/50 transition-all text-sm group"
          >
            <Mail size={18} className="text-slate-400 group-hover:text-blue-400" /> 
            <span>Send Email</span>
          </button>

          <button 
            onClick={() => quickAction("Schedule a meeting with Sarah tomorrow at 10 AM")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-emerald-600/10 hover:text-emerald-400 border border-transparent hover:border-emerald-900/50 transition-all text-sm group"
          >
            <Calendar size={18} className="text-slate-400 group-hover:text-emerald-400" /> 
            <span>Schedule</span>
          </button>
        </nav>

        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> 
            Backend Online
          </div>
          <div className="text-[10px] text-slate-500">Port: 8000 | Llama 3.1</div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center px-6 bg-[#0b0f1a]/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Terminal size={16} /> Operations Console
          </h2>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`flex gap-4 max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[#1e293b] border border-slate-700 text-slate-200 rounded-tl-none'}`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 items-center text-slate-500 text-sm animate-pulse">
              <Loader2 className="animate-spin" size={16} /> AI is processing...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-[#0b0f1a] via-[#0b0f1a] to-transparent">
          <div className="max-w-3xl mx-auto relative group">
            <input 
              className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xl placeholder:text-slate-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me to send an email or schedule a meeting..."
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl transition-colors shadow-lg flex items-center justify-center"
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