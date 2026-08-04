import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import applicationRoutes from './routes/applicationRoutes';

const app: Application = express();

// Middleware
const allowedOrigins = ['http://localhost:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    
    const isAllowed = allowedOrigins.indexOf(origin) !== -1;
    // Automatically match any Vercel preview subdomains for this project
    const isVercelPreview = origin.startsWith('https://job-application-tracker') && origin.endsWith('.vercel.app');
    
    if (isAllowed || isVercelPreview) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  }
}));
app.use(express.json());

// Basic Route for health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Backend is healthy and running' });
});

// A placeholder api route for future jobs features
app.get('/api/jobs', (req: Request, res: Response) => {
  res.status(200).json([
    { id: '1', company: 'Example Corp', title: 'Software Engineer', status: 'Applied', date: '2026-07-14' }
  ]);
});

// Register Application Routes
app.use('/api/applications', applicationRoutes);

// Global Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Middleware]:', err.stack || err);
  const status = err.status || 500;
  res.status(status).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

export default app;
