import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Int "mo:core/Int";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type MediaType = {
    #image;
    #video;
    #document;
    #audio;
  };

  type MessageType = {
    #text : Text;
    #media : {
      blob : Storage.ExternalBlob;
      mediaType : MediaType;
      pinHash : Text;
    };
  };

  type Message = {
    sender : Principal;
    recipient : Principal;
    timestamp : Time.Time;
    messageType : MessageType;
  };

  module Message {
    public func compare(message1 : Message, message2 : Message) : Order.Order {
      Int.compare(message1.timestamp, message2.timestamp);
    };
  };

  type ConversationId = Text;

  type Conversation = {
    participants : Set.Set<Principal>;
    messages : [Message];
    id : ConversationId;
    createdAt : Time.Time;
    lastActivity : Time.Time;
  };

  type ConversationView = {
    conversations : [Principal];
    messages : [Message];
    createdAt : Time.Time;
    id : Nat;
    lastActivity : Time.Time;
  };

  type UserProfile = {
    username : Text;
    isActive : Bool;
  };

  type CreateUserRequest = {
    username : Text;
    passwordHash : Text;
  };

  type CreateMessageRequest = {
    recipient : Principal;
    messageType : MessageType;
    conversationId : ConversationId;
  };

  type ConversationViewId = Nat;

  let userProfiles = Map.empty<Principal, UserProfile>();
  let conversations = Map.empty<ConversationId, Conversation>();

  func getActiveUserProfile(user : Principal) : UserProfile {
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?profile) {
        if (not profile.isActive) {
          Runtime.trap("User is suspended");
        };
        profile;
      };
    };
  };

  func getConversationById(conversationId : ConversationId) : Conversation {
    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) { conversation };
    };
  };

  func getConversationViewById(conversationId : ConversationId) : ConversationView {
    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) {
        {
          conversations = conversation.participants.toArray();
          id = 0;
          messages = conversation.messages;
          createdAt = conversation.createdAt;
          lastActivity = conversation.lastActivity;
        };
      };
    };
  };

  module Conversation {
    public func compare(conversation1 : Conversation, conversation2 : Conversation) : Order.Order {
      switch (Int.compare(conversation2.lastActivity, conversation1.lastActivity)) {
        case (#equal) { Text.compare(conversation1.id, conversation2.id) };
        case (order) { order };
      };
    };
  };

  module ConversationView {
    public func compare(conversation1 : ConversationView, conversation2 : ConversationView) : Order.Order {
      switch (Int.compare(conversation2.lastActivity, conversation1.lastActivity)) {
        case (#equal) { Int.compare(conversation1.id, conversation2.id) };
        case (order) { order };
      };
    };
  };

  public query ({ caller }) func getAllActiveUsers() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    userProfiles.values().toArray().filter(
      func(profile) { profile.isActive }
    );
  };

  public shared ({ caller }) func register(request : CreateUserRequest) : async () {
    // No authorization check - guests can register
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("Caller is already registered");
    };
    userProfiles.add(
      caller,
      {
        username = request.username;
        isActive = true;
      },
    );
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func initiateConversation(otherUser : Principal) : async ConversationId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initiate conversations");
    };
    if (caller == otherUser) {
      Runtime.trap("Cannot start conversation with yourself");
    };
    ignore getActiveUserProfile(caller);
    ignore getActiveUserProfile(otherUser);

    let conversationId = caller.toText() # "/" # otherUser.toText();
    let conversation : Conversation = {
      participants = Set.fromIter<Principal>([caller, otherUser].values());
      messages = [];
      id = conversationId;
      createdAt = Time.now();
      lastActivity = Time.now();
    };
    conversations.add(conversationId, conversation);
    conversationId;
  };

  public query ({ caller }) func getConversation(conversationId : ConversationId) : async ConversationView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };
    ignore getActiveUserProfile(caller);
    let conversation = getConversationViewById(conversationId);
    let findConversation = switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?conversation) { conversation };
    };

    if (not findConversation.participants.contains(caller)) {
      Runtime.trap("You are not a participant in this conversation");
    };
    conversation;
  };

  public query ({ caller }) func getAllConversations() : async [ConversationView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };
    let user = getActiveUserProfile(caller);
    conversations.values().toArray().filter(
      func(conversation) {
        conversation.participants.contains(caller);
      }
    ).map(
      func(conversation) {
        {
          id = 0;
          conversations = conversation.participants.toArray();
          messages = conversation.messages;
          createdAt = conversation.createdAt;
          lastActivity = conversation.lastActivity;
        };
      }
    ).sort();
  };

  public shared ({ caller }) func sendMessage(request : CreateMessageRequest) : async Message {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    ignore getActiveUserProfile(caller);
    let conversation = getConversationById(request.conversationId);

    // Ensure caller is a participant in the conversation
    if (not conversation.participants.contains(caller)) {
      Runtime.trap("You are not a participant in this conversation");
    };

    // Ensure recipient is in the conversation
    if (not conversation.participants.contains(request.recipient)) {
      Runtime.trap("Recipient is not part of the conversation");
    };

    let message : Message = {
      sender = caller;
      recipient = request.recipient;
      timestamp = Time.now();
      messageType = request.messageType;
    };

    let updatedMessages = conversation.messages.concat([message]);
    let updatedConversation : Conversation = {
      participants = conversation.participants;
      messages = updatedMessages;
      id = conversation.id;
      createdAt = conversation.createdAt;
      lastActivity = Time.now();
    };
    conversations.add(request.conversationId, updatedConversation);
    message;
  };

  public query ({ caller }) func verifyMediaPin(blob : Storage.ExternalBlob, pinHash : Text, conversationId : ConversationId) : async Storage.ExternalBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify media PINs");
    };
    let _ = getActiveUserProfile(caller);
    let conversation = getConversationById(conversationId);

    // Ensure caller is a participant in the conversation
    if (not conversation.participants.contains(caller)) {
      Runtime.trap("You are not a participant in this conversation");
    };

    let pinMatches = conversation.messages.any(
      func(message) {
        switch (message.messageType) {
          case (#media mediaMessage) {
            mediaMessage.blob == blob and mediaMessage.pinHash == pinHash;
          };
          case (_) { false };
        };
      }
    );

    if (pinMatches) {
      blob;
    } else {
      Runtime.trap("Incorrect PIN for this media file");
    };
  };

  public shared ({ caller }) func suspendUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can suspend users");
    };
    let profile = getActiveUserProfile(user);
    let updatedProfile : UserProfile = {
      username = profile.username;
      isActive = false;
    };
    userProfiles.add(user, updatedProfile);
  };

  public shared ({ caller }) func deleteUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };
    ignore getActiveUserProfile(user);
    userProfiles.remove(user);

    let conversationsToDelete = conversations.values().filter(
      func(conversation) {
        conversation.participants.contains(user);
      }
    );

    conversationsToDelete.forEach(
      func(conversation) {
        conversations.remove(conversation.id);
      }
    );
  };

  public query ({ caller }) func getMessagesInConversation(conversationId : ConversationId) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };
    ignore getActiveUserProfile(caller);
    let conversation = getConversationById(conversationId);
    if (not conversation.participants.contains(caller)) {
      Runtime.trap("You are not a participant in this conversation");
    };
    conversation.messages.sort();
  };
};
