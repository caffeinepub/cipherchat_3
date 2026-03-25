import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Principal } from "@icp-sdk/core/principal";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Paperclip, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type ConversationView,
  ExternalBlob,
  MediaType,
  type backendInterface,
} from "../backend";
import { useConversationMessages, useUserProfile } from "../hooks/useQueries";
import { formatTimestamp, getInitials, sha256Hex } from "../utils/crypto";
import MediaMessage from "./MediaMessage";

interface ChatPanelProps {
  conversation: ConversationView;
  myPrincipal: Principal;
  actor: backendInterface;
  onBack: () => void;
}

export default function ChatPanel({
  conversation,
  myPrincipal,
  actor,
  onBack,
}: ChatPanelProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [mediaPin, setMediaPin] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const conversationId = conversation.id.toString();
  const { data: messages = [] } = useConversationMessages(conversationId);

  const otherPrincipal =
    conversation.conversations.find(
      (p) => p.toString() !== myPrincipal.toString(),
    ) || null;
  const { data: otherProfile } = useUserProfile(otherPrincipal);
  const displayName =
    otherProfile?.username ||
    `${otherPrincipal?.toString().slice(0, 16)}...` ||
    "Unknown";
  const initials = getInitials(displayName);

  const messagesCount = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesCount]);

  const recipient = otherPrincipal!;

  const sendText = async () => {
    if (!text.trim() || !recipient) return;
    setSending(true);
    const msg = text.trim();
    setText("");
    try {
      await actor.sendMessage({
        recipient,
        conversationId,
        messageType: { __kind__: "text", text: msg },
      });
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to send message");
      setText(msg);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File exceeds 5GB limit");
      return;
    }
    setPendingFile(file);
    setMediaPin("");
    setPinDialogOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMedia = async () => {
    if (!pendingFile || !recipient) return;
    if (mediaPin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }
    setPinDialogOpen(false);
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const arrayBuffer = await pendingFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const pinHash = await sha256Hex(mediaPin);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });
      const mimeType = pendingFile.type;
      let mediaType: MediaType;
      if (mimeType.startsWith("video/")) {
        mediaType = MediaType.video;
      } else if (mimeType.startsWith("image/")) {
        mediaType = MediaType.image;
      } else {
        mediaType = MediaType.document_;
      }
      await actor.sendMessage({
        recipient,
        conversationId,
        messageType: {
          __kind__: "media",
          media: { blob, mediaType, pinHash },
        },
      });
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Media sent securely");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send media");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setPendingFile(null);
      setMediaPin("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="md:hidden text-muted-foreground hover:text-foreground mr-1"
          data-ocid="chat.back.button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-online border-2 border-card" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            {displayName}
          </h3>
          <p className="text-xs text-online">Online</p>
        </div>
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div
          className="px-4 py-2 bg-card border-b border-border"
          data-ocid="chat.loading_state"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Uploading securely... {Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1" />
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12" data-ocid="chat.empty_state">
              <p className="text-muted-foreground text-sm">
                No messages yet. Say hello!
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender.toString() === myPrincipal.toString();
              const timestamp = formatTimestamp(msg.timestamp);
              return (
                <div
                  key={`msg-${msg.timestamp}-${idx}`}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  data-ocid={`chat.item.${idx + 1}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isMe ? "items-end" : "items-start"
                    } flex flex-col gap-1`}
                  >
                    {msg.messageType.__kind__ === "text" ? (
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-bubble-out text-primary-foreground rounded-br-sm"
                            : "bg-bubble-in text-foreground rounded-bl-sm"
                        }`}
                      >
                        {msg.messageType.text}
                      </div>
                    ) : (
                      <MediaMessage
                        blob={msg.messageType.media.blob}
                        pinHash={msg.messageType.media.pinHash}
                        mediaType={msg.messageType.media.mediaType}
                        conversationId={conversationId}
                        actor={actor}
                      />
                    )}
                    <span className="text-[10px] text-muted-foreground px-1">
                      {timestamp}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="px-4 py-3 border-t border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent hover:bg-accent/70 text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
            data-ocid="chat.upload_button"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a secure message…"
            className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground text-sm h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
            data-ocid="chat.input"
          />
          <Button
            onClick={sendText}
            disabled={!text.trim() || sending}
            size="icon"
            className="w-9 h-9 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            data-ocid="chat.submit_button"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* PIN dialog for media upload */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent
          className="bg-card border-border sm:max-w-sm"
          data-ocid="chat.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">Set Media PIN</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Set a PIN to protect this media. The recipient must enter this PIN
              to view it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {pendingFile && (
              <p className="text-xs text-muted-foreground truncate">
                📎 {pendingFile.name} (
                {(pendingFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">
                PIN (4–6 digits)
              </Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={mediaPin}
                onChange={(e) => setMediaPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter PIN"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground tracking-widest text-lg text-center"
                onKeyDown={(e) => e.key === "Enter" && handleSendMedia()}
                data-ocid="chat.pin.input"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-accent"
                onClick={() => {
                  setPinDialogOpen(false);
                  setPendingFile(null);
                }}
                data-ocid="chat.cancel_button"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleSendMedia}
                disabled={mediaPin.length < 4}
                data-ocid="chat.confirm_button"
              >
                Send Securely
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
