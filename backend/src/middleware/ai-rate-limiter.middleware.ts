import { NextFunction, Request, Response } from "express";

const activeLimits = new Map<string, number>();

export const aiRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Date.now();
  if (activeLimits.has(userId)) {
    const lastRequestTime = activeLimits.get(userId)!;
    if (now - lastRequestTime < 5000) {
      return res.status(429).json({
        message: "Too many requests. Please wait 5 seconds before making another AI request."
      });
    }
  }

  activeLimits.set(userId, now);
  return next();
}

// periodically sweep entries older than 5 seconds to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamp] of activeLimits.entries()) {
    if (now - timestamp > 5000) {
      activeLimits.delete(userId);
    }
  }
}, 5000); // run every 5s