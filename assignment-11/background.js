// Store search results
let searchResults = {
  flipkart: null,
  amazon: null
};

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Handle search product request from popup
  if (request.action === 'searchProduct') {
    // Reset previous search results
    searchResults = {
      flipkart: null,
      amazon: null
    };
    
    // Start search process
    searchOnFlipkart(request.query)
      .then(() => searchOnAmazon(request.query))
      .then(() => {
        // Send results back to popup
        sendResponse({
          success: true,
          data: searchResults
        });
      })
      .catch(error => {
        console.error('Error during search:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });
    
    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
  
  // Handle search results from content scripts
  if (request.action === 'searchResults') {
    if (request.store === 'flipkart') {
      searchResults.flipkart = request.data;
      console.log("Flipkart results: ", request.data);
    } else if (request.store === 'amazon') {
      searchResults.amazon = request.data;
      console.log("Amazon results: ", request.data);
    }
  }
});

// Function to search on Flipkart
async function searchOnFlipkart(query) {
  return new Promise((resolve, reject) => {
    // Step 1: Create a tab to search for the product
    chrome.tabs.create({
      url: `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
      active: false
    }, function(tab) {
      if (!tab) {
        console.error("Failed to create tab for Flipkart search");
        resolve(); // Resolve anyway to continue with Amazon
        return;
      }

      console.log("Created Flipkart search tab with ID:", tab.id);
      
      // Listen for tab updates for the search page
      const searchTabListener = function(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          console.log("Flipkart search tab loaded completely, executing script");
          
          // Wait a bit for any AJAX content to load
          setTimeout(() => {
            // Execute script in the search tab to get product URL
            try {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractFlipkartProductUrl
              }, (results) => {
                console.log("Search script execution results:", results);
                
                if (results && results[0] && results[0].result && results[0].result.url) {
                  const productUrl = results[0].result.url;
                  const productName = results[0].result.name || "Product";
                  console.log("Found product URL:", productUrl);
                  
                  // Remove the search tab listener
                  chrome.tabs.onUpdated.removeListener(searchTabListener);
                  
                  // Step 2: Navigate to the product page
                  navigateToFlipkartProductPage(productUrl, productName, tab.id, resolve);
                } else {
                  console.error("No product URL found on Flipkart");
                  chrome.tabs.remove(tab.id, () => {
                    console.log("Closed Flipkart search tab");
                    chrome.tabs.onUpdated.removeListener(searchTabListener);
                    resolve();
                  });
                }
              });
            } catch (error) {
              console.error("Error executing script in Flipkart search tab:", error);
              chrome.tabs.remove(tab.id, () => {
                chrome.tabs.onUpdated.removeListener(searchTabListener);
                resolve();
              });
            }
          }, 3000);
        }
      };
      
      chrome.tabs.onUpdated.addListener(searchTabListener);
      
      // Set a timeout to close the tab if it takes too long
      setTimeout(() => {
        try {
          chrome.tabs.get(tab.id, (tabInfo) => {
            if (tabInfo) {
              console.log("Timeout reached, closing Flipkart search tab");
              chrome.tabs.remove(tab.id);
              chrome.tabs.onUpdated.removeListener(searchTabListener);
              resolve();
            }
          });
        } catch (e) {
          // Tab might already be closed
          console.log("Tab might already be closed:", e);
          resolve();
        }
      }, 20000);
    });
  });
}

// Function to navigate to the Flipkart product page and extract details
function navigateToFlipkartProductPage(productUrl, productName, existingTabId, resolveCallback) {
  // Format the URL if needed
  const fullUrl = productUrl.startsWith('http') 
    ? productUrl 
    : `https://www.flipkart.com${productUrl}`;
  
  console.log("Navigating to product page:", fullUrl);
  
  // Update the existing tab to the product page
  chrome.tabs.update(existingTabId, { url: fullUrl }, (tab) => {
    if (!tab) {
      console.error("Failed to navigate to Flipkart product page");
      resolveCallback();
      return;
    }
    
    console.log("Navigated to Flipkart product page in tab:", tab.id);
    
    // Listen for tab updates for the product page
    const productTabListener = function(tabId, changeInfo) {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        console.log("Flipkart product page loaded completely, executing script");
        
        // Wait a bit for any AJAX content to load
        setTimeout(() => {
          // Execute script in the product tab to get price
          try {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: extractFlipkartProductDetails,
              args: [productName]
            }, (results) => {
              console.log("Product script execution results:", results);
              
              // Close the tab after getting results
              chrome.tabs.remove(tab.id, () => {
                console.log("Closed Flipkart product tab");
                chrome.tabs.onUpdated.removeListener(productTabListener);
                resolveCallback();
              });
            });
          } catch (error) {
            console.error("Error executing script in Flipkart product tab:", error);
            chrome.tabs.remove(tab.id, () => {
              chrome.tabs.onUpdated.removeListener(productTabListener);
              resolveCallback();
            });
          }
        }, 3000);
      }
    };
    
    chrome.tabs.onUpdated.addListener(productTabListener);
    
    // Set a timeout to close the tab if it takes too long
    setTimeout(() => {
      try {
        chrome.tabs.get(tab.id, (tabInfo) => {
          if (tabInfo) {
            console.log("Timeout reached, closing Flipkart product tab");
            chrome.tabs.remove(tab.id);
            chrome.tabs.onUpdated.removeListener(productTabListener);
            resolveCallback();
          }
        });
      } catch (e) {
        // Tab might already be closed
        console.log("Tab might already be closed:", e);
        resolveCallback();
      }
    }, 15000);
  });
}

// Function to extract product URL from Flipkart search page
function extractFlipkartProductUrl() {
  console.log("Extracting product URL from Flipkart search page");
  
  try {
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
      
      // Find the first one that has a link
      for (let i = 0; i < allProducts.length; i++) {
        if (allProducts[i].querySelector('a[href*="/p/"]')) {
          productElement = allProducts[i];
          console.log("Found product with link at index " + i);
          break;
        }
      }
    }
    
    // If still not found, try more generic selectors
    if (!productElement) {
      const linkElement = document.querySelector('a[href*="/p/"]');
      if (linkElement) {
        productElement = linkElement.closest('div._1AtVbE') || linkElement.parentElement;
        console.log("Using more generic link selector, result:", productElement);
      }
    }
    
    console.log("Final product element for URL extraction:", productElement);
    
    if (productElement) {
      // Name selectors
      const nameSelectors = [
        'div._4rR01T', 
        'a.s1Q9rs', 
        'a.IRpwTa',
        'div.s1Q9rs',
        'div._4rR01T',
        'a.IRpwTa',
        '.B_NuCI',
        '._4rR01T'
      ];
      
      // Link selectors
      const linkSelectors = [
        'a._1fQZEK', 
        'a.s1Q9rs', 
        'a.IRpwTa',
        'a._2rpwqI',
        'a[href*="/p/"]'
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
      const url = linkElement ? linkElement.getAttribute('href') : null;
      
      console.log("Name is " + name);
      console.log("URL is " + url);
      
      return { name, url };
    }
  } catch (error) {
    console.error('Error extracting Flipkart product URL:', error);
  }
  
  return { name: null, url: null };
}

// Function to extract product details from Flipkart product page
function extractFlipkartProductDetails(productName) {
  console.log("Extracting product details from Flipkart product page");
  
  try {
    // First try to find price using known Flipkart price selectors
    const priceSelectors = [
      'div._30jeq3._1_WHN1', // Main price selector
      'div._30jeq3',         // Alternative price selector
      '.CEmiEU',             // Another price container
      '._16Jk6d'             // Yet another price container
    ];
    
    let mainPriceElement = null;
    for (const selector of priceSelectors) {
      mainPriceElement = document.querySelector(selector);
      if (mainPriceElement) {
        console.log("Found price with selector:", selector);
        break;
      }
    }
    
    let mainPrice = null;
    if (mainPriceElement) {
      const priceText = mainPriceElement.textContent.trim();
      const priceMatch = priceText.match(/₹([\d,]+)/);
      if (priceMatch && priceMatch[1]) {
        mainPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        console.log("Extracted main price:", mainPrice);
      }
    }
    
    // If we couldn't find the price using selectors, use a more sophisticated approach
    if (mainPrice === null) {
      console.log("Couldn't find price with selectors, using alternative method");
      
      // Get all elements that might contain price information
      const allElements = document.querySelectorAll('*');
      let priceElements = [];
      
      // Find all elements with text content starting with ₹
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        const text = element.textContent ? element.textContent.trim() : '';
        
        if (text.startsWith('₹')) {
          priceElements.push({
            element: element,
            text: text
          });
          console.log("Found potential price element:", text);
        }
      }
      
      console.log("Found " + priceElements.length + " potential price elements");
      
      // Filter price elements to exclude small values (likely discounts) and elements with specific keywords
      const filteredPriceElements = priceElements.filter(item => {
        const text = item.text;
        
        // Extract the numeric value
        const priceMatch = text.match(/₹([\d,]+)/);
        if (!priceMatch || !priceMatch[1]) return false;
        
        const numericPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        
        // Check if this element or its parent contains discount-related text
        const elementText = item.element.textContent.toLowerCase();
        const parentText = item.element.parentElement ? 
                          item.element.parentElement.textContent.toLowerCase() : '';
        
        const isDiscount = elementText.includes('discount') || 
                          elementText.includes('off') ||
                          elementText.includes('save') ||
                          parentText.includes('discount') ||
                          parentText.includes('off') ||
                          parentText.includes('save');
        
        // Check if the price is too small (likely a discount amount)
        const isTooSmall = numericPrice < 100;
        
        // Check if the element has specific classes that indicate it's the main price
        const hasMainPriceClass = item.element.classList.contains('_30jeq3') ||
                                 item.element.classList.contains('_1_WHN1') ||
                                 item.element.classList.contains('CEmiEU') ||
                                 item.element.classList.contains('_16Jk6d');
        
        // If it has a main price class, always include it
        if (hasMainPriceClass) return true;
        
        // Otherwise, filter out discounts and small values
        return !isDiscount && !isTooSmall;
      });
      
      console.log("After filtering, found " + filteredPriceElements.length + " valid price elements");
      
      // Extract numeric values from filtered price elements
      let prices = [];
      for (let i = 0; i < filteredPriceElements.length; i++) {
        const priceText = filteredPriceElements[i].text;
        // Extract numeric value (remove ₹ and commas)
        const priceMatch = priceText.match(/₹([\d,]+)/);
        
        if (priceMatch && priceMatch[1]) {
          const numericPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
          if (!isNaN(numericPrice)) {
            prices.push(numericPrice);
            console.log("Extracted valid price:", numericPrice);
          }
        }
      }
      
      console.log("Extracted prices:", prices);
      
      // Find the most likely price (not necessarily the minimum)
      // For Flipkart, the current price is usually the second largest price
      // (after the original/list price)
      if (prices.length > 0) {
        // Sort prices in descending order
        prices.sort((a, b) => b - a);
        console.log("Sorted prices (descending):", prices);
        
        // If we have multiple prices, the second one is likely the actual price
        // (first one is usually the list price)
        if (prices.length > 1) {
          mainPrice = prices[1];
          console.log("Selected second highest price:", mainPrice);
        } else {
          // If we only have one price, use that
          mainPrice = prices[0];
          console.log("Only one price found, using it:", mainPrice);
        }
      }
    }
    
    // Format the price with ₹ symbol and commas
    const formattedPrice = mainPrice !== null ? 
      '₹' + mainPrice.toLocaleString('en-IN') : null;
    
    // Get the product name from the page or use the provided one
    let name = productName;
    
    // Try to get a more accurate name from the page
    const nameElement = document.querySelector('.B_NuCI') || 
                       document.querySelector('h1.yhB1nd') || 
                       document.querySelector('span.B_NuCI');
    
    if (nameElement) {
      name = nameElement.textContent.trim();
      console.log("Found product name on page:", name);
    }
    
    // Get the current URL
    const url = window.location.href;
    
    console.log("Final product details:", {
      name: name,
      price: formattedPrice,
      url: url
    });
    
    // Send results back to background script
    chrome.runtime.sendMessage({
      action: 'searchResults',
      store: 'flipkart',
      data: {
        name: name,
        price: formattedPrice,
        url: url
      }
    });
    
    return { 
      success: true, 
      data: { 
        name: name, 
        price: formattedPrice, 
        url: url 
      } 
    };
  } catch (error) {
    console.error('Error extracting Flipkart product details:', error);
    
    // Send null result if we couldn't extract data
    chrome.runtime.sendMessage({
      action: 'searchResults',
      store: 'flipkart',
      data: null
    });
    
    return { success: false, error: error.toString() };
  }
}

// Function to search on Amazon
async function searchOnAmazon(query) {
  return new Promise((resolve, reject) => {
    // Create a new tab to search on Amazon
    chrome.tabs.create({
      url: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
      active: false
    }, function(tab) {
      if (!tab) {
        console.error("Failed to create tab for Amazon search");
        resolve(); // Resolve anyway to continue
        return;
      }

      console.log("Created Amazon tab with ID:", tab.id);
      
      // Listen for tab updates
      const tabListener = function(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          console.log("Amazon tab loaded completely, executing script");
          
          // Wait a bit for any AJAX content to load
          setTimeout(() => {
            // Execute script in the tab
            try {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractAmazonData
              }, (results) => {
                console.log("Amazon script execution results:", results);
                
                // Close the tab after getting results
                chrome.tabs.remove(tab.id, () => {
                  console.log("Closed Amazon tab");
                  chrome.tabs.onUpdated.removeListener(tabListener);
                  resolve();
                });
              });
            } catch (error) {
              console.error("Error executing script in Amazon tab:", error);
              // Close the tab and resolve anyway
              chrome.tabs.remove(tab.id, () => {
                chrome.tabs.onUpdated.removeListener(tabListener);
                resolve();
              });
            }
          }, 3000);
        }
      };
      
      chrome.tabs.onUpdated.addListener(tabListener);
      
      // Set a timeout to close the tab if it takes too long
      setTimeout(() => {
        try {
          chrome.tabs.get(tab.id, (tabInfo) => {
            if (tabInfo) {
              console.log("Timeout reached, closing Amazon tab");
              chrome.tabs.remove(tab.id);
              chrome.tabs.onUpdated.removeListener(tabListener);
              resolve();
            }
          });
        } catch (e) {
          // Tab might already be closed
          console.log("Tab might already be closed:", e);
          resolve();
        }
      }, 20000);
    });
  });
}

// Function to extract data from Amazon
function extractAmazonData() {
  console.log("Extracting data from Amazon page");
  
  try {
    // First try to get the product URL directly from the current page
    // This is useful if we've been redirected to a product page
    let productUrl = window.location.href;
    console.log("Current page URL:", productUrl);
    
    // Check if we're on a product page
    const isProductPage = productUrl.includes('/dp/') || 
                         document.querySelector('#productTitle') !== null;
    
    if (isProductPage) {
      console.log("We're on a product page, using current URL");
      
      // Extract product details from product page
      const nameElement = document.querySelector('#productTitle');
      const priceElement = document.querySelector('.a-price .a-offscreen') || 
                         document.querySelector('.a-price-whole');
      
      const name = nameElement ? nameElement.textContent.trim() : "Amazon Product";
      const price = priceElement ? priceElement.textContent.trim() : null;
      
      // Send results back to background script
      chrome.runtime.sendMessage({
        action: 'searchResults',
        store: 'amazon',
        data: {
          name: name,
          price: price,
          url: productUrl
        }
      });
      
      return { success: true, data: { name, price, url: productUrl } };
    }
    
    // If we're on a search results page, get the first product
    console.log("We're on a search results page, extracting first product");
    
    // Get the first product result
    const productElement = document.querySelector('div.s-result-item[data-component-type="s-search-result"]');
    console.log("Found product element:", productElement);
    
    if (productElement) {
      // Try multiple selectors for name, price, and link
      // Name selectors
      const nameSelectors = [
        'h2 .a-link-normal',
        'h2 a.a-link-normal',
        '.a-size-medium.a-color-base.a-text-normal',
        '.a-size-base-plus.a-color-base.a-text-normal'
      ];
      
      // Price selectors
      const priceSelectors = [
        '.a-price .a-offscreen',
        '.a-price-whole',
        'span.a-price span.a-offscreen'
      ];
      
      // Link selectors
      const linkSelectors = [
        'h2 a.a-link-normal',
        'a.a-link-normal[href*="/dp/"]',
        '.a-link-normal.s-no-outline[href*="/dp/"]',
        'a[href*="/dp/"]'
      ];
      
      // Try to find name using different selectors
      let nameElement = null;
      for (const selector of nameSelectors) {
        nameElement = productElement.querySelector(selector);
        if (nameElement) {
          console.log("Found name with selector:", selector);
          break;
        }
      }
      
      // Try to find price using different selectors
      let priceElement = null;
      for (const selector of priceSelectors) {
        priceElement = productElement.querySelector(selector);
        if (priceElement) {
          console.log("Found price with selector:", selector);
          break;
        }
      }
      
      // Try to find link using different selectors
      let linkElement = null;
      for (const selector of linkSelectors) {
        linkElement = productElement.querySelector(selector);
        if (linkElement) {
          console.log("Found link with selector:", selector);
          break;
        }
      }
      
      // If still no link, try to find any link in the product element
      if (!linkElement) {
        console.log("No link found with specific selectors, trying generic approach");
        const allLinks = productElement.querySelectorAll('a');
        console.log("Found " + allLinks.length + " links in product element");
        
        for (let i = 0; i < allLinks.length; i++) {
          const href = allLinks[i].getAttribute('href');
          if (href && href.includes('/dp/')) {
            linkElement = allLinks[i];
            console.log("Found product link at index " + i + ":", href);
            break;
          }
        }
      }
      
      // If still no link, try an even more aggressive approach
      if (!linkElement) {
        console.log("Still no link found, trying more aggressive approach");
        // Look for any link on the page that contains /dp/
        const allPageLinks = document.querySelectorAll('a[href*="/dp/"]');
        console.log("Found " + allPageLinks.length + " product links on the page");
        
        if (allPageLinks.length > 0) {
          linkElement = allPageLinks[0];
          console.log("Using first product link found on page:", linkElement.getAttribute('href'));
        }
      }
      
      // Get product details
      const name = nameElement ? nameElement.textContent.trim() : "Amazon Product";
      const price = priceElement ? priceElement.textContent.trim() : null;
      const url = linkElement ? linkElement.getAttribute('href') : null;
      
      console.log("Name:", name);
      console.log("Price:", price);
      console.log("Raw Amazon URL:", url);
      
      // Format the URL - ensure it's absolute
      let formattedUrl = null;
      if (url) {
        formattedUrl = url.startsWith('http') ? url : ('https://www.amazon.in' + (url.startsWith('/') ? '' : '/') + url);
        console.log("Formatted Amazon URL:", formattedUrl);
      } else {
        console.error("No URL found for Amazon product");
        
        // If we couldn't find a URL but have a product, create a search URL
        if (name) {
          formattedUrl = `https://www.amazon.in/s?k=${encodeURIComponent(name)}`;
          console.log("Created search URL as fallback:", formattedUrl);
        }
      }
      
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
      
      return { success: true, data: { name, price, url: formattedUrl } };
    } else {
      console.error("No product element found on Amazon");
      
      // Try to find any product link on the page as a last resort
      const anyProductLink = document.querySelector('a[href*="/dp/"]');
      if (anyProductLink) {
        const url = anyProductLink.getAttribute('href');
        const formattedUrl = url.startsWith('http') ? url : ('https://www.amazon.in' + (url.startsWith('/') ? '' : '/') + url);
        
        console.log("Found a product link as last resort:", formattedUrl);
        
        chrome.runtime.sendMessage({
          action: 'searchResults',
          store: 'amazon',
          data: {
            name: "Amazon Product",
            price: null,
            url: formattedUrl
          }
        });
        
        return { success: true, data: { name: "Amazon Product", price: null, url: formattedUrl } };
      }
      
      chrome.runtime.sendMessage({
        action: 'searchResults',
        store: 'amazon',
        data: null
      });
      
      return { success: false, error: "No product element found" };
    }
  } catch (error) {
    console.error('Error extracting Amazon data:', error);
    chrome.runtime.sendMessage({
      action: 'searchResults',
      store: 'amazon',
      data: null
    });
    
    return { success: false, error: error.toString() };
  }
}

// Listen for close tab requests
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'closeTab' && sender.tab) {
    chrome.tabs.remove(sender.tab.id);
  }
});
