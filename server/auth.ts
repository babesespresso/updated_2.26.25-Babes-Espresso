import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);
const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    if (!stored || !stored.includes(".")) {
      return false;
    }
    const [hashedPassword, salt] = stored.split(".");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const suppliedHash = suppliedBuf.toString("hex");
    return suppliedHash === hashedPassword;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

async function createAdminUser() {
  try {
    const adminEmail = 'admin@babesespresso.com';
    const adminUsername = 'admin';
    
    // Check if admin exists by email or username
    const existingAdminByEmail = await storage.getUser(adminEmail);
    const existingAdminByUsername = await storage.getUserByUsername(adminUsername);
    
    if (!existingAdminByEmail && !existingAdminByUsername) {
      const hashedPassword = await hashPassword('admin123');
      await storage.createUser({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        username: adminUsername,
        displayName: 'Admin'
      });
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

export function setupAuth(app: Express) {
  // Create admin user on startup
  createAdminUser();
  // Set up session middleware first
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    resave: true,
    saveUninitialized: true,
    store: new MemoryStoreSession({
      checkPeriod: 86400000,
      stale: false,
      ttl: 24 * 60 * 60 * 1000
    }),
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'none', // Changed from 'lax' to 'none' for cross-origin requests
      path: '/'
    },
    rolling: true,
    name: 'babes_espresso.sid'
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
  passport.serializeUser((user: User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id.toString());
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await storage.getUser(email);
        if (!user) {
          return done(null, false);
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false);
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Register endpoint
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { email, password, role, username, displayName } = req.body;
      
      console.log('Registration attempt:', { email, role, username });

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Validate role
      if (!['creator', 'follower'].includes(role)) {
        return res.status(400).json({ 
          message: "Invalid role. Must be 'creator' or 'follower'" 
        });
      }

      // Check if user exists
      const existingUser = await storage.getUser(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Email already registered" 
        });
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      let user;
      try {
        user = await storage.createUser({
          email,
          password: hashedPassword,
          role,
          username,
          displayName
        });
        console.log('User created successfully:', { id: user.id, email: user.email });
      } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: "Failed to create user account" });
      }

      // Create profile based on role
      try {
        if (role === 'creator') {
          await storage.createCreatorProfile({
            userId: user.id,
            displayName: displayName || username || email.split('@')[0],
          });
          console.log('Creator profile created for user:', user.id);
        } else if (role === 'follower') {
          await storage.createFollowerProfile({
            userId: user.id
          });
          console.log('Follower profile created for user:', user.id);
        }
      } catch (error) {
        console.error(`Error creating ${role} profile:`, error);
        // Don't return here - we'll still log the user in even if profile creation fails
        // We can fix their profile later
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error('Error during login after registration:', err);
          return next(err);
        }
        req.session.save((err) => {
          if (err) {
            console.error('Error saving session after registration:', err);
            return next(err);
          }
          res.json({ 
            message: "Registered and logged in successfully",
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              username: user.username
            }
          });
        });
      });
    } catch (error) {
      console.error('Unhandled error during registration:', error);
      next(error);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    console.log('Login attempt:', { email: req.body.email });
    
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    passport.authenticate("local", async (err: Error, user: User) => {
      if (err) {
        console.error('Authentication error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Invalid credentials for:', req.body.email);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      console.log('User authenticated:', { id: user.id, email: user.email, role: user.role });

      req.logIn(user, async (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }

        // Set session data
        req.session.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          username: user.username
        };

        try {
          // Force session save and wait for it
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          console.log('Session saved successfully', { sessionID: req.sessionID, user: req.session.user });

          // Return role-specific data
          const userData = {
            id: user.id,
            email: user.email,
            role: user.role,
            username: user.username,
            displayName: user.displayName
          };

          res.json({ 
            message: "Logged in successfully", 
            user: userData,
            // Return the appropriate redirect URL based on role
            redirectTo: user.role === 'admin' ? '/admin' :
                       user.role === 'creator' ? '/creator/dashboard' :
                       '/gallery'
          });
        } catch (err) {
          console.error('Session save error:', err);
          return next(err);
        }
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    res.json({ 
      authenticated: req.isAuthenticated(),
      user: req.user
    });
  });
}

export function requireRole(...allowedRoles: ('admin' | 'creator' | 'follower')[]) {
  return (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (!req.session) {
      return res.status(401).json({
        message: "Session expired",
        code: "SESSION_EXPIRED",
        details: "Your session has expired. Please log in again."
      });
    }

    if (!req.isAuthenticated()) {
      return res.status(401).json({
        message: "Unauthorized",
        code: "AUTH_REQUIRED",
        details: "Please log in to access this resource"
      });
    }

    const user = req.user as User;
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: "Forbidden",
        code: "INSUFFICIENT_ROLE",
        details: "You don't have permission to access this resource"
      });
    }

    req.session.touch();
    next();
  };
}

export function requireAuth(allowedRoles?: string[]) {
  return (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    // First check if session exists
    if (!req.session) {
      console.error('No session found:', {
        path: req.path,
        method: req.method,
        headers: req.headers
      });
      return res.status(401).json({ 
        message: "Session expired",
        code: "SESSION_EXPIRED",
        details: "Your session has expired. Please log in again."
      });
    }

    // Then check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log('Unauthorized request:', {
        path: req.path,
        method: req.method,
        authenticated: false,
        session: 'exists',
        sessionID: req.sessionID,
        user: req.user ? 'exists' : 'missing'
      });
      return res.status(401).json({ 
        message: "Unauthorized",
        code: "AUTH_REQUIRED",
        details: "Please log in to access this resource"
      });
    }

    if (allowedRoles && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden",
        code: "INSUFFICIENT_ROLE",
        details: "You don't have permission to access this resource"
      });
    }

    // Touch the session to keep it alive
    req.session.touch();
    next();
  };
}