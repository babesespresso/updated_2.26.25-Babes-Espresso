import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import path from 'path';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db, initializeDatabase } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS for development
app.use(cors({
  origin: ['http://localhost:3003', 'http://localhost:3002', 'http://localhost:3001', 'http://localhost:3004'],
  credentials: true
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Serve static files
  if (process.env.NODE_ENV === 'development') {
    // In development, serve uploads directly
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }));
    app.use('/uploads', express.static(path.join(process.cwd(), 'client/public/uploads'), {
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }));
    
    // Setup Vite for development
    await setupVite(app, server);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(process.cwd(), "client/dist")));
    app.use('/uploads', express.static(path.join(process.cwd(), "uploads"), {
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }));
    app.use('/uploads', express.static(path.join(process.cwd(), "client/public/uploads"), {
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }));
  }

  // API error handler
  app.use("/api", (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Only include error details in development
    const response: any = { message };
    if (app.get('env') === 'development') {
      response.error = err.toString();
      response.stack = err.stack;
    }
    
    res.status(status).json(response);
  });

  // Handle client-side routing - must be after API routes
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "client/dist/index.html"));
  });

  try {
    // Initialize database and create admin user
    await initializeDatabase();

    // Start server
    const PORT = process.env.PORT || 3003;
    server.listen({
      port: PORT,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${PORT}`);
    });
    
    // Add proper error handling for the server
    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });
    
    // Handle process termination signals
    process.on('SIGINT', () => {
      console.log('Received SIGINT. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed. Exiting process.');
        process.exit(0);
      });
    });
    
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed. Exiting process.');
        process.exit(0);
      });
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Promise Rejection:', reason);
      // Don't exit the process, just log the error
    });
    
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
})();
