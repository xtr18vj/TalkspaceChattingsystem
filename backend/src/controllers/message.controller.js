const Message = require('../models/Message.model');
const Conversation = require('../models/Conversation.model');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const query = { conversation: conversationId, isDeleted: false };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar avatarColor')
      .populate('replyTo', 'content sender')
      .populate('reactions.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Message.countDocuments(query);

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          hasMore: total > parseInt(page) * parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text', replyTo, attachments } = req.body;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content,
      type,
      replyTo,
      attachments: attachments || []
    });

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date()
    });

    // Populate sender info
    await message.populate('sender', 'name email avatar avatarColor');
    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Emit to socket
    const io = req.app.get('io');
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user._id.toString()) {
        io.to(`user:${participantId}`).emit('message:new', {
          conversationId,
          message
        });
      }
    });

    res.status(201).json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// @desc    Upload attachment
// @route   POST /api/messages/upload
// @access  Private
const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.file;
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    
    res.json({
      success: true,
      data: {
        attachment: {
          id: fileId,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
          type: getFileType(file.mimetype)
        }
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:messageId/reactions
// @access  Private
const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      r => r.user.toString() !== req.user._id.toString()
    );

    // Add new reaction
    message.reactions.push({
      user: req.user._id,
      emoji
    });

    await message.save();

    // Emit to socket
    const io = req.app.get('io');
    io.to(`conversation:${message.conversation}`).emit('message:reaction', {
      messageId,
      userId: req.user._id,
      emoji
    });

    res.json({
      success: true,
      data: { reactions: message.reactions }
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reaction'
    });
  }
};

// @desc    Remove reaction from message
// @route   DELETE /api/messages/:messageId/reactions
// @access  Private
const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.reactions = message.reactions.filter(
      r => r.user.toString() !== req.user._id.toString()
    );

    await message.save();

    // Emit to socket
    const io = req.app.get('io');
    io.to(`conversation:${message.conversation}`).emit('message:reaction:remove', {
      messageId,
      userId: req.user._id
    });

    res.json({
      success: true,
      data: { reactions: message.reactions }
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing reaction'
    });
  }
};

// @desc    Edit message
// @route   PUT /api/messages/:messageId
// @access  Private
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findOne({
      _id: messageId,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or not authorized'
      });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // Emit to socket
    const io = req.app.get('io');
    io.to(`conversation:${message.conversation}`).emit('message:edit', {
      messageId,
      content,
      editedAt: message.editedAt
    });

    res.json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error editing message'
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { forEveryone } = req.query;

    const message = await Message.findOne({
      _id: messageId,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or not authorized'
      });
    }

    if (forEveryone === 'true') {
      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();

      // Emit to socket
      const io = req.app.get('io');
      io.to(`conversation:${message.conversation}`).emit('message:delete', {
        messageId,
        deletedAt: message.deletedAt
      });
    } else {
      // Delete only for this user (add to deletedFor array)
      if (!message.deletedFor) message.deletedFor = [];
      message.deletedFor.push(req.user._id);
      await message.save();
    }

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:conversationId/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageIds } = req.body;

    const query = {
      conversation: conversationId,
      sender: { $ne: req.user._id },
      'readBy.user': { $ne: req.user._id }
    };

    if (messageIds && messageIds.length > 0) {
      query._id = { $in: messageIds };
    }

    const result = await Message.updateMany(query, {
      $push: {
        readBy: {
          user: req.user._id,
          readAt: new Date()
        }
      },
      $set: { status: 'read' }
    });

    // Emit read receipts
    const io = req.app.get('io');
    io.to(`conversation:${conversationId}`).emit('message:read', {
      conversationId,
      userId: req.user._id,
      readAt: new Date()
    });

    res.json({
      success: true,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read'
    });
  }
};

// @desc    Forward message
// @route   POST /api/messages/:messageId/forward
// @access  Private
const forwardMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { conversationIds } = req.body;

    const originalMessage = await Message.findById(messageId);

    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const forwardedMessages = [];

    for (const convId of conversationIds) {
      // Verify user is part of conversation
      const conversation = await Conversation.findOne({
        _id: convId,
        participants: req.user._id
      });

      if (conversation) {
        const newMessage = await Message.create({
          conversation: convId,
          sender: req.user._id,
          content: originalMessage.content,
          type: originalMessage.type,
          attachments: originalMessage.attachments,
          isForwarded: true,
          forwardedFrom: {
            messageId: originalMessage._id,
            originalSender: originalMessage.sender,
            originalDate: originalMessage.createdAt
          }
        });

        await newMessage.populate('sender', 'name email avatar avatarColor');
        forwardedMessages.push(newMessage);

        // Update conversation
        await Conversation.findByIdAndUpdate(convId, {
          lastMessage: newMessage._id,
          updatedAt: new Date()
        });

        // Emit to socket
        const io = req.app.get('io');
        conversation.participants.forEach(participantId => {
          if (participantId.toString() !== req.user._id.toString()) {
            io.to(`user:${participantId}`).emit('message:new', {
              conversationId: convId,
              message: newMessage
            });
          }
        });
      }
    }

    res.json({
      success: true,
      data: { messages: forwardedMessages }
    });
  } catch (error) {
    console.error('Forward message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error forwarding message'
    });
  }
};

// @desc    Pin/Unpin message
// @route   PUT /api/messages/:messageId/pin
// @access  Private
const togglePinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.isPinned = !message.isPinned;
    message.pinnedBy = message.isPinned ? req.user._id : null;
    message.pinnedAt = message.isPinned ? new Date() : null;
    await message.save();

    // Emit to socket
    const io = req.app.get('io');
    io.to(`conversation:${message.conversation}`).emit('message:pin', {
      messageId,
      isPinned: message.isPinned,
      pinnedBy: req.user._id
    });

    res.json({
      success: true,
      message: message.isPinned ? 'Message pinned' : 'Message unpinned',
      data: { isPinned: message.isPinned }
    });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error pinning message'
    });
  }
};

// @desc    Search messages in conversation
// @route   GET /api/messages/:conversationId/search
// @access  Private
const searchMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
      content: { $regex: q, $options: 'i' },
      isDeleted: false
    })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching messages'
    });
  }
};

// Helper function to determine file type
function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

module.exports = {
  getMessages,
  sendMessage,
  uploadAttachment,
  addReaction,
  removeReaction,
  editMessage,
  deleteMessage,
  markAsRead,
  forwardMessage,
  togglePinMessage,
  searchMessages
};
