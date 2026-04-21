const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Salon Premium API' });
});

// RESEND EMAIL ENDPOINT
const RESEND_API_KEY = process.env.RESEND_API_KEY;

app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, reply_to } = req.body;

    if (!RESEND_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'RESEND_API_KEY not configured' 
      });
    }

    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, subject, html' 
      });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: to,
        subject: subject,
        html: html,
        reply_to: reply_to || 'contact@salon.ae'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Email sent to ${to}`);
      res.json({ success: true, data: data });
    } else {
      console.error('RESEND error:', data);
      res.status(response.status).json({ success: false, error: data.message || 'Failed to send email' });
    }
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
