const cheerio = require('cheerio');

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "searchSong") {
      const songName = request.songName;

      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(songName)} song information`;

      fetch(searchUrl)
        .then(response => response.text())
        .then(data => {
          const $ = cheerio.load(data);
          let musicDirector = '';
          let singer = '';
          let facts = '';
          let instruments = '';
          let links = [];

          // Extract information from the search results
          // This is a basic example, you may need to adjust the selectors based on the actual HTML structure
          musicDirector = $(".kCrYT > a:contains('Music Director')").text().replace('Music Director: ', '');
          singer = $(".kCrYT > a:contains('Singer')").text().replace('Singer: ', '');
          facts = $(".kCrYT > a:contains('Facts')").text().replace('Facts: ', '');

          // Get links from the search results
          $(".kCrYT > a").each((i, el) => {
            links.push($(el).attr('href'));
          });

          const songInfo = {
            musicDirector: musicDirector || 'Not found',
            singer: singer || 'Not found',
            facts: facts || 'Not found',
            instruments: instruments || 'I cannot specify what instruments were used in making this song',
            image: "https://via.placeholder.com/200", // Placeholder image
            links: links
          };

          sendResponse(songInfo);
        })
        .catch(error => {
          console.error('Error:', error);
          sendResponse({
            musicDirector: 'Error: Could not retrieve information.',
            singer: 'Error: Could not retrieve information.',
            facts: 'Error: Could not retrieve information.',
            instruments: 'I cannot specify what instruments were used in making this song',
            image: "",
            links: []
          });
        });
    }
  }
);
