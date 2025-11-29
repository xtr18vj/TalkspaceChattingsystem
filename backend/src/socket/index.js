const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Conversation = require('../models/Conversation.model');
const Message = require('../models/Message.model');

// Store connected users
const connectedUsers = new Map();

const initializeSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${socket.user.name} (${userId})`);

    // Store user connection
    connectedUsers.set(userId, socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Update user status to online
    await User.findByIdAndUpdate(userId, { status: 'online' });

    // Join all conversation rooms
    const conversations = await Conversation.find({ participants: userId });
    conversations.forEach(conv => {
      socket.join(`conversation:${conv._id}`);
    });

    // Broadcast user online status
    socket.broadcast.emit('user:status', { userId, status: 'online' });

    // Handle joining a conversation room
    socket.on('conversation:join', async (conversationId) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });

        if (conversation) {
          socket.join(`conversation:${conversationId}`);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    // Handle leaving a conversation room
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle typing indicator
    socket.on('typing:start', async ({ conversationId }) => {
      try {
        socket.to(`conversation:${conversationId}`).emit('typing:start', {
          conversationId,
          userId,
          userName: socket.user.name
        });
      } catch (error) {
        console.error('Typing start error:', error);
      }
    });

    socket.on('typing:stop', async ({ conversationId }) => {
      try {
        socket.to(`conversation:${conversationId}`).emit('typing:stop', {
          conversationId,
          userId
        });
      } catch (error) {
        console.error('Typing stop error:', error);
      }
    });

    // Handle sending messages via socket
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, type = 'text', replyTo, attachments } = data;

        // Verify user is in conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });

        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Create message
        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          content,
          type,
          replyTo,
          attachments: attachments || []
        });

        await message.populate('sender', 'name email avatar avatarColor');
        if (replyTo) {
          await message.populate('replyTo', 'content sender');
        }

        // Update conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          updatedAt: new Date()
        });

        // Emit to all participants in the conversation
        io.to(`conversation:${conversationId}`).emit('message:new', {
          conversationId,
          message
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Handle message reactions
    socket.on('message:react', async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        // Remove existing reaction and add new one
        message.reactions = message.reactions.filter(
          r => r.user.toString() !== userId
        );
        message.reactions.push({ user: userId, emoji });
        await message.save();

        io.to(`conversation:${message.conversation}`).emit('message:reaction', {
          messageId,
          userId,
          emoji,
          reactions: message.reactions
        });
      } catch (error) {
        console.error('Reaction error:', error);
      }
    });

    // Handle read receipts
    socket.on('message:read', async ({ conversationId, messageIds }) => {
      try {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversation: conversationId,
            sender: { $ne: userId }
          },
          {
            $addToSet: {
              readBy: { user: userId, readAt: new Date() }
            }
          }
        );

        socket.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          userId,
          messageIds,
          readAt: new Date()
        });
      } catch (error) {
        console.error('Read receipt error:', error);
      }
    });

    // Handle user status updates
    socket.on('user:status:update', async (status) => {
      if (['online', 'away', 'busy', 'offline'].includes(status)) {
        await User.findByIdAndUpdate(userId, { status });
        socket.broadcast.emit('user:status', { userId, status });
      }
    });

    // Handle video/voice call signaling
    socket.on('call:initiate', async ({ conversationId, type, targetUserId }) => {
      try {
        io.to(`user:${targetUserId}`).emit('call:incoming', {
          conversationId,
          type, // 'video' or 'audio'
          callerId: userId,
          callerName: socket.user.name,
          callerAvatar: socket.user.avatar
        });
      } catch (error) {
        console.error('Call initiate error:', error);
      }
    });

    socket.on('call:accept', async ({ conversationId, callerId }) => {
      io.to(`user:${callerId}`).emit('call:accepted', {
        conversationId,
        accepterId: userId
      });
    });

    socket.on('call:reject', async ({ conversationId, callerId }) => {
      io.to(`user:${callerId}`).emit('call:rejected', {
        conversationId,
        rejecterId: userId
      });
    });

    socket.on('call:end', async ({ conversationId, participants }) => {
      participants.forEach(participantId => {
        if (participantId !== userId) {
          io.to(`user:${participantId}`).emit('call:ended', {
            conversationId,
            endedBy: userId
          });
        }
      });
    });

    // WebRTC signaling
    socket.on('webrtc:offer', async ({ targetUserId, offer }) => {
      io.to(`user:${targetUserId}`).emit('webrtc:offer', {
        fromUserId: userId,
        offer
      });
    });

    socket.on('webrtc:answer', async ({ targetUserId, answer }) => {
      io.to(`user:${targetUserId}`).emit('webrtc:answer', {
        fromUserId: userId,
        answer
      });
    });

    socket.on('webrtc:ice-candidate', async ({ targetUserId, candidate }) => {
      io.to(`user:${targetUserId}`).emit('webrtc:ice-candidate', {
        fromUserId: userId,
        candidate
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.name}`);
      connectedUsers.delete(userId);

      // Update user status to offline
      await User.findByIdAndUpdate(userId, {
        status: 'offline',
        lastSeen: new Date()
      });

      // Broadcast offline status
      socket.broadcast.emit('user:status', {
        userId,
        status: 'offline',
        lastSeen: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

// Helper function to get socket ID for a user
const getSocketId = (userId) => {
  return connectedUsers.get(userId);
};

// Helper function to check if user is online
const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

// Helper function to get all connected user IDs
const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};

module.exports = {
  initializeSocket,
  getSocketId,
  isUserOnline,
  getConnectedUsers
};
