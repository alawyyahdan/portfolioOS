const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const SITRANFER_API = 'https://rest.sitranfer.com/payment/api'; 
const API_KEY = process.env.API_KEY || 'ISI_KEY_ANDA_DISINI';

app.post('/api/generate', async (req, res) => {
  try {
    const { amount, player_username } = req.body;
    const response = await axios.post(`${SITRANFER_API}/generate`, {
      key: API_KEY,
      channel: 'QRIS',
      amount,
      player_username
    });
    res.json(response.data);
  } catch (error) {
    console.error('Generate Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message, error: error.response?.data });
  }
});

app.post('/api/status', async (req, res) => {
  try {
    const { transaction_id } = req.body;
    const response = await axios.post(`${SITRANFER_API}/status`, {
      key: API_KEY,
      transaction_id
    });
    res.json(response.data);
  } catch (error) {
    console.error('Status Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message, error: error.response?.data });
  }
});

app.post('/api/callback', (req, res) => {
  const callbackData = req.body;
  if (callbackData && callbackData.success && callbackData.data.status === 'success') {
     console.log('✅ CALLBACK RECEIVED: Pembayaran SUCCESS untuk TRX:', callbackData.data.transaction_id);
     // Di sini Anda bisa menambahkan proses top up coin/saldo jika menggunakan database
     res.json({ status: "ok" });
  } else {
     res.json({ status: "ignored" });
  }
});

const PORT = 3010;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
