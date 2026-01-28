import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2, Mail, Calendar, Sparkles, Terminal, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

function Console() {
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

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-slate-200 font-sans">
      <div className="w-64 bg-[#111827] border-r border-slate-800 p-4 hidden md:flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="bg-blue-600 p-1.5 rounded-lg"><Sparkles size={20} className="text-white" /></div>
          <span className="font-bold text-xl tracking-tight text-white">SmartAI</span>
        </div>
        <nav className="space-y-2 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Navigation</div>
          <Link to="/" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 text-sm shadow-sm"><Terminal size={18} /> Console</Link>
          <Link to="/logs" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition text-sm text-slate-400 hover:text-white"><Database size={18} /> Audit Logs</Link>
        </nav>
      </div>

      <div className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-slate-800 flex items-center px-6 bg-[#0b0f1a]/80 backdrop-blur-md sticky top-0">
          <h2 className="text-sm font-medium text-slate-400 flex items-center gap-2"><Terminal size={16} /> Operations Console</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#1e293b] text-slate-200 border border-slate-700'}`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="p-6 bg-[#0b0f1a]">
          <div className="max-w-3xl mx-auto relative">
            <input 
              className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:border-blue-500"
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your command..."
            />
            <button onClick={handleSend} className="absolute right-2 top-2 bottom-2 bg-blue-600 px-4 rounded-xl hover:bg-blue-500 transition"><Send size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Console;
