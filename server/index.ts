import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import path from 'path';
import cors from 'cors';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db, initializeDatabase } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";
import { createServer } from 'http';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure CORS with the cors package
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins for development
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'cache-control', 'pragma', 'Accept', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
}));

// Add explicit CORS headers to all responses as a backup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, cache-control, pragma, Accept, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

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
    app.use(express.static(path.join(process.cwd(), "../client/dist")));
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
  app.get("/test", (_req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "test.html"));
  });
  
  app.get("/", (_req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "test.html"));
  });
  
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "../client/dist/index.html"));
  });

  try {
    // Start the server
    (async () => {
      try {
        // Initialize the database first
        console.log('Initializing database...');
        await initializeDatabase();
        console.log('Database initialized successfully');
        
        // Create server instance
        const server = createServer(app);
        
        // Start server with port fallback
        const tryStartServer = async (port: number, maxRetries = 3, retryCount = 0) => {
          try {
            server.listen({
              port,
              host: "0.0.0.0",
            }, () => {
              log(`Server listening on port ${port}`);
            });
          } catch (err) {
            if (err.code === 'EADDRINUSE' && retryCount < maxRetries) {
              console.warn(`Port ${port} is in use, trying port ${port + 1}...`);
              await tryStartServer(port + 1, maxRetries, retryCount + 1);
            } else {
              console.error('Server error:', err);
              process.exit(1);
            }
          }
        };

        const PORT = parseInt(process.env.PORT || '3012', 10);
        await tryStartServer(PORT);
        
        // Add proper error handling for the server
        server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Please use a different port.`);
            // Close the database connection before exiting
            console.log('Closing SQLite database connection...');
            console.log('Database connection closed');
            process.exit(1);
          } else {
            console.error('Server error:', error);
            // Close the database connection before exiting
            console.log('Closing SQLite database connection...');
            console.log('Database connection closed');
            process.exit(1);
          }
        });
        
        // Handle process termination signals
        const gracefulShutdown = () => {
          console.log('Closing SQLite database connection...');
          try {
            // Close the database connection if it exists
            // For SQLite3 direct connection, we don't need to call $disconnect
            // The connection is closed after each query
            console.log('Database connection closed');
          } catch (err) {
            console.error('Error closing database connection:', err);
          }
          
          server.close(() => {
            console.log('Server closed');
            process.exit(0);
          });
        };
        
        process.on('SIGINT', () => {
          console.log('Received SIGINT. Shutting down gracefully...');
          gracefulShutdown();
        });
        
        process.on('SIGTERM', () => {
          console.log('Received SIGTERM. Shutting down gracefully...');
          gracefulShutdown();
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
    
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
})();
