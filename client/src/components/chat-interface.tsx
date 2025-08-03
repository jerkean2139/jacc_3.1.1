import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, MicOff, Calculator, TrendingUp, BarChart3, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParallax, useScrollAnimation } from "@/hooks/useParallax";
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
  const [isThinking, setIsThinking] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Parallax effects for mobile
  const logoRef = useParallax({ speed: 0.3, direction: 'up' });
  const titleRef = useParallax({ speed: 0.2, direction: 'up' });
  const conversationStartersRef = useParallax({ speed: 0.1, direction: 'up' });
  const scrollProgress = useScrollAnimation();



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

  // Auto-scroll to bottom when messages or thinking state change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, optimisticMessages, isThinking]);

  // Handle sending messages with optimistic updates
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    setIsProcessing(true);
    
    // Add optimistic user message immediately
    const optimisticUserMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    
    setOptimisticMessages(prev => [...prev, optimisticUserMessage]);
    
    try {
      if (!chatId && onNewChatWithMessage) {
        await onNewChatWithMessage(messageText);
      } else if (chatId) {
        // Show AI thinking state
        setIsThinking(true);
        
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            content: messageText,
            role: 'user'
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.status}`);
        }
        
        // Clear optimistic messages since real ones will come from server
        setOptimisticMessages([]);
        
        // Immediately invalidate cache and refetch
        queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
        queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
        
        // Intelligent polling that checks for AI response
        let pollAttempts = 0;
        const maxPolls = 20; // 10 seconds max
        const initialMessageCount = messages.length;
        
        const smartPoll = setInterval(async () => {
          if (pollAttempts >= maxPolls) {
            clearInterval(smartPoll);
            setIsThinking(false);
            return;
          }
          
          const freshData = await refetch();
          const newMessages = freshData.data || [];
          
          // Check if we got both user message AND AI response (2 new messages)
          if (newMessages.length >= initialMessageCount + 2) {
            clearInterval(smartPoll);
            setIsThinking(false);
            onChatUpdate();
          }
          
          pollAttempts++;
        }, 500);
        
        // Fallback timeout
        setTimeout(() => {
          clearInterval(smartPoll);
          setIsThinking(false);
        }, 12000);
      }
    } catch (error) {
      setOptimisticMessages([]);
      setIsThinking(false);
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
      <div 
        className="flex-1 flex flex-col p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 overflow-y-auto pb-32 sm:pb-4 mobile-full-height parallax-container"
        style={{
          backgroundPosition: `center ${scrollProgress * 0.5}px`,
          transition: 'background-position 0.1s ease-out'
        }}
      >
        {/* Scroll Progress Indicator */}
        <div 
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-green-400 z-50 transition-all duration-150 ease-out sm:hidden"
          style={{ width: `${scrollProgress}%` }}
        />
        
        <div className="max-w-4xl w-full mx-auto mobile-container sm:flex sm:flex-col sm:min-h-full">
          <div className="flex-1 space-y-3 sm:space-y-6 mt-8 sm:mt-12">
            <div className="text-center space-y-3 sm:space-y-4">
              <div ref={logoRef} className="flex justify-center parallax-layer">
                <img 
                  src="/jacc-logo.jpg" 
                  alt="JACC Logo" 
                  className="w-16 sm:w-20 h-16 sm:h-20 rounded-full shadow-lg object-cover"
                  style={{ 
                    transform: `translateY(${scrollProgress * 0.1}px)`,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
              </div>
              <div ref={titleRef} className="parallax-layer">
                <h1 
                  className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white"
                  style={{ 
                    transform: `translateY(${scrollProgress * 0.05}px)`,
                    transition: 'transform 0.1s ease-out'
                  }}
                >
                  Welcome to JACC
                </h1>
                <p 
                  className="text-base sm:text-lg text-slate-600 dark:text-slate-300"
                  style={{ 
                    transform: `translateY(${scrollProgress * 0.03}px)`,
                    transition: 'transform 0.1s ease-out'
                  }}
                >
                  Your AI-Powered Merchant Services Assistant
                </p>
              </div>
            </div>

            <div ref={conversationStartersRef} className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 parallax-layer">
              {conversationStarters.map((starter, index) => {
                const IconComponent = starter.icon;
                return (
                  <button
                    key={starter.id}
                    onClick={() => handleConversationStarter(starter.text)}
                    className="p-3 sm:p-6 rounded-lg sm:rounded-xl border-2 hover:shadow-lg transition-all duration-300 text-left group bg-white dark:bg-slate-800 hover:scale-105 w-full parallax-layer"
                    style={{
                      borderColor: starter.id === 'rates' ? '#2563eb' : 
                                  starter.id === 'compare' ? '#16a34a' : 
                                  starter.id === 'proposal' ? '#ea580c' : 
                                  '#7c3aed',
                      borderWidth: '2px',
                      transform: `translateY(${scrollProgress * (0.02 + index * 0.01)}px)`,
                      transition: 'transform 0.1s ease-out, all 0.3s ease'
                    }}
                    disabled={isProcessing}
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <IconComponent 
                        className="w-8 h-8 sm:w-8 sm:h-8 flex-shrink-0" 
                        style={{
                          color: starter.id === 'rates' ? '#2563eb' : 
                                 starter.id === 'compare' ? '#16a34a' : 
                                 starter.id === 'proposal' ? '#ea580c' : 
                                 '#7c3aed'
                        }}
                      />
                      <span className="text-sm sm:text-base font-medium leading-tight sm:leading-relaxed text-slate-900 dark:text-white">
                        {starter.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex-shrink-0 mb-20 sm:mb-0">
            <div className="chat-glow-container">
              <form onSubmit={handleSubmit} className="flex gap-1 w-full">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Or type your question here..."
                  className="flex-1 min-h-[44px] max-h-20 resize-none border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm sm:text-base min-w-0 rounded-lg px-4 py-3"
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
                  className="h-11 w-11 sm:h-11 sm:w-11 bg-blue-600 hover:bg-blue-700 text-white border-0 flex-shrink-0"
                  style={{ minWidth: '2.75rem', maxWidth: '2.75rem' }}
                >
                  <Send className="w-4 h-4 text-white" />
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4 sm:pb-24">
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            No messages yet. Start a conversation!
          </div>
        ) : (
          <>
            {/* Render actual messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                  }`}
                >
                  <MessageContent 
                    content={message.content} 
                    className={message.role === 'user' ? 'text-white [&>*]:text-white [&>p]:text-white [&>div]:text-white' : ''}
                  />
                </div>
              </div>
            ))}
            
            {/* Render optimistic user messages */}
            {optimisticMessages.map((message) => (
              <div
                key={message.id}
                className="flex justify-end animate-slideInFromRight"
              >
                <div className="max-w-[80%] rounded-lg p-4 bg-blue-600 text-white shadow-lg opacity-90">
                  <MessageContent 
                    content={message.content} 
                    className="text-white [&>*]:text-white [&>p]:text-white [&>div]:text-white"
                  />
                </div>
              </div>
            ))}
            
            {/* AI Thinking State */}
            {isThinking && (
              <div className="flex justify-start animate-fadeIn">
                <div className="max-w-[80%] rounded-lg p-4 bg-slate-100 dark:bg-slate-700 shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                      <div className="absolute inset-0 animate-spin">
                        <div className="w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full opacity-30"></div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed for mobile, static for desktop */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 sm:relative sm:bottom-auto sm:left-auto sm:right-auto fixed bottom-20 left-0 right-0 z-10" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="chat-glow-container">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-h-[44px] max-h-32 resize-none border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm sm:text-base rounded-lg px-4 py-3"
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
              className="h-11 w-11 bg-blue-600 hover:bg-blue-700 text-white border-0 flex-shrink-0"
              style={{ minWidth: '2.75rem', maxWidth: '2.75rem' }}
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
