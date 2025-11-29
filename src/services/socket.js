import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // Join a conversation room
  joinConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('conversation:join', conversationId);
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('conversation:leave', conversationId);
    }
  }

  // Send typing indicator
  startTyping(conversationId) {
    if (this.socket) {
      this.socket.emit('typing:start', { conversationId });
    }
  }

  stopTyping(conversationId) {
    if (this.socket) {
      this.socket.emit('typing:stop', { conversationId });
    }
  }

  // Send message via socket (real-time)
  sendMessage(data) {
    if (this.socket) {
      this.socket.emit('message:send', data);
    }
  }

  // Send reaction
  sendReaction(messageId, emoji) {
    if (this.socket) {
      this.socket.emit('message:react', { messageId, emoji });
    }
  }

  // Mark messages as read
  markAsRead(conversationId, messageIds) {
    if (this.socket) {
      this.socket.emit('message:read', { conversationId, messageIds });
    }
  }

  // Update user status
  updateStatus(status) {
    if (this.socket) {
      this.socket.emit('user:status:update', status);
    }
  }

  // Call signaling
  initiateCall(conversationId, type, targetUserId) {
    if (this.socket) {
      this.socket.emit('call:initiate', { conversationId, type, targetUserId });
    }
  }

  acceptCall(conversationId, callerId) {
    if (this.socket) {
      this.socket.emit('call:accept', { conversationId, callerId });
    }
  }

  rejectCall(conversationId, callerId) {
    if (this.socket) {
      this.socket.emit('call:reject', { conversationId, callerId });
    }
  }

  endCall(conversationId, participants) {
    if (this.socket) {
      this.socket.emit('call:end', { conversationId, participants });
    }
  }

  // WebRTC signaling
  sendOffer(targetUserId, offer) {
    if (this.socket) {
      this.socket.emit('webrtc:offer', { targetUserId, offer });
    }
  }

  sendAnswer(targetUserId, answer) {
    if (this.socket) {
      this.socket.emit('webrtc:answer', { targetUserId, answer });
    }
  }

  sendIceCandidate(targetUserId, candidate) {
    if (this.socket) {
      this.socket.emit('webrtc:ice-candidate', { targetUserId, candidate });
    }
  }

  // Event listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store listener for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    }
  }

  // Convenience methods for common events
  onNewMessage(callback) {
    this.on('message:new', callback);
  }

  onMessageEdit(callback) {
    this.on('message:edit', callback);
  }

  onMessageDelete(callback) {
    this.on('message:delete', callback);
  }

  onMessageReaction(callback) {
    this.on('message:reaction', callback);
  }

  onMessageRead(callback) {
    this.on('message:read', callback);
  }

  onTypingStart(callback) {
    this.on('typing:start', callback);
  }

  onTypingStop(callback) {
    this.on('typing:stop', callback);
  }

  onUserStatus(callback) {
    this.on('user:status', callback);
  }

  onNewConversation(callback) {
    this.on('conversation:new', callback);
  }

  onConversationUpdate(callback) {
    this.on('conversation:update', callback);
  }

  onIncomingCall(callback) {
    this.on('call:incoming', callback);
  }

  onCallAccepted(callback) {
    this.on('call:accepted', callback);
  }

  onCallRejected(callback) {
    this.on('call:rejected', callback);
  }

  onCallEnded(callback) {
    this.on('call:ended', callback);
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
