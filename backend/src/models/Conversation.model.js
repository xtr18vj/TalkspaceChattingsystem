const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Group specific fields
  groupName: {
    type: String,
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  groupDescription: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  groupAvatar: {
    type: String,
    default: null
  },
  groupAvatarColor: {
    type: String,
    default: '#7e22ce'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ type: 1 });

// Method to get conversation for a specific user
conversationSchema.methods.getForUser = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  return {
    ...this.toObject(),
    isMuted: participant?.isMuted || false,
    isPinned: participant?.isPinned || false,
    isArchived: participant?.isArchived || false
  };
};

// Static method to find or create private conversation
conversationSchema.statics.findOrCreatePrivate = async function(user1Id, user2Id) {
  let conversation = await this.findOne({
    type: 'private',
    'participants.user': { $all: [user1Id, user2Id] },
    $expr: { $eq: [{ $size: '$participants' }, 2] }
  }).populate('participants.user', 'name avatar avatarColor status lastSeen')
    .populate('lastMessage');

  if (!conversation) {
    conversation = await this.create({
      type: 'private',
      participants: [
        { user: user1Id, role: 'member' },
        { user: user2Id, role: 'member' }
      ]
    });
    await conversation.populate('participants.user', 'name avatar avatarColor status lastSeen');
  }

  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
