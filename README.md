# House Style Transformer 🏠✨

Transform your house images into different architectural styles using AI.

## Features

- 🎨 Transform house images using AI
- 📱 Responsive design
- 🖼️ Drag and drop image upload
- ⬇️ Download transformed images
- 🔄 Regenerate transformations
- 🌙 Dark mode interface

## Setup

1. Clone the repository:
```bash
git clone <your-repository-url>
cd house-style-transformer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Add your Replicate API token to the `.env` file:
```
REPLICATE_API_TOKEN=your_token_here
```

5. Run the development server:
```bash
npm run dev
```

## Deployment on Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Add your environment variables to Vercel:
```bash
vercel env add REPLICATE_API_TOKEN
```

4. Deploy:
```bash
vercel
```

## Environment Variables

- `REPLICATE_API_TOKEN`: Your Replicate API token (required)
- `PORT`: Server port (optional, defaults to 3000)

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- AI: Replicate API
- Deployment: Vercel

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Created with 💖 by AVISHEK
