import multer from 'multer';
import { Request } from 'express';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Multer middleware using memory storage.
 * File bytes are held in req.file.buffer — no disk writes.
 * Upload to Cloudinary (or another service) in the controller.
 *
 * The `_folder` parameter is kept for backward-compatibility but ignored.
 */
export default function (_folder?: string) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed (jpg, png, webp, heic)'));
      }
    },
  });
}
