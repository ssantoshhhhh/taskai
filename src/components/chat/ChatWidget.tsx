
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import botLogo from '../../assets/taskai-bot-removebg.png';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your AI assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

      if (!N8N_WEBHOOK_URL) {
        throw new Error('Configuration Config: VITE_N8N_WEBHOOK_URL is not set. Please restart the dev server.');
      }

      console.log('Sending to n8n:', N8N_WEBHOOK_URL);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        let errorDetails = response.statusText;
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || JSON.stringify(errorData);
        } catch (e) {
          // Cannot parse json, ignore
        }
        throw new Error(`Server Error: ${response.status} - ${errorDetails}`);
      }

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If n8n sends plain text
        data = { output: await response.text() };
      }

      // Handle array response (common in n8n) or object response
      const responseData = Array.isArray(data) ? data[0] : data;

      // Look for common output fields, prioritize 'output' then 'text' then 'message'
      // Also check for nested 'json' property which sometimes happens in n8n raw output
      const candidates = [
        responseData.output,
        responseData.message,
        responseData.text,
        responseData.response,
        responseData.content,
        responseData.json?.output, // Nested json
        typeof responseData === 'string' ? responseData : null
      ];

      const botResponse = candidates.find(c => c && typeof c === 'string') || JSON.stringify(responseData);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat Error:', error);

      let errorText = "Sorry, I'm having trouble reading the response.";
      if (error instanceof Error) {
        errorText = `Error: ${error.message}`;
        if (error.message.includes('Failed to fetch')) {
          errorText = "Network Error: Could not reach n8n. Check CORS settings in your n8n Webhook node.";
        }
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed top-4 right-4 lg:top-auto lg:bottom-6 lg:right-6 z-[60] flex flex-col items-end pointer-events-none p-4 lg:p-0">
      {/* Chat Window */}
      <div
        className={cn(
          "mb-4 w-full max-w-[320px] sm:w-[380px] pointer-events-auto transition-all duration-300 transform origin-top-right lg:origin-bottom-right",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 -translate-y-10 lg:translate-y-10 hidden"
        )}
      >
        <Card className="border-white/10 shadow-2xl overflow-hidden bg-[#0a0a0a] border">
          {/* Header */}
          <CardHeader className="p-4 border-b border-white/5 bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-md flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-sm opacity-50 rounded-full"></div>
                <div className="bg-white border border-white/20 p-1 rounded-full relative z-10">
                  <img src={botLogo} alt="AI" className="w-8 h-8 object-contain" />
                </div>
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-1">
                  AI Assistant
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block ml-1"></span>
                </CardTitle>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Online</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="p-0 bg-[#0a0a0a]">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 text-sm group",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-white/10 shadow-sm",
                        msg.role === 'user' ? "bg-purple-600" : "bg-black"
                      )}
                    >
                      {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <div className="p-1 bg-white rounded-full"><img src={botLogo} alt="AI" className="w-4 h-4 object-contain" /></div>}
                    </div>

                    <div className="flex flex-col gap-1 max-w-[80%]">
                      <div
                        className={cn(
                          "p-3 rounded-2xl shadow-sm",
                          msg.role === 'user'
                            ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-tr-none"
                            : "bg-white/5 border border-white/5 text-gray-200 rounded-tl-none"
                        )}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-600 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-white border border-white/10 flex items-center justify-center flex-shrink-0 p-1">
                      <img src={botLogo} alt="AI" className="w-6 h-6 object-contain" />
                    </div>
                    <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 h-[42px]">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input Area */}
          <CardFooter className="p-3 bg-[#0a0a0a] border-t border-white/10 backdrop-blur-sm">
            <div className="flex w-full gap-2 relative">
              <Input
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-cyan-500/50 pr-10"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-1 top-1 h-8 w-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-opacity rounded-md"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className={cn(
          "rounded-full h-14 w-14 shadow-[0_0_20px_rgba(147,51,234,0.5)] pointer-events-auto transition-all duration-500 hover:scale-110",
          isOpen
            ? "rotate-90 bg-gray-800 text-white hover:bg-gray-700"
            : "bg-gradient-to-r from-purple-600 to-pink-600 text-white animate-pulse-slow"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <img src={botLogo} alt="AI" className="w-10 h-10 object-contain drop-shadow-sm transition-transform hover:scale-110" />}
      </Button>
    </div>
  );
}
