const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth.middleware');
const {
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
} = require('../controllers/message.controller');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, videos, audio, and common document types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'application/zip', 'application/x-rar-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// All routes are protected
router.use(protect);

// Message routes
router.get('/:conversationId', getMessages);
router.get('/:conversationId/search', searchMessages);
router.post('/', sendMessage);
router.post('/upload', upload.single('file'), uploadAttachment);

// Message actions
router.put('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);
router.put('/:conversationId/read', markAsRead);

// Reactions
router.post('/:messageId/reactions', addReaction);
router.delete('/:messageId/reactions', removeReaction);

// Forward and Pin
router.post('/:messageId/forward', forwardMessage);
router.put('/:messageId/pin', togglePinMessage);

module.exports = router;
