import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Initialization
  const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.post('/api/gemini/status', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
        return res.status(401).json({ error: 'API_KEY_NOT_CONFIGURED' });
      }

      const response = await genAI.models.generateContent({
        model: 'gemini-3.5-flash', 
        contents: [
          {
            text: "Generate a short, futuristic system status report (max 15 words) for Aether OS (HOLOSPIN X). Use tech jargon like 'flux capacity stabilized' or 'hologram mesh 99%'.",
          },
        ],
      });
      res.json({ report: response.text });
    } catch (error: any) {
      if (error.message?.includes('429') || error.status === 429 || error.message?.includes('quota')) {
        console.warn('Gemini Quota Exceeded - using fallback values');
        res.status(429).json({ 
          error: 'QUOTA_EXHAUSTED',
          fallback: "NEURAL_LINK_STABLE: Monitoring hologram integrity. All systems optimal."
        });
      } else if (error.message?.includes('leaked')) {
        res.status(403).json({ error: 'API_KEY_LEAKED' });
      } else {
        console.error('Gemini error:', error);
        res.status(500).json({ error: 'Failed to generate status report' });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
