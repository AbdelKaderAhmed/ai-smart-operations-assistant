import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, Database, ChevronLeft, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/v1/operations/history')
      .then(res => setLogs(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200 p-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition">
          <ChevronLeft size={20} /> Back to Console
        </Link>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-3 text-white"><Database className="text-blue-500"/> Audit Logs</h1>
        </div>
        <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Action</th>
                <th className="p-4">Command Summary</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 text-slate-500 whitespace-nowrap"><Clock size={12} className="inline mr-2"/> {new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="p-4">
                    <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{log.action_type}</span>
                  </td>
                  <td className="p-4 text-slate-300 italic">"{log.command}"</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && !loading && <div className="p-10 text-center text-slate-600 italic">Database is empty. Execute a command first.</div>}
        </div>
      </div>
    </div>
  );
}
