document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const songInput = document.getElementById("songInput");
  const searchButton = document.getElementById("searchButton");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const results = document.getElementById("results");
  const errorMessage = document.getElementById("errorMessage");
  const artistsInfo = document.getElementById("artistsInfo");
  const songFacts = document.getElementById("songFacts");
  const instrumentsInfo = document.getElementById("instrumentsInfo");
  const imageContainer = document.getElementById("imageContainer");
  const songImage = document.getElementById("songImage");
  let downloadButton = document.getElementById("downloadButton");
  const imageLoading = document.getElementById("imageLoading");
  const imageError = document.getElementById("imageError");
  const sourcesContainer = document.getElementById("sources");

  // Event listeners
  searchButton.addEventListener("click", searchSong);
  songInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchSong();
    }
  });

  // Search function
  async function searchSong() {
    const songName = songInput.value.trim();

    if (!songName) {
      alert("Please enter a song name");
      return;
    }

    // Reset UI
    resetUI();
    showLoading();

    try {
      // Use the ApiService to fetch real song information
      const songData = await ApiService.searchSong(songName);

      if (songData.success) {
        // Generate an image for the song
        const imageUrl = await ApiService.generateImage(
          songName,
          songData.basicInfo
        );
        songData.imageUrl = imageUrl;

        displayResults(songData);
      } else {
        showError();
      }
    } catch (error) {
      console.error("Error searching for song:", error);
      showError();
    } finally {
      hideLoading();
    }
  }

  // Display results
  function displayResults(songData) {
    // Clear previous results first
    resetUI();

    // Show results container
    results.classList.remove("hidden");

    // Display artists information
    displayArtistsInfo(songData.basicInfo);

    // Display song facts
    displaySongFacts(songData.facts);

    // Display instruments used
    displayInstrumentsInfo(songData.instruments);

    // Display image if available
    if (songData.imageUrl) {
      displaySongImage(songData.imageUrl);
    } else {
      imageError.classList.remove("hidden");
    }

    // Display sources
    displaySources(songData.sources);
  }

  // Display artists information
  function displayArtistsInfo(basicInfo) {
    artistsInfo.innerHTML = "";

    // Music Director
    const directorDiv = document.createElement("div");
    directorDiv.className = "artist-info";
    directorDiv.innerHTML = `
      <span class="artist-type">Music Director:</span>
      <span class="artist-name">${basicInfo.musicDirector}</span>
    `;
    artistsInfo.appendChild(directorDiv);

    // Singers
    const singersDiv = document.createElement("div");
    singersDiv.className = "artist-info";
    singersDiv.innerHTML = `
      <span class="artist-type">Singer(s):</span>
      <span class="artist-name">${basicInfo.singers.join(", ")}</span>
    `;
    artistsInfo.appendChild(singersDiv);

    // Album & Year
    if (basicInfo.album !== "Unknown" || basicInfo.releaseYear !== "Unknown") {
      const albumDiv = document.createElement("div");
      albumDiv.className = "artist-info";
      albumDiv.innerHTML = `
        <span class="artist-type">Album & Year:</span>
        <span class="artist-name">${basicInfo.album} (${basicInfo.releaseYear})</span>
      `;
      artistsInfo.appendChild(albumDiv);
    }
  }

  // Display song facts
  function displaySongFacts(facts) {
    // Ensure we clear previous facts
    songFacts.innerHTML = "";

    if (!facts || facts.length === 0) {
      const factDiv = document.createElement("div");
      factDiv.className = "fact-item";
      factDiv.textContent = "No facts found for this song.";
      songFacts.appendChild(factDiv);
      return;
    }

    facts.forEach((fact) => {
      const factDiv = document.createElement("div");
      factDiv.className = "fact-item";
      factDiv.textContent = fact;
      songFacts.appendChild(factDiv);
    });
  }

  // Display instruments information
  function displayInstrumentsInfo(instruments) {
    instrumentsInfo.innerHTML = "";

    instruments.forEach((instrument) => {
      const instrumentDiv = document.createElement("div");
      instrumentDiv.className = "instrument-item";
      instrumentDiv.textContent = instrument;
      instrumentsInfo.appendChild(instrumentDiv);
    });
  }

  // Display song image
  function displaySongImage(imageUrl) {
    if (imageUrl) {
      songImage.src = imageUrl;
      imageContainer.classList.remove("hidden");
      downloadButton.classList.remove("hidden");

      // Set up download button
      downloadButton.addEventListener("click", function () {
        downloadImage(imageUrl, "song-visualization.png");
      });
    } else {
      imageError.classList.remove("hidden");
    }
  }

  // Display sources
  function displaySources(sourcesList) {
    sourcesContainer.innerHTML = "";

    if (sourcesList && sourcesList.length > 0) {
      sourcesList.forEach((source) => {
        const sourceLink = document.createElement("a");
        sourceLink.href = source.url;
        sourceLink.textContent = source.name;
        sourceLink.target = "_blank";
        sourcesContainer.appendChild(sourceLink);
      });
    }
  }

  // Download image
  function downloadImage(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Reset UI
  function resetUI() {
    results.classList.add("hidden");
    errorMessage.classList.add("hidden");
    artistsInfo.innerHTML = "";
    songFacts.innerHTML = "";
    instrumentsInfo.innerHTML = "";
    imageContainer.classList.add("hidden");
    downloadButton.classList.add("hidden");
    imageLoading.classList.add("hidden");
    imageError.classList.add("hidden");
    sourcesContainer.innerHTML = "";

    // Remove any existing event listeners on the download button
    downloadButton.replaceWith(downloadButton.cloneNode(true));
    // Re-assign the cloned button
    downloadButton = document.getElementById("downloadButton");
  }

  // Show loading
  function showLoading() {
    loadingIndicator.classList.remove("hidden");
  }

  // Hide loading
  function hideLoading() {
    loadingIndicator.classList.add("hidden");
  }

  // Show error
  function showError() {
    errorMessage.classList.remove("hidden");
  }
});
