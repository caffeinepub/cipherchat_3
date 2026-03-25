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
import type { Principal } from "@icp-sdk/core/principal";
import { Principal as PrincipalClass } from "@icp-sdk/core/principal";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { backendInterface } from "../backend";

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  actor: backendInterface;
  myPrincipal: Principal;
  onConversationStarted: (conversationId: string) => void;
}

export default function NewChatModal({
  open,
  onClose,
  actor,
  onConversationStarted,
}: NewChatModalProps) {
  const [principalInput, setPrincipalInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const handleStart = async () => {
    const input = principalInput.trim();
    if (!input) {
      setError("Principal ID is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let principal: Principal;
      try {
        principal = PrincipalClass.fromText(input);
      } catch {
        setError("Invalid principal ID format");
        setLoading(false);
        return;
      }
      const profile = await actor.getUserProfile(principal);
      if (!profile) {
        setError("No user found with this principal ID");
        setLoading(false);
        return;
      }
      const conversationId = await actor.initiateConversation(principal);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success(`Conversation started with ${profile.username}`);
      setPrincipalInput("");
      onConversationStarted(conversationId);
    } catch (err: any) {
      setError(err?.message || "Failed to start conversation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border sm:max-w-sm"
        data-ocid="newchat.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">
            New Conversation
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the recipient's Internet Identity principal to start an
            encrypted conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">
              Recipient Principal ID
            </Label>
            <Input
              value={principalInput}
              onChange={(e) => {
                setPrincipalInput(e.target.value);
                setError("");
              }}
              placeholder="e.g. aaaaa-aa or xxxx-xxx-xxx..."
              className="bg-input border-border text-foreground placeholder:text-muted-foreground text-sm font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              data-ocid="newchat.input"
              autoFocus
            />
          </div>
          {error && (
            <div
              className="flex items-center gap-2 text-destructive text-sm"
              data-ocid="newchat.error_state"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Ask your contact to share their principal ID from their account
            settings.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-accent"
              onClick={onClose}
              data-ocid="newchat.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleStart}
              disabled={loading || !principalInput.trim()}
              data-ocid="newchat.confirm_button"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting…
                </>
              ) : (
                "Start Chat"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
