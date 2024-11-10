// backend/routes/groq.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Add options handler
router.options('/openai/v1/chat/completions', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

router.post('/openai/v1/chat/completions', async (req, res) => {
  try {
    console.log('Proxying to Groq:', {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      body: req.body
    });

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Groq response received');
    res.json(response.data);
  } catch (error) {
    console.error('Groq API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Failed to process request'
    });
  }
});

module.exports = router;