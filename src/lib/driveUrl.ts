/**
 * Utility functions for handling Google Drive video URLs
 */

/**
 * Extract file ID from various Google Drive URL formats
 */
export function extractDriveFileId(url: string): string | null {
  // Match /file/d/<ID>/ pattern
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];
  
  // Match ?id=<ID> pattern
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  
  return null;
}

/**
 * Convert Google Drive URL to direct download URL
 * This URL can be used as video src
 */
export function driveUrlToDirect(url: string): string {
  const id = extractDriveFileId(url);
  if (!id) return url;
  
  // Use the direct download URL format
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

/**
 * Convert Google Drive URL to preview embed URL
 * Uses export=view format which tends to load faster than /preview
 * @param autoplay - Whether to add autoplay parameter (default: true)
 */
export function driveUrlToPreview(url: string, autoplay: boolean = true): string {
  const id = extractDriveFileId(url);
  if (!id) return url;
  
  // Use preview format - tends to load faster
  const baseUrl = `https://drive.google.com/file/d/${id}/preview`;
  return autoplay ? `${baseUrl}?autoplay=1` : baseUrl;
}

/**
 * Get a streaming-compatible URL for Google Drive video
 * This uses the export/view format which often works better for HTML5 video
 */
export function driveUrlToStream(url: string): string {
  const id = extractDriveFileId(url);
  if (!id) return url;
  
  // This format tends to work better for streaming
  return `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=`;
}
