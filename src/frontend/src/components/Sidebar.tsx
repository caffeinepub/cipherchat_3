import type { Principal } from "@icp-sdk/core/principal";
import {
  Image,
  LogOut,
  MessageSquare,
  Shield,
  User,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { AppView } from "../App";

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isAdmin: boolean;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  myPrincipal?: Principal;
  username?: string;
}

const navItems: {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}[] = [
  {
    id: "messages",
    label: "Messages",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  { id: "contacts", label: "Contacts", icon: <Users className="w-5 h-5" /> },
  { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
  {
    id: "admin",
    label: "User Management",
    icon: <UserCog className="w-5 h-5" />,
    adminOnly: true,
  },
];

export default function Sidebar({
  currentView,
  onViewChange,
  isAdmin,
  onLogout,
  isOpen,
  onClose,
  myPrincipal,
  username,
}: SidebarProps) {
  const shortPrincipal = myPrincipal
    ? (() => {
        const s = myPrincipal.toString();
        return `${s.slice(0, 5)}…${s.slice(-5)}`;
      })()
    : null;

  const content = (
    <div className="flex flex-col h-full w-64 bg-sidebar border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">
              CIPHER
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-wide">
              Secure Messaging
            </p>
          </div>
        </div>
        <button
          type="button"
          className="lg:hidden text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const isActive = currentView === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
              data-ocid={`nav.${item.id}.link`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                />
              )}
              <span className="relative z-10">{item.icon}</span>
              <span className="relative z-10 flex-1 text-left">
                {item.label}
              </span>
              {item.adminOnly && (
                <span className="relative z-10 text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning font-medium">
                  Admin
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Identity pill */}
      {myPrincipal && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <button
            type="button"
            onClick={() => onViewChange("profile")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 hover:bg-primary/10 transition-colors group"
            data-ocid="nav.profile.button"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              {username && (
                <p className="text-xs font-semibold text-foreground truncate">
                  {username}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                {shortPrincipal}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Media info */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
          <Image className="w-4 h-4" />
          <span className="text-xs">Media is PIN-protected</span>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          data-ocid="nav.logout.button"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">{content}</div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="fixed left-0 top-0 h-full z-30 lg:hidden shadow-panel"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
