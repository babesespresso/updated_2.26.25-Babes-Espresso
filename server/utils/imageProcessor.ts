import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

interface ProcessedImage {
  path: string;
  width: number;
  height: number;
}

export async function processImage(inputPath: string, outputPath: string): Promise<ProcessedImage> {
  try {
    // Verify input file exists and is readable
    try {
      await fs.promises.access(inputPath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`Input file is not accessible: ${error.message}`);
    }

    // Verify output directory exists and is writable
    const outputDir = path.dirname(outputPath);
    try {
      await fs.promises.access(outputDir, fs.constants.W_OK);
    } catch (error) {
      throw new Error(`Output directory is not writable: ${error.message}`);
    }

    // Load the image
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not get image dimensions');
    }
    
    // Validate image format
    if (!metadata.format) {
      throw new Error('Could not determine image format');
    }
    
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!allowedFormats.includes(metadata.format.toLowerCase())) {
      throw new Error(`Unsupported image format: ${metadata.format}. Allowed formats: ${allowedFormats.join(', ')}`);
    }

    // Maximum dimensions while maintaining aspect ratio
    const maxWidth = 1920;
    const maxHeight = 1080;

    // Calculate target dimensions while maintaining aspect ratio
    let targetWidth = metadata.width;
    let targetHeight = metadata.height;

    // Scale down if image is too large
    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const aspectRatio = targetWidth / targetHeight;
      if (aspectRatio > maxWidth / maxHeight) {
        targetWidth = maxWidth;
        targetHeight = Math.round(maxWidth / aspectRatio);
      } else {
        targetHeight = maxHeight;
        targetWidth = Math.round(maxHeight * aspectRatio);
      }
    }

    // Process the image with better error handling
    try {
      await image
        .resize(targetWidth, targetHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, progressive: true })
        .toFile(outputPath);
    } catch (error) {
      throw new Error(`Failed to process image: ${error.message}`);
    }

    // Verify the output file was created
    try {
      await fs.promises.access(outputPath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`Failed to verify output file: ${error.message}`);
    }

    return {
      path: outputPath,
      width: targetWidth,
      height: targetHeight
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function ensureImageQuality(inputPath: string): Promise<void> {
  try {
    const metadata = await sharp(inputPath).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not get image dimensions');
    }

    // Check if image meets minimum quality requirements
    const minWidth = 480;
    const minHeight = 360;

    if (metadata.width < minWidth || metadata.height < minHeight) {
      throw new Error(`Image dimensions too small. Minimum required: ${minWidth}x${minHeight}px`);
    }

    // Check file size
    const stats = await fs.promises.stat(inputPath);
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (stats.size > maxSize) {
      throw new Error(`File size too large. Maximum allowed: 5MB`);
    }

    // Validate format
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!metadata.format || !allowedFormats.includes(metadata.format)) {
      throw new Error(`Invalid image format. Allowed formats: ${allowedFormats.join(', ')}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Image quality check failed: ${error.message}`);
    }
    throw new Error('Image quality check failed: Unknown error');
  }
}
