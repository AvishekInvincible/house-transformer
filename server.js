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
      console.log('Sending request to Replicate... WORKING');
      let output;
      try {
        output = await replicate.run(
          "black-forest-labs/flux-canny-pro:c11bac58203ad24e54f5039f8c876c18e0edcd44a45dba343a82e69fea61a7d8",
          {
            input: {
              control_image: dataUrl,
              prompt: prompt,
              steps: 50,
              guidance: 25
            }
          }
        );
        console.log('Request from Replicate... RECEIVED', output);

        // Validate the output
        if (!output) {
          throw new Error('No output received from Replicate API');
        }

        // If output is a string (direct image URL)
        if (typeof output === 'string') {
          res.json({
            success: true,
            imageUrl: output
          });
        } 
        // If output is a ReadableStream
        else if (output instanceof ReadableStream) {
          const reader = output.getReader();
          const chunks = [];
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          
          // Combine chunks into a single Uint8Array
          const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
          let offset = 0;
          for (const chunk of chunks) {
            concatenated.set(chunk, offset);
            offset += chunk.length;
          }
          
          const base64 = Buffer.from(concatenated).toString('base64');
          const imageUrl = `data:image/jpeg;base64,${base64}`;
          
          res.json({
            success: true,
            imageUrl: imageUrl
          });
        }
        // If output is something else (like an object with image URL)
        else if (output && typeof output === 'object') {
          res.json({
            success: true,
            imageUrl: output.url || output.image || output
          });
        }
        else {
          throw new Error('Unexpected output format from Replicate API');
        }
      } catch (error) {
        console.error('Replicate API Error:', error);
        res.status(500).json({ 
          success: false,
          error: 'Error processing image with Replicate API: ' + (error.message || 'Unknown error')
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
