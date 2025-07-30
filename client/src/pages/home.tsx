import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Sidebar from "@/components/sidebar";
import ChatInterface from "@/components/chat-interface";
import UserStatsDashboard from "@/components/user-stats-dashboard";
import DynamicWelcomeDashboard from "@/components/dynamic-welcome-dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useNewChatFAB } from "@/components/bottom-nav";
import type { Chat, Folder } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch user's chats
  const { data: chats = [], refetch: refetchChats } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
  });

  // Fetch user's folders
  const { data: folders = [], refetch: refetchFolders } = useQuery<Folder[]>({
    queryKey: ["/api/folders"],
  });

  // Set active chat to most recent if none selected
  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      // Set to the most recent chat (first in array, assuming sorted by creation date)
      const mostRecentChat = chats[0];
      console.log("Setting active chat ID to most recent:", mostRecentChat.id);
      setActiveChatId(mostRecentChat.id);
    }
  }, [chats, activeChatId]);
  // Don't auto-select a chat to allow welcome dashboard to show
  // Users can manually select chats from the sidebar

  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "New Chat",
          isActive: true
        }),
      });

      if (response.ok) {
        const newChat = await response.json();
        console.log("Created new chat:", newChat);
        setActiveChatId(newChat.id);
        await refetchChats();
      } else {
        console.error("Failed to create chat:", await response.text());
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const handleNewChatWithMessage = async (message: string) => {
    try {
      // Create new chat first
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "New Chat",
          isActive: true
        }),
      });

      if (response.ok) {
        const newChat = await response.json();
        console.log("Created new chat with message:", newChat);
        setActiveChatId(newChat.id);
        await refetchChats();
        
        // We're already on the home page, just set the active chat
        
        // Send the message immediately after navigation completes
        setTimeout(async () => {
          try {
            const sendResponse = await fetch("/api/chat/send", {
              method: "POST", 
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                message: message,
                chatId: newChat.id
              }),
            });
            
            if (sendResponse.ok) {
              console.log("Message sent successfully via conversation starter");
              // Refresh chats immediately to show the new chat in sidebar
              await refetchChats();
              console.log("Chats refreshed after message sent");
            }
          } catch (error) {
            console.error("Failed to send conversation starter message:", error);
          }
        }, 500);
        
        // Send the initial message and trigger AI response
        setTimeout(async () => {
          try {
            const messageResponse = await fetch(`/api/chats/${newChat.id}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                content: message,
                role: "user"
              }),
            });
            
            if (messageResponse.ok) {
              console.log("Initial message sent successfully, AI response should follow");
              // Refetch chats to update the UI with the new conversation
              await refetchChats();
            } else {
              console.error("Failed to send initial message:", await messageResponse.text());
            }
          } catch (error) {
            console.error("Failed to send initial message:", error);
          }
        }, 200);
      } else {
        console.error("Failed to create chat:", await response.text());
      }
    } catch (error) {
      console.error("Failed to create new chat with message:", error);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleChatDelete = async (chatId: string) => {
    console.log("handleChatDelete called with:", chatId);
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // If we deleted the active chat, select another one
        if (activeChatId === chatId) {
          const remainingChats = chats.filter(chat => chat.id !== chatId);
          setActiveChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
        }
        refetchChats();
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  // Debug the function
  console.log("Home component - handleChatDelete defined:", typeof handleChatDelete);

  const handleFolderCreate = async (name: string, parentId?: string, color?: string) => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          parentId: parentId || null,
          color: color || "blue"
        }),
      });

      if (response.ok) {
        refetchFolders();
      }
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  // Connect the floating action button to new chat creation
  useNewChatFAB(handleNewChat);

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Mobile Layout - Always show on small screens */}
      <div className="flex md:hidden flex-1 flex-col pb-16">
        {/* Mobile Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <Sidebar
                  user={user}
                  chats={chats}
                  folders={folders}
                  activeChatId={activeChatId}
                  onNewChat={handleNewChat}
                  onChatSelect={handleChatSelect}
                  onFolderCreate={handleFolderCreate}
                  onChatDelete={handleChatDelete}
                  collapsed={false}
                />
              </SheetContent>
            </Sheet>
            <img src="/icons/icon-192x192.png" alt="JACC" className="w-8 h-8" />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">JACC</h1>
          </div>
          <button
            onClick={handleNewChat}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            chatId={activeChatId}
            onChatUpdate={refetchChats}
            onNewChatWithMessage={handleNewChatWithMessage}
            chats={chats}
            folders={folders}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Sidebar Panel */}
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={30}
            defaultSize={25}
            minSize={20}
            maxSize={40}
            collapsible
            onCollapse={() => setSidebarCollapsed(true)}
            onExpand={() => setSidebarCollapsed(false)}
            className={sidebarCollapsed ? "min-w-0" : ""}
          >
            <Sidebar
              user={user}
              chats={chats}
              folders={folders}
              activeChatId={activeChatId}
              onNewChat={handleNewChat}
              onChatSelect={handleChatSelect}
              onFolderCreate={handleFolderCreate}
              onChatDelete={handleChatDelete}
              collapsed={sidebarCollapsed}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Chat Panel */}
          <ResizablePanel defaultSize={55} minSize={40}>
          <ResizablePanel defaultSize={75} minSize={60}>
            <ChatInterface
              chatId={activeChatId}
              onChatUpdate={refetchChats}
              onNewChatWithMessage={handleNewChatWithMessage}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Stats/Gamification Panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full overflow-auto bg-white dark:bg-slate-800">
              <div className="p-4">
                <UserStatsDashboard userId={user?.id} compact={true} />
              </div>
            </div>
          </ResizablePanel>
              chats={chats}
              folders={folders}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
