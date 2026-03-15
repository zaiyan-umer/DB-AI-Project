import http from 'http';
import app from './app';
import { env } from './config/env';
// import { initSocket } from './socket';

const PORT = env.BACKEND_PORT || 8000;
const server = http.createServer(app)

// initSocket(server)

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));