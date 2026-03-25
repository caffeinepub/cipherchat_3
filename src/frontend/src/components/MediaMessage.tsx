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
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import {
  type ExternalBlob,
  MediaType,
  type backendInterface,
} from "../backend";
import { sha256Hex } from "../utils/crypto";

interface MediaMessageProps {
  blob: ExternalBlob;
  pinHash: string;
  mediaType: MediaType;
  conversationId: string;
  actor: backendInterface;
}

const PIN_SLOTS = [0, 1, 2, 3, 4, 5];

export default function MediaMessage({
  blob,
  pinHash,
  mediaType,
  conversationId,
  actor,
}: MediaMessageProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [unlockedUrl, setUnlockedUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const inputHash = await sha256Hex(pin);
      if (inputHash !== pinHash) {
        setError("Incorrect PIN. Please try again.");
        setVerifying(false);
        return;
      }
      const verifiedBlob = await actor.verifyMediaPin(
        blob,
        pinHash,
        conversationId,
      );
      const url = verifiedBlob.getDirectURL();
      setUnlockedUrl(url);
      setUnlocked(true);
      setDialogOpen(false);
      setPin("");
    } catch (err: any) {
      setError(err?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  if (unlocked && unlockedUrl) {
    return (
      <div className="rounded-xl overflow-hidden border border-border max-w-xs">
        {mediaType === MediaType.video ? (
          // biome-ignore lint/a11y/useMediaCaption: user-uploaded media may not have captions
          <video
            src={unlockedUrl}
            controls
            className="max-w-full rounded-xl"
            style={{ maxHeight: "320px" }}
          />
        ) : (
          <img
            src={unlockedUrl}
            alt="Shared media"
            className="max-w-full rounded-xl object-cover"
            style={{ maxHeight: "320px" }}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="group flex flex-col items-center justify-center gap-3 w-48 h-32 rounded-xl bg-panel border border-border hover:border-warning/40 hover:bg-panel-alt transition-all"
        data-ocid="chat.media.button"
      >
        <div className="w-10 h-10 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
          <Lock className="w-5 h-5 text-warning" />
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-foreground">[PIN Required]</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Click to unlock
          </p>
        </div>
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="bg-card border-border sm:max-w-sm"
          data-ocid="chat.pin.dialog"
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <DialogTitle className="text-foreground text-base">
                  Unlock Media
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-muted-foreground text-sm">
              Media content requires a PIN to view. Enter the PIN provided by
              the sender.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* PIN digit boxes */}
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Enter PIN</Label>
              <div className="flex gap-2 justify-center">
                {PIN_SLOTS.map((slotIdx) => (
                  <div
                    key={slotIdx}
                    className={`w-10 h-12 rounded-lg border flex items-center justify-center text-lg font-bold transition-colors ${
                      pin.length > slotIdx
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-input text-muted-foreground"
                    }`}
                  >
                    {pin.length > slotIdx ? "•" : ""}
                  </div>
                ))}
              </div>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="Type PIN here"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground text-center tracking-widest mt-2"
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                autoFocus
                data-ocid="chat.pin.input"
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 text-destructive text-sm"
                data-ocid="chat.pin.error_state"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-accent"
                onClick={() => {
                  setDialogOpen(false);
                  setPin("");
                  setError("");
                }}
                data-ocid="chat.pin.cancel_button"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleVerify}
                disabled={pin.length < 4 || verifying}
                data-ocid="chat.pin.confirm_button"
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Unlock"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
