const express = require('express');
const { getChatResponse } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, getChatResponse);

module.exports = router;
