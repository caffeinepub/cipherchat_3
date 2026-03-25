import { Button } from "@/components/ui/button";
import type { Principal } from "@icp-sdk/core/principal";
import { Check, Copy, Shield, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";

interface ProfileViewProps {
  myPrincipal: Principal;
  profile: UserProfile | null | undefined;
}

export default function ProfileView({
  myPrincipal,
  profile,
}: ProfileViewProps) {
  const [copied, setCopied] = useState(false);
  const principalStr = myPrincipal.toString();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(principalStr);
      setCopied(true);
      toast.success("User ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy — please select and copy manually");
    }
  };

  return (
    <div
      className="h-full overflow-auto bg-background p-6 lg:p-10"
      data-ocid="profile.page"
    >
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-wide">
              My Profile
            </h2>
            <p className="text-xs text-muted-foreground">
              Your account information
            </p>
          </div>
        </motion.div>

        {/* Username card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            <User className="w-3.5 h-3.5" />
            Username
          </div>
          <p className="text-foreground text-lg font-semibold">
            {profile?.username ?? (
              <span className="text-muted-foreground italic">Loading…</span>
            )}
          </p>
        </motion.div>

        {/* User ID card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" />
            Your User ID
          </div>

          <div className="relative bg-background rounded-lg border border-border p-4">
            <p
              className="font-mono text-sm text-foreground break-all leading-relaxed select-all"
              data-ocid="profile.input"
            >
              {principalStr}
            </p>
          </div>

          <Button
            onClick={handleCopy}
            variant={copied ? "default" : "outline"}
            className="w-full gap-2"
            data-ocid="profile.primary_button"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy User ID
              </>
            )}
          </Button>

          <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-lg p-3">
            <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Share your{" "}
              <span className="text-foreground font-medium">User ID</span> with
              others so they can find you and start a conversation. Keep it safe
              — only share with people you trust.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
