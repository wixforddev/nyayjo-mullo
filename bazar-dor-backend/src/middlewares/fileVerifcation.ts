import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";
import response from "../config/response";

const imageVerification = (req: Request, res: Response, next: NextFunction) => {
  const files = (req as any).files || [];

  if (files.length === 0) {
    logger.error("Images not found");
    return res.status(403).json(
      response({
        code: "403",
        message: "Images not found",
      }),
    );
  } else {
    next();
  }
};

export default imageVerification;
