import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Principal } from "@icp-sdk/core/principal";
import { MessageSquare, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { backendInterface } from "../backend";
import { useConversations } from "../hooks/useQueries";
import ChatPanel from "./ChatPanel";
import ConversationItem from "./ConversationItem";
import NewChatModal from "./NewChatModal";

interface MessagesViewProps {
  selectedId: string | null;
  onSelectConversation: (id: string) => void;
  myPrincipal: Principal;
  actor: backendInterface;
}

export default function MessagesView({
  selectedId,
  onSelectConversation,
  myPrincipal,
  actor,
}: MessagesViewProps) {
  const [search, setSearch] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const { data: conversations = [], isLoading } = useConversations();

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => {
      const otherId = c.conversations
        .find((p) => p.toString() !== myPrincipal.toString())
        ?.toString();
      return otherId?.toLowerCase().includes(q);
    });
  }, [conversations, search, myPrincipal]);

  const selectedConversation = conversations.find(
    (c) => c.id.toString() === selectedId,
  );

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div
        className={`flex flex-col border-r border-border bg-card ${
          selectedId
            ? "hidden md:flex md:w-80 lg:w-96"
            : "flex w-full md:w-80 lg:w-96"
        } shrink-0`}
      >
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">
              Conversations
            </h2>
            <button
              type="button"
              onClick={() => setNewChatOpen(true)}
              className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 flex items-center justify-center text-primary transition-colors"
              data-ocid="messages.open_modal_button"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats…"
              className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
              data-ocid="messages.search_input"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 px-4 text-center"
              data-ocid="messages.empty_state"
            >
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                {search ? "No conversations found" : "No conversations yet"}
              </p>
              {!search && (
                <button
                  type="button"
                  onClick={() => setNewChatOpen(true)}
                  className="mt-3 text-xs text-primary hover:underline"
                  data-ocid="messages.primary_button"
                >
                  Start a new chat
                </button>
              )}
            </div>
          ) : (
            <div className="py-2" data-ocid="messages.list">
              {filtered.map((conv, idx) => (
                <ConversationItem
                  key={conv.id.toString()}
                  conversation={conv}
                  myPrincipal={myPrincipal}
                  isSelected={selectedId === conv.id.toString()}
                  onSelect={() => onSelectConversation(conv.id.toString())}
                  actor={actor}
                  index={idx + 1}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat panel */}
      <div
        className={`flex-1 min-w-0 ${selectedId ? "flex" : "hidden md:flex"} flex-col`}
      >
        {selectedConversation ? (
          <ChatPanel
            conversation={selectedConversation}
            myPrincipal={myPrincipal}
            actor={actor}
            onBack={() => onSelectConversation("")}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-primary/30" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Select a conversation
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Choose a conversation from the list or start a new encrypted chat.
            </p>
          </div>
        )}
      </div>

      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        actor={actor}
        myPrincipal={myPrincipal}
        onConversationStarted={(id) => {
          onSelectConversation(id);
          setNewChatOpen(false);
        }}
      />
    </div>
  );
}
