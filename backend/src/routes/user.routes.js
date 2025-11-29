const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getUserById,
  updateProfile,
  updateSettings,
  searchUsers,
  getContacts,
  addContact,
  removeContact,
  toggleBlockUser,
  toggleFavorite,
  updateStatus
} = require('../controllers/user.controller');

// All routes are protected
router.use(protect);

// Static routes first (before :id)
router.get('/search', searchUsers);
router.get('/contacts', getContacts);
router.put('/profile', updateProfile);
router.put('/settings', updateSettings);
router.put('/status', updateStatus);

// Contact routes (with params)
router.post('/contacts/:userId', addContact);
router.delete('/contacts/:userId', removeContact);
router.put('/contacts/:userId/block', toggleBlockUser);
router.put('/contacts/:userId/favorite', toggleFavorite);

// User by ID (last to avoid matching other routes)
router.get('/:id', getUserById);

module.exports = router;
