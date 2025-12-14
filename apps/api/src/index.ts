import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiReference } from '@scalar/express-api-reference';
import { connectToDatabase } from '@hakkemni/models';
import { errorHandler } from './middleware/error-handler';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { medicalConditionRouter } from './routes/medical-condition.routes';
import { medicationRouter } from './routes/medication.routes';
import { allergyRouter } from './routes/allergy.routes';
import { lifestyleRouter } from './routes/lifestyle.routes';
import { documentRouter } from './routes/document.routes';
import { healthPassRouter } from './routes/health-pass.routes';
import { autocompleteRouter } from './routes/autocomplete.routes';
import { openApiSpec } from './docs/openapi';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow Scalar to load
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Documentation - Scalar
app.use(
  '/docs',
  apiReference({
    spec: {
      content: openApiSpec
    },
    theme: 'purple',
    layout: 'modern',
    darkMode: true,
    hideModels: false,
    hideDownloadButton: false,
    metaData: {
      title: 'Hakkemni HealthPass API',
      description: 'API Documentation for Hakkemni HealthPass'
    }
  })
);

// OpenAPI JSON endpoint
app.get('/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

// API Routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/medical-conditions', medicalConditionRouter);
apiRouter.use('/medications', medicationRouter);
apiRouter.use('/allergies', allergyRouter);
apiRouter.use('/lifestyles', lifestyleRouter);
apiRouter.use('/documents', documentRouter);
apiRouter.use('/health-passes', healthPassRouter);
apiRouter.use('/autocomplete', autocompleteRouter);

app.use('/api/v1', apiRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Start server
async function start() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hakkemni';
    await connectToDatabase({ uri: mongoUri });

    app.listen(PORT, () => {
      console.log(`🚀 Hakkemni API Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 API base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { app };

