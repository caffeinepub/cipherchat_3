# CipherChat

## Current State
New project. No existing application files.

## Requested Changes (Diff)

### Add
- User registration and login (hashed passwords)
- Admin account (separate role) with user management dashboard
- One-on-one private messaging between registered users
- Media sharing (images and videos, up to 5GB per file) via blob storage
- Per-media PIN lock: sender sets a PIN when uploading media; recipient must enter the correct PIN to view it
- Conversation list showing all user's direct message threads
- Responsive design for desktop and mobile

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
1. User management: register, login, get user list, suspend/delete users (admin only)
2. Roles: `#user` and `#admin`
3. Conversations: create or fetch existing DM thread between two users
4. Messages: send text message, send media message (with blob reference + hashed PIN)
5. Get messages for a conversation (only participants can access)
6. PIN verification: recipient submits PIN; backend checks hash and returns blob URL if correct
7. Admin APIs: list all users, suspend user, delete user (no access to message content)

### Components
- `authorization` for role-based access
- `blob-storage` for media files up to 5GB

### Frontend
1. Auth screens: Login, Register
2. Main layout: sidebar nav (Conversations, Media Vault, Admin panel for admin role)
3. Conversation list: search, new chat button
4. Chat view: message bubbles, media placeholder with lock icon, PIN input modal
5. Media send flow: file picker, PIN assignment input, send button
6. Admin dashboard: user table with suspend/delete actions
7. Responsive layout for mobile and desktop
