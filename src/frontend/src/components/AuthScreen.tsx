import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
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

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      role="img"
      aria-label="Google logo"
    >
      <title>Google logo</title>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="white"
      role="img"
      aria-label="Apple logo"
    >
      <title>Apple logo</title>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
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
                  Sign in to access your encrypted messages
                </p>
              </div>

              {/* Google button */}
              <button
                type="button"
                onClick={onLogin}
                className="h-11 w-full rounded-lg flex items-center justify-center gap-3 text-sm font-medium transition-colors bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                data-ocid="auth.primary_button"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Apple button */}
              <button
                type="button"
                onClick={onLogin}
                className="h-11 w-full rounded-lg flex items-center justify-center gap-3 text-sm font-medium transition-colors bg-black text-white hover:bg-gray-900"
                data-ocid="auth.secondary_button"
              >
                <AppleIcon />
                Continue with Apple
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Internet Identity button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={onLogin}
                data-ocid="auth.toggle"
              >
                <Shield className="w-4 h-4 mr-2" />
                Continue with Internet Identity
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
