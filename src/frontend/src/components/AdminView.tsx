import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Principal } from "@icp-sdk/core/principal";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ShieldCheck, Trash2, UserX, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { backendInterface } from "../backend";
import {
  useConversations,
  useDeleteUser,
  useSuspendUser,
} from "../hooks/useQueries";
import { getInitials } from "../utils/crypto";

interface AdminViewProps {
  actor: backendInterface;
  myPrincipal: Principal;
}

interface KnownUser {
  principal: Principal;
  username: string;
  isActive: boolean;
}

export default function AdminView({ actor, myPrincipal }: AdminViewProps) {
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "delete";
    user: KnownUser;
  } | null>(null);
  const queryClient = useQueryClient();
  const { data: conversations = [], isLoading } = useConversations();
  const suspendMutation = useSuspendUser();
  const deleteMutation = useDeleteUser();

  const [resolvedUsers, setResolvedUsers] = useState<Map<string, KnownUser>>(
    new Map(),
  );

  useMemo(() => {
    const seen = new Set<string>();
    for (const conv of conversations) {
      for (const p of conv.conversations) {
        const key = p.toString();
        if (seen.has(key) || resolvedUsers.has(key)) continue;
        seen.add(key);
        actor
          .getUserProfile(p)
          .then((profile) => {
            setResolvedUsers((prev) => {
              const next = new Map(prev);
              next.set(key, {
                principal: p,
                username: profile?.username || `${key.slice(0, 12)}...`,
                isActive: profile?.isActive ?? true,
              });
              return next;
            });
          })
          .catch(() => {});
      }
    }
  }, [conversations, actor, resolvedUsers]);

  const allUsers = Array.from(resolvedUsers.values());

  const filtered = useMemo(() => {
    if (!search.trim()) return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.principal.toString().toLowerCase().includes(q),
    );
  }, [allUsers, search]);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { type, user } = confirmAction;
    setConfirmAction(null);
    try {
      if (type === "suspend") {
        await suspendMutation.mutateAsync(user.principal);
        setResolvedUsers((prev) => {
          const next = new Map(prev);
          const existing = next.get(user.principal.toString());
          if (existing)
            next.set(user.principal.toString(), {
              ...existing,
              isActive: false,
            });
          return next;
        });
        toast.success(`${user.username} has been suspended`);
      } else {
        await deleteMutation.mutateAsync(user.principal);
        setResolvedUsers((prev) => {
          const next = new Map(prev);
          next.delete(user.principal.toString());
          return next;
        });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        toast.success(`${user.username} has been deleted`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              User Management
            </h2>
            <p className="text-sm text-muted-foreground">
              Admin only — manage active users
            </p>
          </div>
        </div>
        <Badge className="bg-warning/10 text-warning border border-warning/20 text-xs">
          {allUsers.length} Users
        </Badge>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…"
          className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
          data-ocid="admin.search_input"
        />
      </div>

      {/* Table */}
      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3" data-ocid="admin.loading_state">
            {["a", "b", "c", "d", "e"].map((key) => (
              <Skeleton key={key} className="h-12 w-full bg-accent" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-40 text-center"
            data-ocid="admin.empty_state"
          >
            <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">
              {search ? "No users found" : "No known users yet"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <Table data-ocid="admin.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">
                    User
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium">
                    Principal
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user, idx) => (
                  <TableRow
                    key={user.principal.toString()}
                    className="border-border hover:bg-accent/30"
                    data-ocid={`admin.row.${idx + 1}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {getInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">
                          {user.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-mono">
                        {`${user.principal.toString().slice(0, 20)}…`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${
                          user.isActive
                            ? "bg-online/10 text-online border-online/20"
                            : "bg-muted text-muted-foreground border-border"
                        } border`}
                      >
                        {user.isActive ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs border-warning/30 text-warning hover:bg-warning/10"
                            onClick={() =>
                              setConfirmAction({ type: "suspend", user })
                            }
                            disabled={
                              user.principal.toString() ===
                              myPrincipal.toString()
                            }
                            data-ocid={`admin.edit_button.${idx + 1}`}
                          >
                            <UserX className="w-3.5 h-3.5 mr-1" />
                            Suspend
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setConfirmAction({ type: "delete", user })
                          }
                          disabled={
                            user.principal.toString() === myPrincipal.toString()
                          }
                          data-ocid={`admin.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>

      {/* Confirm dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(v) => !v && setConfirmAction(null)}
      >
        <AlertDialogContent
          className="bg-card border-border"
          data-ocid="admin.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {confirmAction?.type === "suspend"
                ? "Suspend User"
                : "Delete User"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {confirmAction?.type === "suspend"
                ? `Are you sure you want to suspend ${confirmAction.user.username}? They will lose access until restored.`
                : `Are you sure you want to permanently delete ${confirmAction?.user.username}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border text-foreground hover:bg-accent"
              data-ocid="admin.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={`${
                confirmAction?.type === "delete"
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-warning/80 hover:bg-warning text-background"
              } text-destructive-foreground`}
              onClick={handleConfirm}
              data-ocid="admin.confirm_button"
            >
              {confirmAction?.type === "suspend" ? "Suspend" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
