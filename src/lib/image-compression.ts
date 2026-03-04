import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
    maxSizeMB: number;
    maxWidthOrHeight: number;
    useWebWorker?: boolean;
    fileType?: string;
}

export const IMAGE_COMPRESSION_PRESETS = {
    profile: {
        maxSizeMB: 0.5,          // 500KB max
        maxWidthOrHeight: 400,    // 400x400 for profile photos
        useWebWorker: true,
    },
    verification: {
        maxSizeMB: 2,            // 2MB max for documents
        maxWidthOrHeight: 1920,  // Keep reasonable quality
        useWebWorker: true,
    },
    general: {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
    },
} as const;

/**
 * Compress an image file before upload
 * @param file - The image file to compress
 * @param preset - Compression preset to use (profile, verification, general)
 * @returns Compressed file
 */
export async function compressImage(
    file: File,
    preset: keyof typeof IMAGE_COMPRESSION_PRESETS = 'general'
): Promise<File> {
    const options = IMAGE_COMPRESSION_PRESETS[preset];

    try {
        const compressedFile = await imageCompression(file, options);

        // Log compression results
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
        const reduction = (((file.size - compressedFile.size) / file.size) * 100).toFixed(1);

        console.log(`🖼️ Image Compression:`);
        console.log(`  Original: ${originalSize} MB`);
        console.log(`  Compressed: ${compressedSize} MB`);
        console.log(`  Reduction: ${reduction}%`);

        return compressedFile;
    } catch (error) {
        console.error('Image compression failed:', error);
        // Return original file if compression fails
        return file;
    }
}

/**
 * Validate file size against maximum
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in megabytes
 * @returns true if valid, false otherwise
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxBytes;
}

/**
 * Validate file type against allowed types
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns true if valid, false otherwise
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
