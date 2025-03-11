// This script is injected into the Flipkart and Amazon pages
// It extracts product information and sends it back to the background script

// Function to extract product information from Flipkart
function extractFlipkartProductInfo() {
  try {
    console.log("Extracting Flipkart product info");
    
    // Try different selectors for product elements
    let productElement = null;
    
    // First try the standard product card
    productElement = document.querySelector('div._1AtVbE div._13oc-S');
    console.log("First selector result:", productElement);
    
    // If not found, try alternative layouts
    if (!productElement) {
      productElement = document.querySelector('div._1AtVbE div._4ddWXP');
      console.log("Second selector result:", productElement);
    }
    
    if (!productElement) {
      productElement = document.querySelector('div._1YokD2 div._1AtVbE');
      console.log("Third selector result:", productElement);
    }
    
    if (!productElement) {
      // Try to get any product from search results
      const allProducts = document.querySelectorAll('div._1AtVbE');
      console.log("Found " + allProducts.length + " potential products");
      
      // Find the first one that has price information
      for (let i = 0; i < allProducts.length; i++) {
        if (allProducts[i].querySelector('div._30jeq3') || 
            allProducts[i].querySelector('div._30jeq3._1_WHN1')) {
          productElement = allProducts[i];
          console.log("Found product with price at index " + i);
          break;
        }
      }
    }
    
    console.log("Final product element:", productElement);
    
    if (productElement) {
      // Try different selectors for product details
      // Name selectors
      const nameSelectors = [
        'div._4rR01T', 
        'a.s1Q9rs', 
        'a.IRpwTa',
        'div.s1Q9rs',
        'div._4rR01T',
        'a.IRpwTa'
      ];
      
      // Price selectors
      const priceSelectors = [
        'div._30jeq3', 
        'div._30jeq3._1_WHN1',
        'div._25b18c'
      ];
      
      // Link selectors
      const linkSelectors = [
        'a._1fQZEK', 
        'a.s1Q9rs', 
        'a.IRpwTa',
        'a._2rpwqI'
      ];
      
      // Try to find name using different selectors
      let nameElement = null;
      for (const selector of nameSelectors) {
        nameElement = productElement.querySelector(selector) || 
                     document.querySelector(selector);
        if (nameElement) {
          console.log("Found name with selector: " + selector);
          break;
        }
      }
      
      // Try to find price using different selectors
      let priceElement = null;
      for (const selector of priceSelectors) {
        priceElement = productElement.querySelector(selector) || 
                      document.querySelector(selector);
        if (priceElement) {
          console.log("Found price with selector: " + selector);
          break;
        }
      }
      
      // Try to find link using different selectors
      let linkElement = null;
      for (const selector of linkSelectors) {
        linkElement = productElement.querySelector(selector) || 
                     document.querySelector(selector);
        if (linkElement) {
          console.log("Found link with selector: " + selector);
          break;
        }
      }
      
      // Get product details
      const name = nameElement ? nameElement.textContent.trim() : null;
      const price = priceElement ? priceElement.textContent.trim() : null;
      const url = linkElement ? 'https://www.flipkart.com' + linkElement.getAttribute('href') : null;
      
      console.log("Name is " + name);
      console.log("Price is " + price);
      console.log("URL is " + url);
      
      // Send results back to background script
      chrome.runtime.sendMessage({
        action: 'searchResults',
        store: 'flipkart',
        data: {
          name: name,
          price: price,
          url: url
        }
      });
      
      return true;
    }
  } catch (error) {
    console.error('Error extracting Flipkart data:', error);
  }
  
  // Send null result if we couldn't extract data
  chrome.runtime.sendMessage({
    action: 'searchResults',
    store: 'flipkart',
    data: null
  });
  
  return false;
}

// Function to extract product information from Amazon
function extractAmazonProductInfo() {
  try {
    // Get the first product result
    const productElement = document.querySelector('div.s-result-item[data-component-type="s-search-result"]');
    
    if (productElement) {
      // Extract product details
      const nameElement = productElement.querySelector('h2 .a-link-normal');
      const priceElement = productElement.querySelector('.a-price .a-offscreen');
      const linkElement = productElement.querySelector('h2 .a-link-normal');
      
      // Get product details
      const name = nameElement ? nameElement.textContent.trim() : null;
      const price = priceElement ? priceElement.textContent.trim() : null;
      const url = linkElement ? linkElement.getAttribute('href') : null;
      
      // Format the URL
      const formattedUrl = url ? (url.startsWith('http') ? url : 'https://www.amazon.in' + url) : null;
      
      // Send results back to background script
      chrome.runtime.sendMessage({
        action: 'searchResults',
        store: 'amazon',
        data: {
          name: name,
          price: price,
          url: formattedUrl
        }
      });
      
      return true;
    }
  } catch (error) {
    console.error('Error extracting Amazon data:', error);
  }
  
  return false;
}

// Determine which website we're on and extract the appropriate information
function extractProductInfo() {
  const currentUrl = window.location.href;
  
  if (currentUrl.includes('flipkart.com')) {
    return extractFlipkartProductInfo();
  } else if (currentUrl.includes('amazon.in')) {
    return extractAmazonProductInfo();
  }
  
  return false;
}

// Wait for the page to load and then extract product information
window.addEventListener('load', function() {
  // Wait a bit for any AJAX content to load
  setTimeout(function() {
    extractProductInfo();
  }, 3000);
});
