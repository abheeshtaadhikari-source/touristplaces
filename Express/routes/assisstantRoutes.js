const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assisstantController');

// Expose POST endpoint to handle assistant queries
router.post('/chat', assistantController.chatWithAssistant);

module.exports = router;