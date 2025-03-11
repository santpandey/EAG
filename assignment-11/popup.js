document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const productInput = document.getElementById('product-input');
  const searchBtn = document.getElementById('search-btn');
  const loader = document.getElementById('loader');
  const results = document.getElementById('results');
  const error = document.getElementById('error');
  
  // Flipkart elements
  const flipkartName = document.getElementById('flipkart-name');
  const flipkartPrice = document.getElementById('flipkart-price');
  const flipkartLink = document.getElementById('flipkart-link');
  
  // Amazon elements
  const amazonName = document.getElementById('amazon-name');
  const amazonPrice = document.getElementById('amazon-price');
  const amazonLink = document.getElementById('amazon-link');
  
  // Best price elements
  const bestStore = document.getElementById('best-store');
  const bestPriceValue = document.getElementById('best-price-value');
  const bestPriceLink = document.getElementById('best-price-link');
  
  // Search button click event
  searchBtn.addEventListener('click', function() {
    const query = productInput.value.trim();
    
    if (query === '') {
      alert('Please enter a product name or URL');
      return;
    }
    
    // Show loader and hide results/error
    loader.style.display = 'flex';
    results.style.display = 'none';
    error.style.display = 'none';
    
    // Send message to background script to start the search
    chrome.runtime.sendMessage({
      action: 'searchProduct',
      query: query
    }, function(response) {
      // Hide loader
      loader.style.display = 'none';
      
      if (response && response.success) {
        // Update UI with results
        updateResults(response.data);
        results.style.display = 'block';
      } else {
        // Show error message
        error.style.display = 'block';
      }
    });
  });
  
  // Prevent popup from closing when clicking on links
  flipkartLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: this.href });
    return false;
  });
  
  amazonLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: this.href });
    return false;
  });
  
  bestPriceLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: this.href });
    return false;
  });
  
  // Function to update the UI with search results
  function updateResults(data) {
    // Update Flipkart data
    if (data.flipkart) {
      flipkartName.textContent = data.flipkart.name || 'Product Name';
      flipkartPrice.textContent = data.flipkart.price || '₹0.00';
      
      // Handle Flipkart URL - add base URL if needed
      if (data.flipkart.url) {
        if (data.flipkart.url.startsWith('http')) {
          flipkartLink.href = data.flipkart.url;
        } else {
          flipkartLink.href = 'https://www.flipkart.com' + data.flipkart.url;
        }
      } else {
        flipkartLink.href = '#';
      }
      
      document.getElementById('flipkart-result').style.display = 'block';
    } else {
      document.getElementById('flipkart-result').style.display = 'none';
    }
    
    // Update Amazon data
    if (data.amazon) {
      amazonName.textContent = data.amazon.name || 'Product Name';
      amazonPrice.textContent = data.amazon.price || '₹0.00';
      
      // Handle Amazon URL - add base URL if needed
      if (data.amazon.url) {
        if (data.amazon.url.startsWith('http')) {
          amazonLink.href = data.amazon.url;
        } else {
          amazonLink.href = 'https://www.amazon.in' + data.amazon.url;
        }
      } else {
        amazonLink.href = '#';
      }
      
      document.getElementById('amazon-result').style.display = 'block';
    } else {
      document.getElementById('amazon-result').style.display = 'none';
    }
    
    // Determine best price
    let bestPrice = null;
    let bestPriceStore = '';
    let bestPriceUrl = '';
    
    if (data.flipkart && data.amazon) {
      // Extract numeric values from price strings
      const flipkartPriceValue = extractPriceValue(data.flipkart.price);
      console.log("Flipkart price is "+flipkartPriceValue);
      const amazonPriceValue = extractPriceValue(data.amazon.price);
      console.log("Amazon price is "+amazonPriceValue);
      
      if (flipkartPriceValue !== null && amazonPriceValue !== null) {
        if (flipkartPriceValue <= amazonPriceValue) {
          bestPrice = data.flipkart.price;
          bestPriceStore = 'Flipkart';
          // Format Flipkart URL
          if (data.flipkart.url) {
            bestPriceUrl = data.flipkart.url.startsWith('http') 
              ? data.flipkart.url 
              : 'https://www.flipkart.com' + data.flipkart.url;
          }
        } else {
          bestPrice = data.amazon.price;
          bestPriceStore = 'Amazon';
          // Format Amazon URL
          if (data.amazon.url) {
            bestPriceUrl = data.amazon.url.startsWith('http') 
              ? data.amazon.url 
              : 'https://www.amazon.in' + data.amazon.url;
          }
        }
      } else if (flipkartPriceValue !== null) {
        bestPrice = data.flipkart.price;
        bestPriceStore = 'Flipkart';
        // Format Flipkart URL
        if (data.flipkart.url) {
          bestPriceUrl = data.flipkart.url.startsWith('http') 
            ? data.flipkart.url 
            : 'https://www.flipkart.com' + data.flipkart.url;
        }
      } else if (amazonPriceValue !== null) {
        bestPrice = data.amazon.price;
        bestPriceStore = 'Amazon';
        // Format Amazon URL
        if (data.amazon.url) {
          bestPriceUrl = data.amazon.url.startsWith('http') 
            ? data.amazon.url 
            : 'https://www.amazon.in' + data.amazon.url;
        }
      }
    } else if (data.flipkart) {
      bestPrice = data.flipkart.price;
      bestPriceStore = 'Flipkart';
      // Format Flipkart URL
      if (data.flipkart.url) {
        bestPriceUrl = data.flipkart.url.startsWith('http') 
          ? data.flipkart.url 
          : 'https://www.flipkart.com' + data.flipkart.url;
      }
    } else if (data.amazon) {
      bestPrice = data.amazon.price;
      bestPriceStore = 'Amazon';
      // Format Amazon URL
      if (data.amazon.url) {
        bestPriceUrl = data.amazon.url.startsWith('http') 
          ? data.amazon.url 
          : 'https://www.amazon.in' + data.amazon.url;
      }
    }
    
    console.log("Best price store:", bestPriceStore);
    console.log("Best price URL:", bestPriceUrl);
    
    // Update best price section
    if (bestPrice) {
      bestStore.textContent = bestPriceStore;
      bestPriceValue.textContent = bestPrice;
      
      // Make sure the URL is valid before setting it
      if (bestPriceUrl && bestPriceUrl !== '') {
        bestPriceLink.href = bestPriceUrl;
      } else {
        // Fallback to the appropriate store URL if bestPriceUrl is empty
        if (bestPriceStore === 'Flipkart') {
          bestPriceLink.href = flipkartLink.href;
        } else if (bestPriceStore === 'Amazon') {
          bestPriceLink.href = amazonLink.href;
        } else {
          bestPriceLink.href = '#';
        }
      }
      
      document.getElementById('best-price').style.display = 'block';
    } else {
      document.getElementById('best-price').style.display = 'none';
    }
  }
  
  // Helper function to extract numeric price value from price string
  function extractPriceValue(priceString) {
    if (!priceString) return null;
    
    // Extract digits and decimal point
    const matches = priceString.match(/[\d,]+(\.\d+)?/);
    if (matches && matches[0]) {
      // Remove commas and convert to number
      return parseFloat(matches[0].replace(/,/g, ''));
    }
    
    return null;
  }
});
