// src/routes/util.js
const { Router } = require('express');
const { testEmail } = require('../../controllers/blueboxx/util.controller');

const router = Router();

// POST /api/util/test-email
router.post('/test-email', testEmail);

module.exports = router;
