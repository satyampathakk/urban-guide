const BACKEND = 'https://api.032403.xyz';

/**
 * Converts a relative media path like "/uploads/foo.jpg"
 * into a full URL "https://api.032403.xyz/uploads/foo.jpg".
 * Already-absolute URLs are returned unchanged.
 */
export function mediaUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BACKEND}${path}`;
}
