const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
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
} = require('../controllers/conversation.controller');

// All routes are protected
router.use(protect);

// Get conversations
router.get('/', getConversations);
router.get('/:id', getConversation);

// Create conversations
router.post('/private', createPrivateConversation);
router.post('/group', createGroupConversation);

// Group management
router.put('/:id/group', updateGroupInfo);
router.post('/:id/participants', addParticipants);
router.delete('/:id/participants/:userId', removeParticipant);

// Admin management
router.put('/:id/admins/:userId', makeAdmin);
router.delete('/:id/admins/:userId', removeAdmin);

// Conversation actions
router.put('/:id/pin', togglePin);
router.put('/:id/mute', toggleMute);
router.put('/:id/archive', toggleArchive);

// Delete/Clear
router.delete('/:id', deleteConversation);
router.delete('/:id/messages', clearHistory);

module.exports = router;
