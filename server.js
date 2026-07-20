require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const DEVICE_ID = process.env.DEVICE_ID || '7661282127673091851';
const SESSION_ID = process.env.SESSION_ID || '1731667042109801711';

if (!AUTH_TOKEN) {
  console.error('❌ Thiếu AUTH_TOKEN trong file .env');
  process.exit(1);
}

const getHeaders = () => ({
  'authorization': `Bearer ${AUTH_TOKEN}`,
  'content-type': 'application/connect+json',
  'connect-protocol-version': '1',
  'r-timezone': 'Asia/Saigon',
  'x-language': 'vi',
  'x-msh-device-id': DEVICE_ID,
  'x-msh-platform': 'web',
  'x-msh-session-id': SESSION_ID,
  'x-msh-version': '2.0.0',
  'origin': 'https://www.kimi.com',
  'referer': 'https://www.kimi.com/',
  'user-agent': 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',
  'accept-encoding': 'identity',
});

function extractText(responseText) {
  let fullText = '';
  try {
    const lines = responseText.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      // Strip gRPC-web prefix (5 bytes binary header)
      const jsonStr = line.replace(/^[^\[{]*/, '');
      if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) continue;

      const events = jsonStr.startsWith('[') ? JSON.parse(jsonStr) : [JSON.parse(jsonStr)];
      for (const event of events) {
        if (event.op === 'append' && event.mask === 'block.text.content') {
          fullText += event.block?.text?.content || '';
        }
        if (event.op === 'set' && event.mask === 'block.text') {
          fullText += event.block?.text?.content || '';
        }
      }
    }
  } catch (e) {
    console.error('Extract error:', e.message);
  }
  return fullText;
}

app.get('/', (req, res) => {
  res.json({ status: 'Kimi Proxy running 🚀' });
});

app.post('/proxy', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Thiếu prompt' });

  try {
    const payload = {
      scenario: 'SCENARIO_K2D5',
      tools: [
        { type: 'TOOL_TYPE_SEARCH', search: {} },
        { type: 'TOOL_TYPE_CRON_JOB' }
      ],
      message: {
        role: 'user',
        blocks: [{ message_id: '', text: { content: prompt } }],
        scenario: 'SCENARIO_K2D5',
        is_goal: false
      },
      options: {
        thinking: false,
        enable_plugin: false,
        reasoning_effort: 'REASONING_EFFORT_NONE'
      },
      project_id: ''
    };

    console.log('📤 Sending request to Kimi...');
    const response = await fetch(
      'https://www.kimi.com/apiv2/kimi.gateway.chat.v1.ChatService/Chat',
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      }
    );

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Raw (300):', text.slice(0, 300));

    if (!response.ok) {
      return res.status(response.status).json({ error: `Kimi error: ${response.status}` });
    }

    const extracted = extractText(text);
    if (extracted) {
      console.log('✅ Response:', extracted.slice(0, 100));
      res.json({ response: extracted });
    } else {
      res.json({ response: text.slice(0, 2000), raw: true });
    }

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Kimi Proxy chạy tại http://localhost:${PORT}`);
});
