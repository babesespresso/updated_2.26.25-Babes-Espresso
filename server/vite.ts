import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // In development, proxy requests to the Vite dev server
  if (process.env.NODE_ENV === 'development') {
    // Serve uploads directory
    app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));
    
    app.use('/assets', (req, res) => {
      res.redirect(`http://localhost:3007${req.url}`);
    });

    app.use('/', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.redirect('http://localhost:3007');
    });
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, '..', 'client', 'dist');
  const publicPath = path.resolve(__dirname, 'public');

  // Serve static files from both dist and public directories
  app.use(express.static(distPath));
  app.use(express.static(publicPath));

  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}
