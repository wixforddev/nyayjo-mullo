import fs from 'fs';
import path from 'path';
import convert from 'heic-convert';
import { Request, Response, NextFunction } from 'express';

const fsPromises = fs.promises;

const convertHeicToPngMiddleware = (UPLOADS_FOLDER: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const file = (req as any).file;
    if (file && (file.mimetype === 'image/heic' || file.mimetype === 'image/heif')) {
      const heicBuffer = await fsPromises.readFile(file.path);
      const pngBuffer = await convert({
        buffer: heicBuffer,
        format: 'PNG'
      });

      const originalFileName = path.basename(file.originalname, path.extname(file.originalname));
      const currentDateTime = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const pngFileName = `${originalFileName}_${currentDateTime}.png`;
      const pngFilePath = path.join(UPLOADS_FOLDER, pngFileName);

      await fsPromises.writeFile(pngFilePath, pngBuffer);

      await fsPromises.unlink(file.path);

      file.path = pngFilePath;
      file.filename = pngFileName;
      file.mimetype = 'image/png';
    }

    next();
  };
};

export default convertHeicToPngMiddleware;
