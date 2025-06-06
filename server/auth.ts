import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Define authentication user type
export interface AuthUser {
  id: number;
  username: string;
  role: string;
  familyId?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser || req.authUser.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function requireParentOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser || (req.authUser.role !== "admin" && req.authUser.role !== "parent")) {
    return res.status(403).json({ error: "Parent or admin access required" });
  }
  next();
}

// Middleware to check if parent can access family data
export function requireFamilyAccess(req: Request, res: Response, next: NextFunction) {
  const familyId = parseInt(req.params.familyId || req.body.familyId);
  
  if (req.authUser?.role === "admin") {
    return next(); // Admins can access all families
  }
  
  if (req.authUser?.role === "parent" && req.authUser.familyId === familyId) {
    return next(); // Parents can access their own family
  }
  
  return res.status(403).json({ error: "Access denied to this family" });
}

export async function authenticateCredentials(username: string, password: string) {
  // Try admin users first
  const adminUser = await storage.getAdminUserByUsername(username);
  if (adminUser && adminUser.active && await verifyPassword(password, adminUser.passwordHash)) {
    return {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
    };
  }

  // Try parent users
  const parentUser = await storage.getParentUserByUsername(username);
  if (parentUser && parentUser.active && await verifyPassword(password, parentUser.passwordHash)) {
    return {
      id: parentUser.id,
      username: parentUser.username,
      role: parentUser.role,
      familyId: parentUser.familyId,
      email: parentUser.email,
    };
  }

  return null;
}