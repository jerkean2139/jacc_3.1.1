import { Home, MessageSquare, Settings, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
      active: location === "/"
    },
    {
      icon: MessageSquare,
      label: "Chat",
      path: "/chat",
      active: location.startsWith("/chat")
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/admin",
      active: location.startsWith("/admin")
    },
    {
      icon: User,
      label: "Profile",
      path: "/profile",
      active: location === "/profile"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 z-50 sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around py-3 px-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <a className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200 ${
                item.active 
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 scale-105' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}>
                <IconComponent className="w-6 h-6" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
}