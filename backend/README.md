# TALKSPACE Backend API

Real-time chat application backend built with Node.js, Express, MongoDB, and Socket.io.

## 🚀 Features

- **Authentication**: JWT-based authentication with secure password hashing
- **Real-time Messaging**: Socket.io for instant message delivery
- **Conversations**: Private chats and group conversations
- **Message Features**: 
  - Text, image, file, and voice messages
  - Reactions, replies, and forwarding
  - Read receipts and typing indicators
  - Pin/unpin messages
  - Edit and delete messages
- **Group Management**: Create groups, add/remove members, admin controls
- **User Management**: Contacts, blocking, favorites
- **File Uploads**: Support for images, videos, audio, and documents

## 📋 Prerequisites

- Node.js v18+ 
- MongoDB (local or Atlas)
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/xtr18vj/TalkspaceChattingsystem.git
cd TalkspaceChattingsystem/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/talkspace
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5174
NODE_ENV=development
```

5. Start MongoDB (if running locally)

6. Run the server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search` | Search users |
| GET | `/api/users/contacts` | Get contacts |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users/contacts/:userId` | Add contact |
| DELETE | `/api/users/contacts/:userId` | Remove contact |
| PUT | `/api/users/contacts/:userId/block` | Block/unblock user |
| PUT | `/api/users/contacts/:userId/favorite` | Toggle favorite |
| PUT | `/api/users/status` | Update online status |
| PUT | `/api/users/settings` | Update settings |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | Get all conversations |
| GET | `/api/conversations/:id` | Get single conversation |
| POST | `/api/conversations/private` | Create/get private chat |
| POST | `/api/conversations/group` | Create group |
| PUT | `/api/conversations/:id/group` | Update group info |
| POST | `/api/conversations/:id/participants` | Add participants |
| DELETE | `/api/conversations/:id/participants/:userId` | Remove participant |
| PUT | `/api/conversations/:id/pin` | Pin/unpin conversation |
| PUT | `/api/conversations/:id/mute` | Mute/unmute |
| PUT | `/api/conversations/:id/archive` | Archive/unarchive |
| DELETE | `/api/conversations/:id` | Delete conversation |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:conversationId` | Get messages |
| GET | `/api/messages/:conversationId/search` | Search messages |
| POST | `/api/messages` | Send message |
| POST | `/api/messages/upload` | Upload attachment |
| PUT | `/api/messages/:messageId` | Edit message |
| DELETE | `/api/messages/:messageId` | Delete message |
| PUT | `/api/messages/:conversationId/read` | Mark as read |
| POST | `/api/messages/:messageId/reactions` | Add reaction |
| DELETE | `/api/messages/:messageId/reactions` | Remove reaction |
| POST | `/api/messages/:messageId/forward` | Forward message |
| PUT | `/api/messages/:messageId/pin` | Pin/unpin message |

## 🔌 Socket.io Events

### Client → Server
| Event | Description |
|-------|-------------|
| `conversation:join` | Join conversation room |
| `conversation:leave` | Leave conversation room |
| `typing:start` | Start typing indicator |
| `typing:stop` | Stop typing indicator |
| `message:send` | Send new message |
| `message:react` | Add reaction |
| `message:read` | Mark messages as read |
| `user:status:update` | Update user status |
| `call:initiate` | Start video/audio call |
| `call:accept` | Accept incoming call |
| `call:reject` | Reject incoming call |
| `call:end` | End ongoing call |

### Server → Client
| Event | Description |
|-------|-------------|
| `message:new` | New message received |
| `message:reaction` | Reaction added |
| `message:edit` | Message edited |
| `message:delete` | Message deleted |
| `message:read` | Messages marked read |
| `typing:start` | User started typing |
| `typing:stop` | User stopped typing |
| `user:status` | User status changed |
| `conversation:new` | New conversation created |
| `conversation:update` | Conversation updated |
| `call:incoming` | Incoming call |
| `call:accepted` | Call accepted |
| `call:rejected` | Call rejected |
| `call:ended` | Call ended |

## 📁 Project Structure

```
backend/
├── server.js                 # Entry point
├── .env                      # Environment variables
├── .env.example              # Example environment file
├── package.json              # Dependencies
├── uploads/                  # Uploaded files
└── src/
    ├── controllers/          # Request handlers
    │   ├── auth.controller.js
    │   ├── user.controller.js
    │   ├── message.controller.js
    │   └── conversation.controller.js
    ├── models/               # MongoDB schemas
    │   ├── User.model.js
    │   ├── Message.model.js
    │   └── Conversation.model.js
    ├── routes/               # API routes
    │   ├── auth.routes.js
    │   ├── user.routes.js
    │   ├── message.routes.js
    │   └── conversation.routes.js
    ├── middleware/           # Custom middleware
    │   ├── auth.middleware.js
    │   └── validate.middleware.js
    └── socket/               # Socket.io handlers
        └── index.js
```

## 🔐 Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Request validation with express-validator
- CORS configuration
- Environment variable protection

## 📝 License

ISC License

## 👤 Author

TALKSPACE Team
