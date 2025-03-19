// Background script for Song Information Finder extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Song Information Finder extension installed');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchSongInfo') {
    // In a real implementation, this would make actual API calls
    // For now, we're handling everything in the popup.js file
    console.log('Received request to fetch info for:', request.songName);
    sendResponse({success: true});
  }
  return true;
});
