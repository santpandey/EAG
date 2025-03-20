/**
 * API Service for Song Information Finder
 * This file contains functions to interact with songfacts.com and Google to get song information
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
          releaseYear: "Unknown",
          album: "Unknown",
        },
        facts: songData.facts || ["No facts found for this song."],
        instruments: [
          "I cannot specify what instruments were used in making this song.",
        ],
        imageUrl: null,
        sources: songData.sources || [
          {
            name: "SongFacts",
            url: `https://www.songfacts.com/search/songs/${encodeURIComponent(
              songName
            )}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error searching for song:", error);
      return {
        success: false,
        error: error.message,
        basicInfo: {
          title: songName,
          releaseYear: "Unknown",
          album: "Unknown",
        },
        facts: ["No facts found for this song."],
        instruments: [
          "I cannot specify what instruments were used in making this song.",
        ],
        imageUrl: null,
        sources: [
          {
            name: "SongFacts",
            url: `https://www.songfacts.com/search/songs/${encodeURIComponent(
              songName
            )}`,
          },
        ],
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
      // Step 1: Search songfacts.com directly
      const searchUrl = `https://www.songfacts.com/search/songs/${encodeURIComponent(
        songName
      )}`;
      console.log(`Fetching from: ${searchUrl}`);

      // Use fetch with appropriate headers to mimic a browser
      const searchResponse = await fetch(searchUrl, {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml",
          "User-Agent": "Mozilla/5.0 Chrome Extension",
          Origin: "chrome-extension://",
        },
        mode: "cors",
      });

      if (!searchResponse.ok) {
        throw new Error(
          `Failed to fetch search results: ${searchResponse.status}`
        );
      }

      const searchHtml = await searchResponse.text();

      // Parse the search results
      const parser = new DOMParser();
      const searchDoc = parser.parseFromString(searchHtml, "text/html");

      // Find the link that matches the song name - try different selectors
      let searchResults = searchDoc.querySelectorAll(
        ".songfact-results-list a"
      );

      // If no results found with the first selector, try alternative selectors
      if (searchResults.length === 0) {
        searchResults = searchDoc.querySelectorAll(".fact-list a");
      }

      if (searchResults.length === 0) {
        searchResults = searchDoc.querySelectorAll("a[href^='/facts/']");
      }

      console.log(`Found ${searchResults.length} potential search results`);

      let songFactsUrl = null;
      let songTitle = songName;
      let bestMatchScore = 0;

      // First try to find an exact match
      for (const result of searchResults) {
        const resultText = result.textContent.trim();
        const resultHref = result.getAttribute("href");

        // Skip if not a song link
        if (!resultHref || !resultHref.includes("/facts/")) {
          continue;
        }

        // Check for exact match (case insensitive)
        if (resultText.toLowerCase() === songName.toLowerCase()) {
          songFactsUrl = resultHref;
          songTitle = resultText;
          console.log(`Found exact match: ${songTitle} at ${songFactsUrl}`);
          break;
        }

        // Calculate match score based on how much of the search term is in the result
        // and how much of the result is the search term
        const searchTerms = songName.toLowerCase().split(" ");
        const resultTerms = resultText.toLowerCase().split(" ");

        let matchScore = 0;
        for (const term of searchTerms) {
          if (resultText.toLowerCase().includes(term)) {
            matchScore += 1;
          }
        }

        // Normalize score by dividing by the number of terms in the search
        matchScore = matchScore / searchTerms.length;

        if (matchScore > bestMatchScore) {
          bestMatchScore = matchScore;
          songFactsUrl = resultHref;
          songTitle = resultText;
        }
      }

      // If no good match found, try a more lenient approach
      if (!songFactsUrl && searchResults.length > 0) {
        // Just take the first result that has a valid href
        for (const result of searchResults) {
          const resultHref = result.getAttribute("href");
          if (resultHref && resultHref.includes("/facts/")) {
            songFactsUrl = resultHref;
            songTitle = result.textContent.trim();
            console.log(`Using first available result: ${songTitle}`);
            break;
          }
        }
      }

      if (!songFactsUrl) {
        console.log("No matching song found on songfacts.com");
        return {
          facts: [],
          complete: false,
          basicInfo: {
            title: songName,
            releaseYear: "Unknown",
            album: "Unknown",
          },
          sources: [
            {
              name: "SongFacts Search",
              url: searchUrl,
            },
          ],
        };
      }

      // Make sure the URL is properly formatted
      if (!songFactsUrl.startsWith("http")) {
        songFactsUrl = `https://www.songfacts.com${
          songFactsUrl.startsWith("/") ? "" : "/"
        }${songFactsUrl}`;
      }

      console.log(`Fetching song facts from: ${songFactsUrl}`);

      // Step 2: Get the song facts page
      const factsResponse = await fetch(songFactsUrl, {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml",
          "User-Agent": "Mozilla/5.0 Chrome Extension",
          Origin: "chrome-extension://",
        },
        mode: "cors",
      });

      if (!factsResponse.ok) {
        throw new Error(`Failed to fetch song facts: ${factsResponse.status}`);
      }

      const factsHtml = await factsResponse.text();

      // Parse the facts page
      const factsDoc = parser.parseFromString(factsHtml, "text/html");

      // Extract facts
      const facts = this.extractFactsFromSongFacts(factsDoc);

      // Extract basic info
      const basicInfo = this.extractBasicInfoFromSongFacts(factsDoc, songTitle);

      return {
        facts,
        basicInfo,
        sources: [
          {
            name: "SongFacts",
            url: songFactsUrl,
          },
        ],
        complete: facts.length > 0,
      };
    } catch (error) {
      console.error("Error searching SongFacts:", error);
      return {
        facts: [],
        complete: false,
        basicInfo: {
          title: songName,
          releaseYear: "Unknown",
          album: "Unknown",
        },
        sources: [
          {
            name: "SongFacts Search",
            url: `https://www.songfacts.com/search/songs/${encodeURIComponent(
              songName
            )}`,
          },
        ],
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
        releaseYear: "Unknown",
        album: "Unknown",
      };

      // Look for song information section
      const songInfoSection = doc.querySelector(".song-info");
      if (songInfoSection) {
        // Try to extract release year
        const yearMatch = songInfoSection.textContent.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          info.releaseYear = yearMatch[0];
        }

        // Try to extract album
        const albumElement =
          songInfoSection.querySelector('a[href^="/album/"]');
        if (albumElement) {
          info.album = albumElement.textContent.trim();
        }
      }

      // If no song info section, try alternative approaches
      if (info.releaseYear === "Unknown") {
        // Try to find release year in the header or title
        const header = doc.querySelector("h1");
        if (header) {
          const headerText = header.textContent.trim();
          // Format is often "Song Title by Artist"
          const yearMatch = headerText.match(/Released:\s*(\d{4})/);
          if (yearMatch && yearMatch[1]) {
            info.releaseYear = yearMatch[1];
          }
        }
      }

      return info;
    } catch (error) {
      console.error("Error extracting basic info from SongFacts:", error);
      return {
        title: songTitle,
        releaseYear: "Unknown",
        album: "Unknown",
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
      // Initialize an empty array for facts
      const facts = [];

      console.log("Extracting facts from SongFacts page");

      // Try multiple approaches to find facts

      // Approach 1: Find the songfacts section by heading
      let foundFacts = false;
      const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4"));
      const songfactsSection = headings.find(
        (h) =>
          h.textContent.trim().toLowerCase().includes("songfact") ||
          h.textContent.trim().toLowerCase().includes("song fact")
      );

      if (songfactsSection) {
        console.log("Found songfacts section by heading");
        foundFacts = this.extractFactsFromSection(songfactsSection, facts);
      }

      // Approach 2: Look for fact-list class
      if (!foundFacts || facts.length === 0) {
        const factList = doc.querySelector(".fact-list");
        if (factList) {
          console.log("Found fact-list class");
          const listItems = factList.querySelectorAll("li");
          listItems.forEach((item) => {
            const factText = item.textContent.trim();
            if (factText && factText.length > 10) {
              facts.push(factText);
              foundFacts = true;
            }
          });
        }
      }

      // Approach 3: Try to get facts from the main content
      if (!foundFacts || facts.length === 0) {
        console.log("Trying to extract from main content");
        // Try different selectors for the main content
        const mainContent =
          doc.querySelector(".main-content") ||
          doc.querySelector(".content-main") ||
          doc.querySelector("article") ||
          doc.querySelector(".content");

        if (mainContent) {
          const paragraphs = mainContent.querySelectorAll("p");
          paragraphs.forEach((paragraph) => {
            const paragraphText = paragraph.textContent.trim();
            if (paragraphText && paragraphText.length > 30) {
              // Skip paragraphs that look like metadata or navigation
              if (
                paragraphText.toLowerCase().includes("copyright") ||
                paragraphText.toLowerCase().includes("all rights reserved") ||
                paragraphText.toLowerCase().includes("privacy policy")
              ) {
                return;
              }

              // Split paragraphs into sentences for better readability
              const sentences = paragraphText.split(/\.\s+/);
              sentences.forEach((sentence) => {
                if (sentence.length > 15) {
                  facts.push(sentence.trim() + ".");
                  foundFacts = true;
                }
              });
            }
          });
        }
      }

      // Approach 4: If still no facts, try to extract any text from the page that might be useful
      if (!foundFacts || facts.length === 0) {
        console.log("Trying to extract from any paragraphs");
        const allParagraphs = doc.querySelectorAll("p");
        for (let i = 0; i < Math.min(8, allParagraphs.length); i++) {
          const paragraphText = allParagraphs[i].textContent.trim();
          if (paragraphText && paragraphText.length > 30) {
            // Skip paragraphs that look like metadata or navigation
            if (
              paragraphText.toLowerCase().includes("copyright") ||
              paragraphText.toLowerCase().includes("all rights reserved") ||
              paragraphText.toLowerCase().includes("privacy policy")
            ) {
              continue;
            }

            facts.push(paragraphText);
            foundFacts = true;
          }
        }
      }

      // If we found facts, return them; otherwise, return a default message
      return facts.length > 0
        ? facts
        : ["No specific facts found on SongFacts."];
    } catch (error) {
      console.error("Error extracting facts from SongFacts:", error);
      return ["No specific facts found on SongFacts."];
    }
  }

  /**
   * Helper method to extract facts from a section
   * @param {Element} section - The section element to extract facts from
   * @param {Array} facts - Array to add facts to
   * @returns {boolean} - True if facts were found, false otherwise
   */
  static extractFactsFromSection(section, facts) {
    let foundFacts = false;
    let currentElement = section.nextElementSibling;

    // Process elements until we hit another heading or run out of siblings
    while (
      currentElement &&
      !["H1", "H2", "H3", "H4"].includes(currentElement.tagName)
    ) {
      // Extract from lists
      if (currentElement.tagName === "UL" || currentElement.tagName === "OL") {
        const listItems = currentElement.querySelectorAll("li");
        listItems.forEach((item) => {
          const factText = item.textContent.trim();
          if (factText && factText.length > 10) {
            facts.push(factText);
            foundFacts = true;
          }
        });
      }
      // Extract from paragraphs
      else if (currentElement.tagName === "P") {
        const paragraphText = currentElement.textContent.trim();
        if (paragraphText && paragraphText.length > 20) {
          // Skip paragraphs that look like metadata
          if (
            paragraphText.toLowerCase().includes("copyright") ||
            paragraphText.toLowerCase().includes("all rights reserved")
          ) {
            currentElement = currentElement.nextElementSibling;
            continue;
          }

          // Split paragraphs into sentences
          const sentences = paragraphText.split(/\.\s+/);
          sentences.forEach((sentence) => {
            if (sentence.length > 15) {
              facts.push(sentence.trim() + ".");
              foundFacts = true;
            }
          });
        }
      }
      // Extract from divs that might contain text
      else if (currentElement.tagName === "DIV") {
        // Only process divs that don't have complex nested structures
        if (!currentElement.querySelector("div, ul, ol, table")) {
          const divText = currentElement.textContent.trim();
          if (
            divText &&
            divText.length > 30 &&
            !divText.toLowerCase().includes("copyright")
          ) {
            facts.push(divText);
            foundFacts = true;
          }
        }
      }

      currentElement = currentElement.nextElementSibling;
    }

    return foundFacts;
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

    if (artistInfo.singers[0] !== "Unknown") {
      imageText = `${artistInfo.singers[0]} - ${songName}`;
    }

    return `https://placehold.co/400x300/3498db/ffffff?text=${encodeURIComponent(
      imageText
    )}`;
  }
}

// Export for use in other files
if (typeof module !== "undefined") {
  module.exports = ApiService;
}
