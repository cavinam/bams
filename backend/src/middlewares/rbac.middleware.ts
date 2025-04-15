import { Response, NextFunction } from "express";
import { AuthRequest } from "@/interfaces/auth-request";

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(403).json({ message: "Access denied.No User found." });
      return;
    }

    const userRole = req.user.role.toUpperCase();
    console.log("User role:", userRole, "Allowed roles:", allowedRoles);

    if (!allowedRoles.includes(userRole)) {
      res
        .status(403)
        .json({ message: "Access denied.Insufficient permissions." });
      return;
    }

    next();
  };
};
