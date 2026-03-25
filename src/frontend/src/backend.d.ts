import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface CreateUserRequest {
    username: string;
    passwordHash: string;
}
export interface ConversationView {
    id: bigint;
    messages: Array<Message>;
    lastActivity: Time;
    createdAt: Time;
    conversations: Array<Principal>;
}
export interface CreateMessageRequest {
    recipient: Principal;
    messageType: MessageType;
    conversationId: ConversationId;
}
export type MessageType = {
    __kind__: "media";
    media: {
        blob: ExternalBlob;
        mediaType: MediaType;
        pinHash: string;
    };
} | {
    __kind__: "text";
    text: string;
};
export type ConversationId = string;
export interface Message {
    recipient: Principal;
    sender: Principal;
    messageType: MessageType;
    timestamp: Time;
}
export interface UserProfile {
    username: string;
    isActive: boolean;
}
export enum MediaType {
    audio = "audio",
    video = "video",
    document_ = "document",
    image = "image"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteUser(user: Principal): Promise<void>;
    getAllActiveUsers(): Promise<Array<UserProfile>>;
    getAllConversations(): Promise<Array<ConversationView>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversation(conversationId: ConversationId): Promise<ConversationView>;
    getMessagesInConversation(conversationId: ConversationId): Promise<Array<Message>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initiateConversation(otherUser: Principal): Promise<ConversationId>;
    isCallerAdmin(): Promise<boolean>;
    register(request: CreateUserRequest): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(request: CreateMessageRequest): Promise<Message>;
    suspendUser(user: Principal): Promise<void>;
    verifyMediaPin(blob: ExternalBlob, pinHash: string, conversationId: ConversationId): Promise<ExternalBlob>;
}
