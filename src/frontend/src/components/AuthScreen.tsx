import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Lock, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { backendInterface } from "../backend";
import { sha256Hex } from "../utils/crypto";

interface AuthScreenProps {
  hasIdentity: boolean;
  actor: backendInterface | null;
  onLogin: () => void;
  onRegistered: () => void;
}

export default function AuthScreen({
  hasIdentity,
  actor,
  onLogin,
  onRegistered,
}: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }
    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!actor) {
      toast.error("Not connected. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const passwordHash = await sha256Hex(password);
      await actor.register({ username: username.trim(), passwordHash });
      await actor.saveCallerUserProfile({
        username: username.trim(),
        isActive: true,
      });
      toast.success("Account created! Welcome to CipherChat.");
      onRegistered();
    } catch (err: any) {
      toast.error(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.60 0.175 255), transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative"
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-online border-2 border-background" />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-foreground uppercase">
            CIPHER
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Secure Private Messaging
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-panel">
          {!hasIdentity ? (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Welcome Back
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Connect your identity to access your encrypted messages
                </p>
              </div>
              <div className="flex flex-col gap-2 py-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground py-2 px-3 bg-accent/40 rounded-lg">
                  <Lock className="w-4 h-4 text-primary shrink-0" />
                  <span>End-to-end encrypted messages</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground py-2 px-3 bg-accent/40 rounded-lg">
                  <Shield className="w-4 h-4 text-warning shrink-0" />
                  <span>PIN-locked media sharing</span>
                </div>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={onLogin}
                data-ocid="auth.primary_button"
              >
                Connect with Internet Identity
              </Button>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div className="flex gap-1 p-1 bg-accent/50 rounded-lg mb-5">
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    mode === "login"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setMode("login")}
                  data-ocid="auth.tab"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    mode === "register"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setMode("register")}
                  data-ocid="auth.tab"
                >
                  Register
                </button>
              </div>

              <AnimatePresence mode="wait">
                {mode === "login" ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-4"
                  >
                    <p className="text-muted-foreground text-sm text-center">
                      Already registered? Your identity is connected. Click
                      below to access your account.
                    </p>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={onLogin}
                      data-ocid="auth.submit_button"
                    >
                      Access My Account
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      New user? Switch to Register tab
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="username"
                        className="text-foreground text-sm"
                      >
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username"
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                        autoComplete="username"
                        data-ocid="auth.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="password"
                        className="text-foreground text-sm"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a password"
                          className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                          autoComplete="new-password"
                          data-ocid="auth.input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-foreground text-sm"
                      >
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                        autoComplete="new-password"
                        onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                        data-ocid="auth.input"
                      />
                    </div>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleRegister}
                      disabled={loading}
                      data-ocid="auth.submit_button"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
