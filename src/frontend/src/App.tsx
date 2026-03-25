import { Toaster } from "@/components/ui/sonner";
import { Menu, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { UserRole } from "./backend";
import AdminView from "./components/AdminView";
import AuthScreen from "./components/AuthScreen";
import ContactsView from "./components/ContactsView";
import MessagesView from "./components/MessagesView";
import Sidebar from "./components/Sidebar";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerRole } from "./hooks/useQueries";

export type AppView = "messages" | "contacts" | "admin";

export default function App() {
  const { identity, isInitializing, login, clear } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [currentView, setCurrentView] = useState<AppView>("messages");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleQuery = useCallerRole();
  const role = roleQuery.data;
  const isGuest = !identity || role === UserRole.guest || role === undefined;
  const isAdmin = role === UserRole.admin;
  const isLoading =
    isInitializing || (!!identity && (isFetching || roleQuery.isLoading));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Shield className="w-12 h-12 text-primary opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm tracking-wider uppercase">
            Initializing
          </p>
        </div>
      </div>
    );
  }

  if (isGuest || !identity) {
    return (
      <>
        <AuthScreen
          hasIdentity={!!identity}
          actor={actor}
          onLogin={login}
          onRegistered={() => roleQuery.refetch()}
        />
        <Toaster />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <Sidebar
        currentView={currentView}
        onViewChange={(v) => {
          setCurrentView(v);
          setSidebarOpen(false);
        }}
        isAdmin={isAdmin}
        onLogout={clear}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-foreground hover:text-primary transition-colors"
            data-ocid="nav.toggle"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground tracking-widest text-sm">
              CIPHER
            </span>
          </div>
        </div>

        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentView === "messages" && (
              <motion.div
                key="messages"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <MessagesView
                  selectedId={selectedConversationId}
                  onSelectConversation={setSelectedConversationId}
                  myPrincipal={identity.getPrincipal()}
                  actor={actor!}
                />
              </motion.div>
            )}
            {currentView === "contacts" && (
              <motion.div
                key="contacts"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <ContactsView
                  myPrincipal={identity.getPrincipal()}
                  actor={actor!}
                  onStartConversation={(convId) => {
                    setSelectedConversationId(convId);
                    setCurrentView("messages");
                  }}
                />
              </motion.div>
            )}
            {currentView === "admin" && isAdmin && (
              <motion.div
                key="admin"
                className="h-full overflow-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <AdminView
                  actor={actor!}
                  myPrincipal={identity.getPrincipal()}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
