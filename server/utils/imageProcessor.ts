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
    console.log('Starting image processing:', { inputPath, outputPath });
    const startTime = Date.now();
    
    // Verify input file exists and is readable
    try {
      await fs.promises.access(inputPath, fs.constants.R_OK);
      console.log('Input file is accessible');
    } catch (error) {
      throw new Error(`Input file is not accessible: ${error.message}`);
    }

    // Verify output directory exists and is writable
    const outputDir = path.dirname(outputPath);
    try {
      await fs.promises.access(outputDir, fs.constants.W_OK);
      console.log('Output directory is writable');
    } catch (error) {
      throw new Error(`Output directory is not writable: ${error.message}`);
    }

    // Load the image
    const image = sharp(inputPath);
    console.log('Sharp instance created');
    
    const metadata = await image.metadata();
    console.log('Image metadata retrieved:', { 
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: metadata.size
    });
    
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
    const maxWidth = 1200; // Reduced from 1920 for better performance
    const maxHeight = 800; // Reduced from 1080 for better performance

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
      console.log('Resizing image to:', { targetWidth, targetHeight });
    } else {
      console.log('Image dimensions are within limits, no resizing needed');
    }

    // Process the image with better error handling
    try {
      console.log('Starting image transformation');
      await image
        .resize(targetWidth, targetHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80, progressive: true }) // Reduced quality from 85 to 80 for better performance
        .toFile(outputPath);
      console.log('Image transformation completed');
    } catch (error) {
      throw new Error(`Failed to process image: ${error.message}`);
    }

    // Verify the output file was created
    try {
      await fs.promises.access(outputPath, fs.constants.R_OK);
      console.log('Output file verified');
    } catch (error) {
      throw new Error(`Failed to verify output file: ${error.message}`);
    }

    const endTime = Date.now();
    console.log(`Image processing completed in ${endTime - startTime}ms`);

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
    console.log('Checking image quality:', { inputPath });
    const startTime = Date.now();
    
    const metadata = await sharp(inputPath).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not get image dimensions');
    }
    
    console.log('Image dimensions:', { width: metadata.width, height: metadata.height });
    
    // Minimum dimensions for gallery images
    const minWidth = 400;
    const minHeight = 400;
    
    if (metadata.width < minWidth || metadata.height < minHeight) {
      throw new Error(`Image dimensions too small. Minimum size is ${minWidth}x${minHeight} pixels.`);
    }
    
    const endTime = Date.now();
    console.log(`Image quality check completed in ${endTime - startTime}ms`);
  } catch (error) {
    console.error('Image quality check failed:', error);
    throw new Error(`Image quality check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
