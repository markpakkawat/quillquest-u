const express = require('express');
const router = express.Router();
const { requestPasswordReset, resetPassword } = require('../controllers/resetPasswordController');

router.post('/reset-password', requestPasswordReset);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
