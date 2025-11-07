import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChatController } from './chat.controller';
import { appConfig } from '../../middleware/shared/config/app.config';
import { logger } from '../../middleware/shared/utils/logging.utils';
import { RequestWithUser } from '../../middleware/shared/types/base-request.types';
import { Request, Response, NextFunction } from 'express';

// Load environment variables
dotenv.config();

const app = express();
const chatController = new ChatController();

// Middleware
app.use(cors());
app.use(express.json());

// Simple client info middleware
app.use((req: any, res: Response, next: NextFunction) => {
  req.clientInfo = {
    platform: req.headers['user-agent'] || 'unknown',
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    timestamp: new Date().toISOString()
  };
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'llm-middleware-example'
  });
});

app.post('/api/chat', (req: any, res: Response) => {
  chatController.chat(req as RequestWithUser, res);
});

// Start server
const port = appConfig.server.port;

app.listen(port, () => {
  logger.info(`Simple Chat Example Server running on port ${port}`, {
    context: 'SimpleChatExample',
    metadata: {
      port,
      environment: appConfig.server.environment
    }
  });
  
  console.log(`\\n🚀 Simple Chat Example Server running on port ${port}`);
  console.log(`\\n📝 Test the API:`);
  console.log(`   Health check: GET http://localhost:${port}/health`);
  console.log(`   Chat endpoint: POST http://localhost:${port}/api/chat`);
  console.log(`   Example body: { "message": "Hello, how are you?" }`);
  console.log(`\\n🔧 Environment: ${appConfig.server.environment}\\n`);
});

export default app;