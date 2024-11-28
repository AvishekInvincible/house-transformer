import express from 'express';
import multer from 'multer';
import { readFile, unlink, writeFile, readdir } from 'node:fs/promises';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.use(express.static('public'));

let styleHistory = [];

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    console.log('File received:', req.file);
    console.log('Prompt:', req.body.prompt);

    // Use the buffer directly
    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;
    
    const prompt = req.body.prompt || "a photo of a house in a different style";

    // Create the data URL
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    console.log('Data URL length:', dataUrl.length);

    try {
      console.log('Sending request to Replicate...');
      const output = await replicate.run(
        "black-forest-labs/flux-canny-pro",
        {
          input: {
            control_image: dataUrl,
            prompt: prompt,
            steps: 50,
            guidance: 25
          }
        }
      );

      // Handle the stream response
      if (output instanceof ReadableStream) {
        const reader = output.getReader();
        const chunks = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        // Combine all chunks into a single Uint8Array
        const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          concatenated.set(chunk, offset);
          offset += chunk.length;
        }
        
        // Convert to base64
        const base64 = Buffer.from(concatenated).toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64}`;
        
        console.log('Generated image URL (base64)');
        
        res.json({ 
          success: true,
          imageUrl: imageUrl,
          originalPrompt: prompt
        });
      } else {
        console.log('Direct output:', output);
        res.json({ 
          success: true,
          imageUrl: output,
          originalPrompt: prompt
        });
      }
    } catch (error) {
      console.error('Detailed error:', error);
      res.status(500).json({ error: error.message || 'Error processing image' });
    }
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ error: error.message || 'Error processing image' });
  }
});

app.get('/gallery', async (req, res) => {
  try {
    const galleryPath = path.join(process.cwd(), 'public', 'gallery');
    const files = await readdir(galleryPath);
    const images = files
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
      .map(file => `/gallery/${file}`);
    res.json({ images });
  } catch (error) {
    console.error('Gallery error:', error);
    res.status(500).json({ error: 'Failed to load gallery' });
  }
});

app.post('/save-style', (req, res) => {
    const { prompt, imageUrl } = req.body;
    styleHistory.unshift({ prompt, imageUrl, timestamp: new Date() });
    if (styleHistory.length > 10) styleHistory.pop();
    res.json({ success: true });
});

app.get('/style-history', (req, res) => {
    res.json(styleHistory);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
