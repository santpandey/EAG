/**
 * Utility functions for Song Information Finder
 */

const SongUtils = {
  /**
   * Format a timestamp from seconds to MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted time string (MM:SS)
   */
  formatTime: function(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  },
  
  /**
   * Safely encode text for URLs
   * @param {string} text - Text to encode
   * @returns {string} - URL encoded text
   */
  encodeForUrl: function(text) {
    return encodeURIComponent(text.trim());
  },
  
  /**
   * Create a sanitized search query
   * @param {string} songName - Name of the song
   * @returns {string} - Sanitized query
   */
  createSearchQuery: function(songName) {
    return songName.trim().replace(/[^\w\s]/gi, '');
  },
  
  /**
   * Detect the probable language of a song title
   * This is a very simple implementation and would need to be improved
   * @param {string} songName - Name of the song
   * @returns {string} - Detected language ('en', 'hi', or 'unknown')
   */
  detectLanguage: function(songName) {
    // Simple detection based on character sets
    // Hindi characters are in the range 0900-097F (Devanagari)
    const hindiPattern = /[\u0900-\u097F]/;
    
    if (hindiPattern.test(songName)) {
      return 'hi'; // Hindi
    } else if (/^[A-Za-z0-9\s\W]+$/.test(songName)) {
      return 'en'; // English or other Latin script
    } else {
      return 'unknown';
    }
  },
  
  /**
   * Get appropriate search APIs based on detected language
   * @param {string} language - Detected language code
   * @returns {Array} - List of recommended APIs to search
   */
  getSearchApisForLanguage: function(language) {
    const commonApis = ['spotify', 'musicbrainz'];
    
    switch (language) {
      case 'hi':
        return [...commonApis, 'jiosaavn', 'gaana'];
      case 'en':
        return [...commonApis, 'genius', 'lastfm'];
      default:
        return commonApis;
    }
  },
  
  /**
   * Download data as a file
   * @param {string} url - Data URL or blob URL
   * @param {string} filename - Name for the downloaded file
   */
  downloadFile: function(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
  
  /**
   * Create a placeholder image URL with text
   * @param {string} text - Text to display on the image
   * @param {string} color - Background color (hex code without #)
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {string} - Placeholder image URL
   */
  createPlaceholderImage: function(text, color = '3498db', width = 400, height = 300) {
    return `https://placehold.co/${width}x${height}/${color}/ffffff?text=${encodeURIComponent(text)}`;
  }
};

// Export for use in other files
if (typeof module !== 'undefined') {
  module.exports = SongUtils;
}
