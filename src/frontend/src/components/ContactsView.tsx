import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { backendInterface } from "../backend";
import { useConversations } from "../hooks/useQueries";
import { getInitials } from "../utils/crypto";

interface ContactsViewProps {
  myPrincipal: Principal;
  actor: backendInterface;
  onStartConversation: (conversationId: string) => void;
}

interface KnownContact {
  principal: Principal;
  username: string;
}

const LOADING_PLACEHOLDERS = ["sk-1", "sk-2", "sk-3", "sk-4"];

export default function ContactsView({
  myPrincipal,
  actor,
  onStartConversation,
}: ContactsViewProps) {
  const [search, setSearch] = useState("");
  const [startingFor, setStartingFor] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: conversations = [], isLoading } = useConversations();

  const contacts = useMemo(() => {
    const map = new Map<string, KnownContact>();
    for (const conv of conversations) {
      for (const p of conv.conversations) {
        if (p.toString() === myPrincipal.toString()) continue;
        if (!map.has(p.toString())) {
          map.set(p.toString(), {
            principal: p,
            username: `${p.toString().slice(0, 12)}...`,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [conversations, myPrincipal]);

  const [resolvedNames, setResolvedNames] = useState<Map<string, string>>(
    new Map(),
  );

  useMemo(() => {
    for (const contact of contacts) {
      const key = contact.principal.toString();
      if (!resolvedNames.has(key)) {
        actor
          .getUserProfile(contact.principal)
          .then((profile) => {
            if (profile) {
              setResolvedNames((prev) =>
                new Map(prev).set(key, profile.username),
              );
            }
          })
          .catch(() => {});
      }
    }
  }, [contacts, actor, resolvedNames]);

  const displayContacts = contacts.map((c) => ({
    ...c,
    username: resolvedNames.get(c.principal.toString()) || c.username,
  }));

  const filtered = useMemo(() => {
    if (!search.trim()) return displayContacts;
    const q = search.toLowerCase();
    return displayContacts.filter(
      (c) =>
        c.username.toLowerCase().includes(q) ||
        c.principal.toString().toLowerCase().includes(q),
    );
  }, [displayContacts, search]);

  const handleMessage = async (contact: KnownContact) => {
    setStartingFor(contact.principal.toString());
    try {
      const convId = await actor.initiateConversation(contact.principal);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onStartConversation(convId);
    } catch (err: any) {
      toast.error(err?.message || "Failed to start conversation");
    } finally {
      setStartingFor(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
            <p className="text-xs text-muted-foreground">
              {contacts.length} known contacts
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="contacts.search_input"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="space-y-3" data-ocid="contacts.loading_state">
              {LOADING_PLACEHOLDERS.map((key) => (
                <div key={key} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-10 h-10 rounded-full bg-accent" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32 bg-accent" />
                    <Skeleton className="h-3 w-48 bg-accent" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="contacts.empty_state"
            >
              <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                {search ? "No contacts found" : "No contacts yet"}
              </p>
              {!search && (
                <p className="text-xs text-muted-foreground mt-1">
                  Start a conversation to add contacts
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1" data-ocid="contacts.list">
              {filtered.map((contact, idx) => (
                <div
                  key={contact.principal.toString()}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/40 transition-colors"
                  data-ocid={`contacts.item.${idx + 1}`}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                        {getInitials(contact.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-online border-2 border-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {contact.username}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {contact.principal.toString().slice(0, 24)}…
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shrink-0"
                    onClick={() => handleMessage(contact)}
                    disabled={startingFor === contact.principal.toString()}
                    data-ocid={`contacts.secondary_button.${idx + 1}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    Message
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
