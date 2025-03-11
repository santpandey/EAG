# Price Comparison Tool - Chrome Extension

A Chrome extension that compares product prices between Flipkart and Amazon to help you find the best deals.

## Features

- Search for products by name or URL
- Compare prices between Flipkart and Amazon
- View detailed product information
- Identify the best price available
- Clean and user-friendly interface

## Installation

Since this extension is not published on the Chrome Web Store, you'll need to install it in developer mode:

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension should now be installed and visible in your Chrome toolbar

## How to Use

1. Click on the Price Comparison Tool icon in your Chrome toolbar
2. Enter the name of the product you want to search for in the input field
3. Click the "Compare Prices" button
4. Wait for the results to load (this may take a few seconds)
5. View the comparison results showing prices from both Flipkart and Amazon
6. The best price will be highlighted at the bottom of the results

## Technical Details

This extension works by:
1. Taking the user's search query
2. Opening background tabs to search on Flipkart and Amazon
3. Extracting product information from the search results
4. Comparing prices and presenting the results to the user

## Permissions

This extension requires the following permissions:
- `activeTab`: To interact with the current tab
- `scripting`: To run scripts on web pages
- Host permissions for Flipkart and Amazon domains: To search and extract product information

## Files

- `manifest.json`: Extension configuration
- `popup.html`: Main user interface
- `styles.css`: Styling for the popup
- `popup.js`: Handles user interactions in the popup
- `background.js`: Manages background tasks and communication
- `content.js`: Extracts product information from websites

## Troubleshooting

If you encounter any issues:
- Make sure you have a stable internet connection
- Verify that the extension has the necessary permissions
- Try refreshing the extension by clicking the reload icon on the extensions page
- Check the browser console for any error messages

## License

This project is open source and available for personal and educational use.
