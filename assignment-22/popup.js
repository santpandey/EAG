document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const songInput = document.getElementById("songInput");
  const searchButton = document.getElementById("searchButton");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const results = document.getElementById("results");
  const errorMessage = document.getElementById("errorMessage");
  const artistsInfo = document.getElementById("artistsInfo");
  const songFacts = document.getElementById("songFacts");
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

    // Display sources
    displaySources(songData.sources);
  }

  // Display artists information
  function displayArtistsInfo(basicInfo) {
    artistsInfo.innerHTML = "";

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

  // Display sources
  function displaySources(sourcesList) {
    sourcesContainer.innerHTML = "";

    if (sourcesList && sourcesList.length > 0) {
      sourcesList.forEach((source) => {
        const sourceLink = document.createElement("a");
        sourceLink.href = source.url;
        sourceLink.textContent = source.name;
        sourceLink.target = "_blank";
        sourceLink.className = "source-link";
        sourcesContainer.appendChild(sourceLink);
      });
    }
  }

  // Reset UI
  function resetUI() {
    results.classList.add("hidden");
    errorMessage.classList.add("hidden");
    artistsInfo.innerHTML = "";
    songFacts.innerHTML = "";
    sourcesContainer.innerHTML = "";
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
