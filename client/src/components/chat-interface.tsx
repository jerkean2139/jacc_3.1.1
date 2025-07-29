import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, MicOff } from "lucide-react";
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
    color: "bg-blue-500 hover:bg-blue-600 hover:text-white"
  },
  {
    id: "tracerpay", 
    icon: TrendingUp,
    text: "Show me how TracerPay beats my current processor and saves money",
    color: "bg-green-500 hover:bg-green-600 hover:text-white"
  },
  {
    id: "proposal",
    icon: BarChart3,
    text: "I need help creating a merchant proposal with competitive rates and terms",
    color: "bg-purple-500 hover:bg-purple-600 hover:text-white"
  },
  {
    id: "marketing",
    icon: Brain,
    text: "Create Marketing Strategy & Content",
    color: "bg-purple-600 hover:bg-purple-700 hover:text-white"
  }
];


}
