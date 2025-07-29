import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  BookOpen, 
  Settings,
  Plus,
  Home,
  HelpCircle,
  MessageSquare,
  Trophy,
  TrendingUp,
  BarChart3,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  disabled?: boolean;
  comingSoon?: boolean;
  adminOnly?: boolean;
  hideForAdmin?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/",
    icon: Home,
    label: "Home"
  },
  {
    href: "/documents",
    icon: FileText,
    label: "Docs"
  },
  {
    href: "/guide",
    icon: BookOpen,
    label: "Guide"
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Admin",
    adminOnly: true
  },

  {
    href: "/vendor-intelligence",
    icon: TrendingUp,
    label: "Intel",
    disabled: true,
    comingSoon: true,
    hideForAdmin: true
  },
  {
    href: "/competitive-intelligence",
    icon: BarChart3,
    label: "Stats",
    disabled: true,
    comingSoon: true,
    hideForAdmin: true
  },
  {
    href: "/help",
    icon: HelpCircle,
    label: "Help",
    disabled: true,
    comingSoon: true
  }
];

export default function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/" || location === "";
    }
    return location.startsWith(href);
  };

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => {
    // Hide items marked as hideForAdmin for admin users
    if (user?.role === 'dev_admin' && item.hideForAdmin) {
      return false;
    }
    
    // Show admin-only items only to admin users
    if (item.adminOnly && user?.role !== 'dev_admin') {
      return false;
    }
    
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden">
      <div className="flex items-center justify-between h-16 px-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <div key={item.href} className="flex-1">
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
