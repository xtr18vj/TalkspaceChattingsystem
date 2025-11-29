const Conversation = require('../models/Conversation.model');
const Message = require('../models/Message.model');
const User = require('../models/User.model');

// @desc    Get all conversations for user
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const { type, archived } = req.query;

    const query = {
      participants: req.user._id
    };

    if (type) query.type = type;
    if (archived === 'true') {
      query['archivedBy.user'] = req.user._id;
    } else {
      query['archivedBy.user'] = { $ne: req.user._id };
    }

    const conversations = await Conversation.find(query)
      .populate('participants', 'name email avatar avatarColor status lastSeen')
      .populate('lastMessage')
      .populate('groupInfo.admins', 'name avatar')
      .sort({ updatedAt: -1 });

    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id },
          isDeleted: false
        });

        const convObj = conv.toObject();
        convObj.unreadCount = unreadCount;

        // For private chats, add the other user's info
        if (conv.type === 'private') {
          const otherUser = conv.participants.find(
            p => p._id.toString() !== req.user._id.toString()
          );
          convObj.otherUser = otherUser;
        }

        return convObj;
      })
    );

    res.json({
      success: true,
      data: { conversations: conversationsWithUnread }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations'
    });
  }
};

// @desc    Get single conversation
// @route   GET /api/conversations/:id
// @access  Private
const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    })
      .populate('participants', 'name email avatar avatarColor status lastSeen bio')
      .populate('lastMessage')
      .populate('groupInfo.admins', 'name avatar');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation'
    });
  }
};

// @desc    Create or get private conversation
// @route   POST /api/conversations/private
// @access  Private
const createPrivateConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself'
      });
    }

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      type: 'private',
      participants: { $all: [req.user._id, userId], $size: 2 }
    }).populate('participants', 'name email avatar avatarColor status lastSeen');

    if (conversation) {
      return res.json({
        success: true,
        data: { conversation },
        existing: true
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      type: 'private',
      participants: [req.user._id, userId],
      createdBy: req.user._id
    });

    await conversation.populate('participants', 'name email avatar avatarColor status lastSeen');

    res.status(201).json({
      success: true,
      data: { conversation },
      existing: false
    });
  } catch (error) {
    console.error('Create private conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating conversation'
    });
  }
};

// @desc    Create group conversation
// @route   POST /api/conversations/group
// @access  Private
const createGroupConversation = async (req, res) => {
  try {
    const { name, description, participants, avatar } = req.body;

    if (!name || !participants || participants.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Group name and at least one participant required'
      });
    }

    // Include creator in participants
    const allParticipants = [...new Set([req.user._id.toString(), ...participants])];

    const conversation = await Conversation.create({
      type: 'group',
      participants: allParticipants,
      createdBy: req.user._id,
      groupInfo: {
        name,
        description: description || '',
        avatar: avatar || '',
        admins: [req.user._id],
        createdBy: req.user._id
      }
    });

    await conversation.populate('participants', 'name email avatar avatarColor status');
    await conversation.populate('groupInfo.admins', 'name avatar');

    // Notify participants via socket
    const io = req.app.get('io');
    allParticipants.forEach(participantId => {
      if (participantId.toString() !== req.user._id.toString()) {
        io.to(`user:${participantId}`).emit('conversation:new', {
          conversation
        });
      }
    });

    res.status(201).json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating group'
    });
  }
};

// @desc    Update group info
// @route   PUT /api/conversations/:id/group
// @access  Private (Admin only)
const updateGroupInfo = async (req, res) => {
  try {
    const { name, description, avatar } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      type: 'group',
      'groupInfo.admins': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or not authorized'
      });
    }

    if (name) conversation.groupInfo.name = name;
    if (description !== undefined) conversation.groupInfo.description = description;
    if (avatar !== undefined) conversation.groupInfo.avatar = avatar;

    await conversation.save();

    // Notify participants
    const io = req.app.get('io');
    io.to(`conversation:${conversation._id}`).emit('conversation:update', {
      conversationId: conversation._id,
      groupInfo: conversation.groupInfo
    });

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating group'
    });
  }
};

// @desc    Add participants to group
// @route   POST /api/conversations/:id/participants
// @access  Private (Admin only)
const addParticipants = async (req, res) => {
  try {
    const { userIds } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      type: 'group',
      'groupInfo.admins': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or not authorized'
      });
    }

    // Add new participants
    const newParticipants = userIds.filter(
      id => !conversation.participants.includes(id)
    );

    conversation.participants.push(...newParticipants);
    await conversation.save();

    await conversation.populate('participants', 'name email avatar avatarColor status');

    // Notify new participants
    const io = req.app.get('io');
    newParticipants.forEach(userId => {
      io.to(`user:${userId}`).emit('conversation:new', { conversation });
    });

    // Notify existing participants
    io.to(`conversation:${conversation._id}`).emit('conversation:participants:add', {
      conversationId: conversation._id,
      newParticipants
    });

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    console.error('Add participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding participants'
    });
  }
};

// @desc    Remove participant from group
// @route   DELETE /api/conversations/:id/participants/:userId
// @access  Private (Admin only or self)
const removeParticipant = async (req, res) => {
  try {
    const { userId } = req.params;
    const isSelf = userId === req.user._id.toString();

    const query = {
      _id: req.params.id,
      type: 'group'
    };

    // Allow self-removal or admin removal
    if (!isSelf) {
      query['groupInfo.admins'] = req.user._id;
    }

    const conversation = await Conversation.findOne(query);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or not authorized'
      });
    }

    // Remove participant
    conversation.participants = conversation.participants.filter(
      p => p.toString() !== userId
    );

    // Remove from admins if applicable
    conversation.groupInfo.admins = conversation.groupInfo.admins.filter(
      a => a.toString() !== userId
    );

    await conversation.save();

    // Notify removed user
    const io = req.app.get('io');
    io.to(`user:${userId}`).emit('conversation:removed', {
      conversationId: conversation._id
    });

    // Notify other participants
    io.to(`conversation:${conversation._id}`).emit('conversation:participants:remove', {
      conversationId: conversation._id,
      userId
    });

    res.json({
      success: true,
      message: isSelf ? 'Left group successfully' : 'Participant removed'
    });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing participant'
    });
  }
};

// @desc    Make user admin
// @route   PUT /api/conversations/:id/admins/:userId
// @access  Private (Admin only)
const makeAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      type: 'group',
      'groupInfo.admins': req.user._id,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or not authorized'
      });
    }

    if (!conversation.groupInfo.admins.includes(userId)) {
      conversation.groupInfo.admins.push(userId);
      await conversation.save();
    }

    // Notify participants
    const io = req.app.get('io');
    io.to(`conversation:${conversation._id}`).emit('conversation:admin:add', {
      conversationId: conversation._id,
      userId
    });

    res.json({
      success: true,
      message: 'User is now an admin'
    });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error making admin'
    });
  }
};

// @desc    Remove admin
// @route   DELETE /api/conversations/:id/admins/:userId
// @access  Private (Admin only)
const removeAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      type: 'group',
      'groupInfo.admins': req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or not authorized'
      });
    }

    // Cannot remove the creator as admin
    if (conversation.groupInfo.createdBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group creator as admin'
      });
    }

    conversation.groupInfo.admins = conversation.groupInfo.admins.filter(
      a => a.toString() !== userId
    );
    await conversation.save();

    // Notify participants
    const io = req.app.get('io');
    io.to(`conversation:${conversation._id}`).emit('conversation:admin:remove', {
      conversationId: conversation._id,
      userId
    });

    res.json({
      success: true,
      message: 'Admin removed'
    });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing admin'
    });
  }
};

// @desc    Pin/Unpin conversation
// @route   PUT /api/conversations/:id/pin
// @access  Private
const togglePin = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isPinned = conversation.pinnedBy.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (isPinned) {
      conversation.pinnedBy = conversation.pinnedBy.filter(
        p => p.user.toString() !== req.user._id.toString()
      );
    } else {
      conversation.pinnedBy.push({ user: req.user._id });
    }

    await conversation.save();

    res.json({
      success: true,
      message: isPinned ? 'Conversation unpinned' : 'Conversation pinned',
      data: { isPinned: !isPinned }
    });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling pin'
    });
  }
};

// @desc    Mute/Unmute conversation
// @route   PUT /api/conversations/:id/mute
// @access  Private
const toggleMute = async (req, res) => {
  try {
    const { until } = req.body; // Optional: mute until a specific date

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isMuted = conversation.mutedBy.some(
      m => m.user.toString() === req.user._id.toString()
    );

    if (isMuted) {
      conversation.mutedBy = conversation.mutedBy.filter(
        m => m.user.toString() !== req.user._id.toString()
      );
    } else {
      conversation.mutedBy.push({
        user: req.user._id,
        until: until ? new Date(until) : null
      });
    }

    await conversation.save();

    res.json({
      success: true,
      message: isMuted ? 'Conversation unmuted' : 'Conversation muted',
      data: { isMuted: !isMuted }
    });
  } catch (error) {
    console.error('Toggle mute error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling mute'
    });
  }
};

// @desc    Archive/Unarchive conversation
// @route   PUT /api/conversations/:id/archive
// @access  Private
const toggleArchive = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isArchived = conversation.archivedBy.some(
      a => a.user.toString() === req.user._id.toString()
    );

    if (isArchived) {
      conversation.archivedBy = conversation.archivedBy.filter(
        a => a.user.toString() !== req.user._id.toString()
      );
    } else {
      conversation.archivedBy.push({ user: req.user._id });
    }

    await conversation.save();

    res.json({
      success: true,
      message: isArchived ? 'Conversation unarchived' : 'Conversation archived',
      data: { isArchived: !isArchived }
    });
  } catch (error) {
    console.error('Toggle archive error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling archive'
    });
  }
};

// @desc    Delete conversation
// @route   DELETE /api/conversations/:id
// @access  Private
const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // For groups, only admin/creator can delete
    if (conversation.type === 'group') {
      const isAdmin = conversation.groupInfo.admins.some(
        a => a.toString() === req.user._id.toString()
      );

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete groups'
        });
      }

      // Delete all messages and the conversation
      await Message.deleteMany({ conversation: conversation._id });
      await conversation.deleteOne();

      // Notify all participants
      const io = req.app.get('io');
      conversation.participants.forEach(userId => {
        io.to(`user:${userId}`).emit('conversation:deleted', {
          conversationId: conversation._id
        });
      });
    } else {
      // For private chats, just mark as deleted for this user
      if (!conversation.deletedFor) conversation.deletedFor = [];
      conversation.deletedFor.push(req.user._id);
      await conversation.save();
    }

    res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting conversation'
    });
  }
};

// @desc    Clear conversation history
// @route   DELETE /api/conversations/:id/messages
// @access  Private
const clearHistory = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Mark all messages as deleted for this user
    await Message.updateMany(
      { conversation: conversation._id },
      { $addToSet: { deletedFor: req.user._id } }
    );

    res.json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing history'
    });
  }
};

module.exports = {
  getConversations,
  getConversation,
  createPrivateConversation,
  createGroupConversation,
  updateGroupInfo,
  addParticipants,
  removeParticipant,
  makeAdmin,
  removeAdmin,
  togglePin,
  toggleMute,
  toggleArchive,
  deleteConversation,
  clearHistory
};
