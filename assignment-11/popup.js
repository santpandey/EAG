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
    
    if (query) {
      // Show loader, hide results and error
      loader.style.display = 'flex';
      results.style.display = 'none';
      error.style.display = 'none';
      
      // Send message to background script to start search
      //chrome.runtime.sendMessage({
        //action: 'search',
        //query: query
      //});
      // Send message to background script to start search
chrome.runtime.sendMessage({
  action: 'searchProduct',
  query: query
}, function(response) {
  // Hide loader
  loader.style.display = 'none';
  
  if (response && response.success) {
    // Update UI with search results
    updateResults(response.data);
    // Show results
    results.style.display = 'block';
  } else {
    // Show error
    error.style.display = 'block';
  }
});
    }
  });
  
  // Enter key press event for search input
  productInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  });
  
  
  // Function to update the UI with search results
  function updateResults(data) {
    // Update Flipkart data
    if (data.flipkart) {
      flipkartName.textContent = data.flipkart.name || 'Product not found';
      flipkartPrice.textContent = data.flipkart.price || 'N/A';
      
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
      amazonName.textContent = data.amazon.name || 'Product not found';
      amazonPrice.textContent = data.amazon.price || 'N/A';
      
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
    let flipkartPriceValue = 0;
    let amazonPriceValue = 0;
    let bestPriceStore = '';
    let bestPriceAmount = 0;

    
    // Extract Flipkart price
    if (data.flipkart && data.flipkart.price) {
      flipkartPriceValue = extractPriceValue(data.flipkart.price);
    }
    
    // Extract Amazon price
    if (data.amazon && data.amazon.price) {
      amazonPriceValue = extractPriceValue(data.amazon.price);
    }
    
    // Compare prices
    if (flipkartPriceValue > 0 && amazonPriceValue > 0) {
      // Both prices available
      if (flipkartPriceValue <= amazonPriceValue) {
        bestPriceStore = 'Flipkart';
        bestPriceAmount = flipkartPriceValue;
        bestPriceLink.href = flipkartLink.href;
      } else {
        bestPriceStore = 'Amazon';
        bestPriceAmount = amazonPriceValue;
        bestPriceLink.href = amazonLink.href;
      }
    } else if (flipkartPriceValue > 0) {
      // Only Flipkart price available
      bestPriceStore = 'Flipkart';
      bestPriceAmount = flipkartPriceValue;
      bestPriceLink.href = flipkartLink.href;
    } else if (amazonPriceValue > 0) {
      // Only Amazon price available
      bestPriceStore = 'Amazon';
      bestPriceAmount = amazonPriceValue;
      bestPriceLink.href = amazonLink.href;
    } else {
      // No prices available
      bestPriceStore = 'N/A';
      bestPriceAmount = 0;
      bestPriceLink.href = '#';
    }
    
    // Update best price section
    if (bestPriceStore !== 'N/A') {
      bestStore.textContent = bestPriceStore;
      bestPriceValue.textContent = bestPriceAmount.toFixed(2);
      document.getElementById('best-price').style.display = 'block';
    } else {
      document.getElementById('best-price').style.display = 'none';
    }
  }
  
  // Helper function to extract numeric price value from price string
  function extractPriceValue(priceString) {
    if (!priceString) return 0;
    
    // Remove currency symbols, commas, and other non-numeric characters except decimal point
    const numericString = priceString.replace(/[^\d.]/g, '');
    
    // Parse as float
    const price = parseFloat(numericString);
    
    return isNaN(price) ? 0 : price;
  }
});
