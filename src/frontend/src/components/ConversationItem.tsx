import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Principal } from "@icp-sdk/core/principal";
import { useMemo } from "react";
import type { ConversationView, backendInterface } from "../backend";
import { useUserProfile } from "../hooks/useQueries";
import { formatTimestamp, getInitials } from "../utils/crypto";

interface ConversationItemProps {
  conversation: ConversationView;
  myPrincipal: Principal;
  isSelected: boolean;
  onSelect: () => void;
  actor: backendInterface;
  index: number;
}

export default function ConversationItem({
  conversation,
  myPrincipal,
  isSelected,
  onSelect,
  index,
}: ConversationItemProps) {
  const otherPrincipal = useMemo(
    () =>
      conversation.conversations.find(
        (p) => p.toString() !== myPrincipal.toString(),
      ) || null,
    [conversation.conversations, myPrincipal],
  );

  const { data: otherProfile } = useUserProfile(otherPrincipal);

  const displayName =
    otherProfile?.username ||
    `${otherPrincipal?.toString().slice(0, 12)}...` ||
    "Unknown";
  const initials = getInitials(displayName);

  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const preview = lastMessage
    ? lastMessage.messageType.__kind__ === "text"
      ? lastMessage.messageType.text
      : "📎 Media"
    : "No messages yet";

  const timestamp = lastMessage ? formatTimestamp(lastMessage.timestamp) : "";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left ${
        isSelected ? "bg-primary/10 border-l-2 border-primary" : ""
      }`}
      data-ocid={`messages.item.${index}`}
    >
      <div className="relative shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-online border-2 border-card" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground truncate">
            {displayName}
          </span>
          {timestamp && (
            <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
              {timestamp}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {preview}
        </p>
      </div>
    </button>
  );
}
