const User = require('../models/User.model');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -contacts -settings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, bio, phone, avatarColor } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (avatarColor) updateData.avatarColor = avatarColor;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const { notifications, soundEnabled, darkMode, showOnlineStatus, showLastSeen, showReadReceipts } = req.body;

    const settings = {};
    if (notifications !== undefined) settings['settings.notifications'] = notifications;
    if (soundEnabled !== undefined) settings['settings.soundEnabled'] = soundEnabled;
    if (darkMode !== undefined) settings['settings.darkMode'] = darkMode;
    if (showOnlineStatus !== undefined) settings['settings.showOnlineStatus'] = showOnlineStatus;
    if (showLastSeen !== undefined) settings['settings.showLastSeen'] = showLastSeen;
    if (showReadReceipts !== undefined) settings['settings.showReadReceipts'] = showReadReceipts;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      settings,
      { new: true }
    ).select('settings');

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings: user.settings }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search?q=query
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name email avatar avatarColor status lastSeen')
      .limit(20);

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
};

// @desc    Get user contacts
// @route   GET /api/users/contacts
// @access  Private
const getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('contacts.user', 'name email avatar avatarColor status lastSeen bio');

    const contacts = user.contacts
      .filter(c => !c.isBlocked && c.user)
      .map(c => ({
        ...c.user.toObject(),
        isFavorite: c.isFavorite,
        addedAt: c.addedAt
      }));

    res.json({
      success: true,
      data: { contacts }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts'
    });
  }
};

// @desc    Add contact
// @route   POST /api/users/contacts/:userId
// @access  Private
const addContact = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself as a contact'
      });
    }

    // Check if user exists
    const contactUser = await User.findById(userId);
    if (!contactUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already a contact
    const user = await User.findById(req.user._id);
    const existingContact = user.contacts.find(c => c.user.toString() === userId);

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'User is already in your contacts'
      });
    }

    // Add contact
    user.contacts.push({ user: userId });
    await user.save();

    res.json({
      success: true,
      message: 'Contact added successfully',
      data: {
        contact: {
          _id: contactUser._id,
          name: contactUser.name,
          email: contactUser.email,
          avatar: contactUser.avatar,
          avatarColor: contactUser.avatarColor,
          status: contactUser.status,
          lastSeen: contactUser.lastSeen
        }
      }
    });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding contact'
    });
  }
};

// @desc    Remove contact
// @route   DELETE /api/users/contacts/:userId
// @access  Private
const removeContact = async (req, res) => {
  try {
    const { userId } = req.params;

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { contacts: { user: userId } }
    });

    res.json({
      success: true,
      message: 'Contact removed successfully'
    });
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing contact'
    });
  }
};

// @desc    Block/Unblock user
// @route   PUT /api/users/contacts/:userId/block
// @access  Private
const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user._id);

    const contactIndex = user.contacts.findIndex(c => c.user.toString() === userId);

    if (contactIndex === -1) {
      // Add as blocked contact
      user.contacts.push({ user: userId, isBlocked: true });
    } else {
      // Toggle block status
      user.contacts[contactIndex].isBlocked = !user.contacts[contactIndex].isBlocked;
    }

    await user.save();

    const isBlocked = contactIndex === -1 ? true : user.contacts[contactIndex].isBlocked;

    res.json({
      success: true,
      message: isBlocked ? 'User blocked' : 'User unblocked',
      data: { isBlocked }
    });
  } catch (error) {
    console.error('Toggle block error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating block status'
    });
  }
};

// @desc    Toggle favorite contact
// @route   PUT /api/users/contacts/:userId/favorite
// @access  Private
const toggleFavorite = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user._id);

    const contact = user.contacts.find(c => c.user.toString() === userId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    contact.isFavorite = !contact.isFavorite;
    await user.save();

    res.json({
      success: true,
      message: contact.isFavorite ? 'Added to favorites' : 'Removed from favorites',
      data: { isFavorite: contact.isFavorite }
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating favorite status'
    });
  }
};

// @desc    Update user status
// @route   PUT /api/users/status
// @access  Private
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['online', 'offline', 'away', 'busy'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      status,
      lastSeen: status === 'offline' ? new Date() : undefined
    });

    // Emit status change via socket
    const io = req.app.get('io');
    io.emit('user:status', { userId: req.user._id, status });

    res.json({
      success: true,
      message: 'Status updated',
      data: { status }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });
  }
};

module.exports = {
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
};
