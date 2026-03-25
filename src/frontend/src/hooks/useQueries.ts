import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ConversationView,
  Message,
  UserProfile,
  UserRole,
} from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useCallerRole() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<UserRole>({
    queryKey: ["role", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<UserProfile | null>({
    queryKey: ["profile", "caller", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useConversations() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<ConversationView[]>({
    queryKey: ["conversations", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllConversations();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useConversationMessages(conversationId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!actor || !conversationId) return [];
      return actor.getMessagesInConversation(conversationId);
    },
    enabled: !!actor && !isFetching && !!conversationId,
    refetchInterval: 3000,
  });
}

export function useActiveUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["activeUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllActiveUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
    staleTime: 60_000,
  });
}

export function useInitiateConversation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (otherUser: Principal) => {
      if (!actor) throw new Error("No actor");
      return actor.initiateConversation(otherUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useSuspendUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("No actor");
      return actor.suspendUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeUsers"] });
    },
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeUsers"] });
    },
  });
}
