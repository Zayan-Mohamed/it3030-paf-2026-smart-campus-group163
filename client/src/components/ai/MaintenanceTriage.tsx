import React, { useState, useRef, useEffect } from 'react';
import { Send, Wrench, User, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TicketDetails {
  category?: string;
  severity?: string;
  ticket_id?: string | number;
}

export function MaintenanceTriage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'What maintenance issue are you experiencing today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
  const [isFollowup, setIsFollowup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadId = useRef(`triage_${Math.random().toString(36).substring(7)}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/triage', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: userMessage, thread_id: threadId.current, is_followup: isFollowup }),
      });
      const data = await res.json();
      
      if (data.status === 'FOLLOW_UP_REQUIRED') {
        setIsFollowup(true);
        setMessages(prev => [...prev, { role: 'assistant', content: data.question }]);
      } else if (data.status === 'CATEGORIZED') {
        setIsFollowup(false); // Reset
        setTicketDetails(data);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Your issue has been logged as a ${data.severity} severity ${data.category} issue. Ticket ID: ${data.ticket_id}` 
        }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to the AI triage service.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-amber-600 p-4 text-white flex items-center space-x-3">
        <Wrench className="w-6 h-6" />
        <div>
          <h2 className="font-semibold text-lg">Maintenance Triage</h2>
          <p className="text-amber-100 text-sm">Stateful AI Routing</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-amber-100 ml-3' : 'bg-gray-200 mr-3'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-amber-600" /> : <Wrench className="w-5 h-5 text-gray-600" />}
              </div>
              <div className={`p-3 rounded-lg text-sm shadow-sm ${msg.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] flex-row">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-gray-600" />
              </div>
              <div className="p-3 rounded-lg bg-white border border-gray-100 rounded-tl-none shadow-sm flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-gray-400 text-sm">Analyzing issue...</span>
              </div>
            </div>
          </div>
        )}
        
        {ticketDetails && !isLoading && (
          <div className="mt-6 border border-green-200 bg-green-50 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-green-800">Ticket Created Successfully</h3>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                <li><strong>Category:</strong> {ticketDetails.category}</li>
                <li><strong>Severity:</strong> <span className={`font-semibold ${ticketDetails.severity === 'CRITICAL' ? 'text-red-600' : ''}`}>{ticketDetails.severity}</span></li>
                <li><strong>Ticket ID:</strong> {ticketDetails.ticket_id || 'N/A'}</li>
              </ul>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isFollowup ? "Answer the follow-up question..." : "E.g., The AC is leaking in Hall A..."}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            disabled={isLoading || (ticketDetails !== null && !isFollowup)}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || (ticketDetails !== null && !isFollowup)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}