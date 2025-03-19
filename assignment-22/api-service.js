/**
 * API Service for Song Information Finder
 * This file contains functions to interact with songfacts.com to get song information
 */

class ApiService {
  /**
   * Search for a song on songfacts.com
   * @param {string} songName - The name of the song to search for
   * @returns {Promise<Object>} - Song information
   */
  static async searchSong(songName) {
    try {
      console.log(`Searching for song: ${songName}`);
      
      // Search songfacts.com for song information
      const songData = await this.searchSongFacts(songName);
      
      return {
        success: songData.complete,
        basicInfo: songData.basicInfo || {
          title: songName,
          musicDirector: 'Unknown',
          singers: ['Unknown'],
          releaseYear: 'Unknown',
          album: 'Unknown'
        },
        facts: songData.facts || ['No facts found for this song.'],
        instruments: ['I cannot specify what instruments were used in making this song.'],
        imageUrl: null,
        sources: songData.sources || [{ name: 'SongFacts', url: `https://www.songfacts.com/search/songs/${encodeURIComponent(songName)}` }]
      };
    } catch (error) {
      console.error('Error searching for song:', error);
      return { 
        success: false, 
        error: error.message,
        basicInfo: {
          title: songName,
          musicDirector: 'Unknown',
          singers: ['Unknown'],
          releaseYear: 'Unknown',
          album: 'Unknown'
        },
        facts: ['No facts found for this song.'],
        instruments: ['I cannot specify what instruments were used in making this song.'],
        imageUrl: null,
        sources: [{ name: 'SongFacts', url: `https://www.songfacts.com/search/songs/${encodeURIComponent(songName)}` }]
      };
    }
  }
  
  /**
   * Search songfacts.com for song information
   * @param {string} songName - The name of the song
   * @returns {Promise<Object>} - Song facts from songfacts.com
   */
  static async searchSongFacts(songName) {
    try {
      // Step 1: Search songfacts.com
      const proxyUrl = 'https://api.allorigins.win/get?url=';
      const encodedSearchUrl = encodeURIComponent(`https://www.songfacts.com/search/songs/${encodeURIComponent(songName)}`);
      
      const searchResponse = await fetch(`${proxyUrl}${encodedSearchUrl}`);
      const searchData = await searchResponse.json();
      
      if (!searchData.contents) {
        throw new Error('No search results from songfacts.com');
      }
      
      // Parse the search results
      const parser = new DOMParser();
      const searchDoc = parser.parseFromString(searchData.contents, 'text/html');
      
      // Find the link that matches the song name
      const searchResults = searchDoc.querySelectorAll('.songfact-results-list a');
      let songFactsUrl = null;
      let songTitle = songName;
      
      for (const result of searchResults) {
        const resultText = result.textContent.trim();
        // Check if the result text contains the song name (case insensitive)
        if (resultText.toLowerCase().includes(songName.toLowerCase())) {
          songFactsUrl = result.getAttribute('href');
          songTitle = resultText;
          break;
        }
      }
      
      if (!songFactsUrl) {
        return { 
          facts: [], 
          complete: false,
          basicInfo: {
            title: songName,
            musicDirector: 'Unknown',
            singers: ['Unknown'],
            releaseYear: 'Unknown',
            album: 'Unknown'
          },
          sources: [{ name: 'SongFacts Search', url: `https://www.songfacts.com/search/songs/${encodeURIComponent(songName)}` }]
        };
      }
      
      // Step 2: Get the song facts page
      const encodedFactsUrl = encodeURIComponent(`https://www.songfacts.com${songFactsUrl}`);
      const factsResponse = await fetch(`${proxyUrl}${encodedFactsUrl}`);
      const factsData = await factsResponse.json();
      
      if (!factsData.contents) {
        throw new Error('No facts found on songfacts.com');
      }
      
      // Parse the facts page
      const factsDoc = parser.parseFromString(factsData.contents, 'text/html');
      
      // Extract facts
      const facts = this.extractFactsFromSongFacts(factsDoc);
      
      // Extract basic info
      const basicInfo = this.extractBasicInfoFromSongFacts(factsDoc, songTitle);
      
      return {
        facts,
        basicInfo,
        sources: [{ name: 'SongFacts', url: `https://www.songfacts.com${songFactsUrl}` }],
        complete: facts.length > 0 && basicInfo.musicDirector !== 'Unknown'
      };
    } catch (error) {
      console.error('Error searching SongFacts:', error);
      return { 
        facts: [], 
        complete: false,
        basicInfo: {
          title: songName,
          musicDirector: 'Unknown',
          singers: ['Unknown'],
          releaseYear: 'Unknown',
          album: 'Unknown'
        },
        sources: [{ name: 'SongFacts Search', url: `https://www.songfacts.com/search/songs/${encodeURIComponent(songName)}` }]
      };
    }
  }
  
  /**
   * Extract basic song information from SongFacts page
   * @param {Document} doc - Parsed HTML document
   * @param {string} songTitle - Song title from search results
   * @returns {Object} - Basic song information
   */
  static extractBasicInfoFromSongFacts(doc, songTitle) {
    try {
      // Default values
      const info = {
        title: songTitle,
        musicDirector: 'Unknown',
        singers: ['Unknown'],
        releaseYear: 'Unknown',
        album: 'Unknown'
      };
      
      // Look for song information section
      const songInfoSection = doc.querySelector('.song-info');
      if (songInfoSection) {
        // Try to extract artist/singer
        const artistElement = songInfoSection.querySelector('a[href^="/artist/"]');
        if (artistElement) {
          info.singers = [artistElement.textContent.trim()];
        }
        
        // Try to extract release year
        const yearMatch = songInfoSection.textContent.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          info.releaseYear = yearMatch[0];
        }
        
        // Try to extract album
        const albumElement = songInfoSection.querySelector('a[href^="/album/"]');
        if (albumElement) {
          info.album = albumElement.textContent.trim();
        }
      }
      
      // Look for composer/music director in the facts
      const composerRegex = /(?:written|composed|produced) by ([^.]+)/i;
      const allText = doc.body.textContent;
      const composerMatch = allText.match(composerRegex);
      
      if (composerMatch && composerMatch[1]) {
        info.musicDirector = composerMatch[1].trim();
      }
      
      return info;
    } catch (error) {
      console.error('Error extracting basic info from SongFacts:', error);
      return {
        title: songTitle,
        musicDirector: 'Unknown',
        singers: ['Unknown'],
        releaseYear: 'Unknown',
        album: 'Unknown'
      };
    }
  }
  
  /**
   * Extract facts from songfacts.com page
   * @param {Document} doc - Parsed HTML document
   * @returns {Array} - List of facts about the song
   */
  static extractFactsFromSongFacts(doc) {
    try {
      const facts = [];
      
      // Find the songfacts section
      const songfactsSection = Array.from(doc.querySelectorAll('h2')).find(h2 => 
        h2.textContent.trim().toLowerCase() === 'songfacts'
      );
      
      if (songfactsSection) {
        // Get the list items following the Songfacts heading
        let currentElement = songfactsSection.nextElementSibling;
        
        while (currentElement && currentElement.tagName !== 'H2') {
          if (currentElement.tagName === 'UL') {
            const listItems = currentElement.querySelectorAll('li');
            listItems.forEach(item => {
              const factText = item.textContent.trim();
              if (factText && factText.length > 10) {
                facts.push(factText);
              }
            });
          } else if (currentElement.tagName === 'P') {
            const paragraphText = currentElement.textContent.trim();
            if (paragraphText && paragraphText.length > 10) {
              // Split paragraphs into sentences
              const sentences = paragraphText.split(/\.\s+/);
              sentences.forEach(sentence => {
                if (sentence.length > 10) {
                  facts.push(sentence.trim() + '.');
                }
              });
            }
          }
          
          currentElement = currentElement.nextElementSibling;
        }
      }
      
      // If no specific Songfacts section, try to get facts from the main content
      if (facts.length === 0) {
        const mainContent = doc.querySelector('.main-content');
        if (mainContent) {
          const paragraphs = mainContent.querySelectorAll('p');
          paragraphs.forEach(paragraph => {
            const paragraphText = paragraph.textContent.trim();
            if (paragraphText && paragraphText.length > 30) {
              // Split paragraphs into sentences
              const sentences = paragraphText.split(/\.\s+/);
              sentences.forEach(sentence => {
                if (sentence.length > 10) {
                  facts.push(sentence.trim() + '.');
                }
              });
            }
          });
        }
      }
      
      return facts.length > 0 ? facts : ['No specific facts found on SongFacts.'];
    } catch (error) {
      console.error('Error extracting facts from SongFacts:', error);
      return ['No specific facts found on SongFacts.'];
    }
  }
  
  /**
   * Generate an image for the song using an image generation API
   * This would ideally use an AI image generation API in a production version
   * @param {string} songName - The name of the song
   * @param {Object} artistInfo - Information about the artists involved
   * @returns {Promise<string>} - URL to the generated image
   */
  static async generateImage(songName, artistInfo) {
    // For now, return a placeholder
    let imageText = songName;
    
    if (artistInfo.singers[0] !== 'Unknown') {
      imageText = `${artistInfo.singers[0]} - ${songName}`;
    }
    
    return `https://placehold.co/400x300/3498db/ffffff?text=${encodeURIComponent(imageText)}`;
  }
}

// Export for use in other files
if (typeof module !== 'undefined') {
  module.exports = ApiService;
}
