document.addEventListener('DOMContentLoaded', function() {
  const searchBtn = document.getElementById('searchBtn');
  const songNameInput = document.getElementById('songName');
  const musicDirectorEl = document.getElementById('musicDirector');
  const singerEl = document.getElementById('singer');
  const factsEl = document.getElementById('facts');
  const instrumentsEl = document.getElementById('instruments');
  const songImageEl = document.getElementById('songImage');
  const downloadBtn = document.getElementById('downloadBtn');
  const linksEl = document.getElementById('links');

  searchBtn.addEventListener('click', function() {
    const songName = songNameInput.value;

    chrome.runtime.sendMessage({
      action: 'searchSong',
      songName: songName
    }, function(response) {
      if (response) {
        musicDirectorEl.textContent = response.musicDirector || 'Not found';
        singerEl.textContent = response.singer || 'Not found';
        factsEl.textContent = response.facts || 'Not found';
        instrumentsEl.textContent = response.instruments || 'Not found';
        songImageEl.src = response.image || '';

        // Clear existing links
        linksEl.innerHTML = '';
        if (response.links && response.links.length > 0) {
          response.links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link;
            a.textContent = link;
            a.target = '_blank'; // Open in new tab
            li.appendChild(a);
            linksEl.appendChild(li);
          });
        }
      } else {
        musicDirectorEl.textContent = 'Error: Could not retrieve information.';
      }
    });
  });

  downloadBtn.addEventListener('click', function() {
    const imageURL = songImageEl.src;
    if (imageURL) {
      chrome.downloads.download({
        url: imageURL,
        filename: 'song_image.png' // Optional
      });
    }
  });
});
