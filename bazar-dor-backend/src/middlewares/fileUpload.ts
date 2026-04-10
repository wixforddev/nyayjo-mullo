import multer from 'multer';
import path from 'path';
import { Request } from 'express';

export default function (UPLOADS_FOLDER: string) {
  const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      cb(null, UPLOADS_FOLDER);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const fileExt = path.extname(file.originalname);
      const filename =
        file.originalname
          .replace(fileExt, '')
          .toLowerCase()
          .split(' ')
          .join('-') +
        '-' +
        Date.now();

      cb(null, filename + fileExt);
    },
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 20000000, // 20MB
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (
        file.mimetype == 'image/jpg' ||
        file.mimetype == 'image/png' ||
        file.mimetype == 'image/jpeg' ||
        file.mimetype == 'image/heic' ||
        file.mimetype == 'image/heif'
      ) {
        cb(null, true);
      } else {
        cb(new Error('Only jpg, png, jpeg format allowed!'));
      }
    },
  });

  return upload;
}
