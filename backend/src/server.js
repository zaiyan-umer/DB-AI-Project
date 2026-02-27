import app from './app.js'
import dotenv from 'dotenv'
dotenv.config();

const PORT = process.env.BACKENDPORT || 8000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));