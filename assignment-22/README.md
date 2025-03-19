# Song Information Finder - Chrome Extension

A Chrome extension that provides detailed information about songs including music directors, singers, facts, instruments used, and generates images of the recording process.

## Features

- Search for any song by name (supports songs in any language, particularly Hindi and English)
- Get detailed information about:
  - Music Director/Composer and Singer(s)
  - Important facts about the song (recording location, year, reviews, public reactions)
  - Instruments used in the song with timestamps
  - Generated image depicting the recording process
- Download generated images
- View sources for further information

## Installation Instructions

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the directory containing this extension
5. The Song Information Finder extension should now appear in your extensions list

## How to Use

1. Click on the extension icon in your Chrome toolbar
2. Enter the name of a song in the search box
3. Click the "Search" button or press Enter
4. View the detailed information about the song
5. Click on source links to visit external websites for more information
6. Click the "Download Image" button to save the generated image

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses Chrome Extension Manifest V3
- Simulates API responses for demonstration purposes
- In a production version, would integrate with:
  - Music information APIs (Spotify, MusicBrainz, etc.)
  - Web scraping for additional details
  - Image generation APIs

## Note on Images

In the current implementation, placeholder images are used. In a production version, this would be connected to an image generation API that would create images based on the actual artists involved in the song.

## Limitations

- The current implementation includes simulated data for a few example songs
- In a production version, this would be connected to real music databases and APIs

## Future Enhancements

- Integration with real music APIs
- More detailed instrument timelines
- Audio preview functionality
- Lyrics display with translations
- User favorites and history
