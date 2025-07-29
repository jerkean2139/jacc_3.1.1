import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, MicOff, Calculator, TrendingUp, BarChart3, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MessageContent } from "./message-content";
// Types for messages
interface MessageWithActions {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
  actions?: Array<{
    type: "document_link" | "search_query" | "export";
    label: string;
    url?: string;
    query?: string;
  }>;
}

interface ChatInterfaceProps {
  chatId: string | null;
  onNewChatWithMessage?: (message: string) => Promise<void>;
  onChatUpdate: () => void;
  isDemo?: boolean;
}

export default function ChatInterface({
  chatId,
  onNewChatWithMessage,
  onChatUpdate,
  isDemo = false,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();



  // Optimized message fetching with intelligent caching
  const { data: messages = [], isLoading, error, refetch } = useQuery<MessageWithActions[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId,
    staleTime: 10000, // Cache for 10 seconds - balance between freshness and performance
    gcTime: 120000, // Keep in cache for 2 minutes
    refetchOnMount: "always", // Always refetch when mounting to get latest data
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: 1, // Only retry once on failure
    queryFn: async () => {
      const startTime = performance.now();
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const data = await response.json();
      const endTime = performance.now();
      
      // Only log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Messages fetched in ${Math.round(endTime - startTime)}ms:`, {
          count: Array.isArray(data) ? data.length : 0,
          chatId: chatId?.substring(0, 8)
        });
      }
      
      return Array.isArray(data) ? data : [];
    },
  });

// Define conversation starters
const conversationStarters = [
  {
    id: "rates",
    icon: Calculator,
    text: "I need help calculating processing rates and finding competitive pricing",
    color: "bg-blue-600 hover:bg-blue-700"
  },
  {
    id: "compare", 
    icon: BarChart3,
    text: "I need to compare payment processors - can you help me analyze different options?",
    color: "bg-green-600 hover:bg-green-700"
  },
  {
    id: "proposal",
    icon: TrendingUp,
    text: "Help me create a professional proposal for a new merchant",
    color: "bg-orange-600 hover:bg-orange-700"
  },
  {
    id: "marketing",
    icon: Brain,
    text: "Let's Talk Marketing",
    color: "bg-purple-600 hover:bg-purple-700"
  }
];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle sending messages
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    setIsProcessing(true);
    try {
      if (!chatId && onNewChatWithMessage) {
        await onNewChatWithMessage(messageText);
      } else if (chatId) {
        await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            content: messageText,
            role: 'user'
          })
        });
        refetch();
        onChatUpdate();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    const messageText = input.trim();
    setInput("");
    await sendMessage(messageText);
  };

  const handleConversationStarter = async (text: string) => {
    await sendMessage(text);
  };

  // Debug log when no chatId to help troubleshoot
  console.log('ChatInterface render:', { chatId, showingWelcome: !chatId });

  if (!chatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 min-h-full">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src="/jacc-logo.jpg" 
                alt="JACC Logo" 
                className="w-20 h-20 rounded-full shadow-lg object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome to JACC
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Your AI-Powered Merchant Services Assistant
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {conversationStarters.map((starter) => {
              const IconComponent = starter.icon;
              return (
                <button
                  key={starter.id}
                  onClick={() => handleConversationStarter(starter.text)}
                  className="p-6 rounded-xl border-2 hover:shadow-lg transition-all duration-300 text-left group bg-white dark:bg-slate-800 hover:scale-105"
                  style={{
                    borderColor: starter.id === '1' ? 'hsl(var(--navy-600))' : 
                                starter.id === '2' ? 'hsl(var(--green-400))' : 
                                starter.id === '3' ? 'hsl(var(--navy-600))' : 
                                'hsl(var(--green-400))',
                    borderWidth: '2px'
                  }}
                  disabled={isProcessing}
                >
                  <div className="flex items-start space-x-4">
                    <IconComponent 
                      className="w-8 h-8 flex-shrink-0" 
                      style={{
                        color: starter.id === '1' ? 'hsl(var(--navy-600))' : 
                               starter.id === '2' ? 'hsl(var(--green-400))' : 
                               starter.id === '3' ? 'hsl(var(--navy-600))' : 
                               'hsl(var(--green-400))'
                      }}
                    />
                    <span className="text-base font-medium leading-relaxed text-slate-900 dark:text-white">
                      {starter.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add a chat input box on the welcome screen with color-changing border */}
          <div className="mt-8">
            <div className="chat-glow-container">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Or type your question here..."
                  className="flex-1 min-h-[44px] max-h-20 resize-none border-0 bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  size="icon"
                  className="h-11 w-11"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                }`}
              >
                <MessageContent content={message.content} />
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isProcessing}
            size="icon"
            className="h-11 w-11"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
