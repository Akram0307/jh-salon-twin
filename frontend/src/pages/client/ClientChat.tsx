import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, User, Bot, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

const ClientChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! I am the Jawed Habib digital receptionist. How can I help you today?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock sender phone number for testing
  const senderPhone = '+1234567890';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat`, {
        message: userMsg.text,
        sender: senderPhone
      });
      
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: response.data.response || 'Sorry, I encountered an error.', 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: 'Network error. Please ensure the backend server is running.', 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b flex items-center shadow-sm z-10">
        <div className="bg-gradient-to-tr from-pink-500 to-orange-400 p-2 rounded-full mr-3">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-800 text-lg">Jawed Habib Kurnool</h1>
          <p className="text-xs text-green-500 font-medium flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Online
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                msg.sender === 'user' ? 'bg-blue-100 ml-2' : 'bg-pink-100 mr-2'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4 text-blue-600" /> : <Bot className="w-4 h-4 text-pink-600" />}
              </div>
              <div className={`px-4 py-2 rounded-2xl text-sm ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] flex-row">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-pink-100 mr-2 flex items-center justify-center">
                <Bot className="w-4 h-4 text-pink-600" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm rounded-tl-none flex space-x-1 items-center">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t">
        <form onSubmit={handleSend} className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-700"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="ml-2 text-blue-600 disabled:text-gray-400 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClientChat;
