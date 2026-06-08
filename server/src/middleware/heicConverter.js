import convert from 'heic-convert';
import fs from 'fs/promises';
import path from 'path';

export const convertHeicToJpg = async (req, res, next) => {
  try {
    const convertFile = async (file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const filenameExt = path.extname(file.filename).toLowerCase();
      
      // Check if file is HEIC or HEIF
      if (ext === '.heic' || ext === '.heif' || filenameExt === '.heic' || filenameExt === '.heif') {
        const inputBuffer = await fs.readFile(file.path);
        
        // Convert HEIC to JPEG
        const outputBuffer = await convert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 0.85
        });

        // Determine new file path and name
        const originalExtensionRegex = /\.(heic|heif)$/i;
        const newFilename = file.filename.replace(originalExtensionRegex, '') + '.jpg';
        const newPath = path.join(path.dirname(file.path), newFilename);

        // Write the converted file
        await fs.writeFile(newPath, outputBuffer);

        // Clean up the original file
        try {
          await fs.unlink(file.path);
        } catch (unlinkErr) {
          console.error('Failed to delete original HEIC file:', unlinkErr);
        }

        // Update multer file properties to reflect the converted JPEG file
        file.path = newPath;
        file.filename = newFilename;
        file.mimetype = 'image/jpeg';
        file.originalname = file.originalname.replace(originalExtensionRegex, '') + '.jpg';
      }
    };

    if (req.file) {
      await convertFile(req.file);
    }

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        await convertFile(file);
      }
    } else if (req.files && typeof req.files === 'object') {
      // Handle field name mapping if any
      for (const fieldName of Object.keys(req.files)) {
        const files = req.files[fieldName];
        if (Array.isArray(files)) {
          for (const file of files) {
            await convertFile(file);
          }
        }
      }
    }

    next();
  } catch (error) {
    console.error('HEIC conversion error:', error);
    return res.status(400).json({ message: 'errors.upload_failed', details: 'HEIC image conversion failed' });
  }
};
