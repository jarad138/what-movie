const token = "xxxx";

// Url things
const bearerToken = `Bearer ${token}`;
const notFoundImage =
  "https://user-images.githubusercontent.com/24848110/33519396-7e56363c-d79d-11e7-969b-09782f5ccbab.png";
const baseUrl = "https://api.themoviedb.org/3";
const imageBaseUrl = "https://image.tmdb.org/t/p/w200";

// Elements
let selectedActors = []; // Track the two selected actors
const shareButton = document.getElementById("shareButton");
const actorsContainer = document.getElementById("actorsContainer");
const feedback = document.getElementById("feedback");
const guessInput = document.getElementById("guessInput");
const submitGuess = document.getElementById("submitGuess");

// Fetch actor details by ID
async function fetchActorDetails(actorId) {
  const url = `${baseUrl}/person/${actorId}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: bearerToken,
    },
  });

  return await response.json();
}

// Render actors
async function renderActors(actorId1, actorId2) {
  const actor1Details = await fetchActorDetails(actorId1);
  const actor2Details = await fetchActorDetails(actorId2);

  // Render actor 1
  if (actor1Details) {
    actorsContainer.innerHTML += `
      <div class="actor">
        <img src="${imageBaseUrl}${actor1Details.profile_path}" alt="${actor1Details.name}" />
        <p>${actor1Details.name}</p>
      </div>
    `;
  }

  // Render actor 2
  if (actor2Details) {
    actorsContainer.innerHTML += `
      <div class="actor">
        <img src="${imageBaseUrl}${actor2Details.profile_path}" alt="${actor2Details.name}" />
        <p>${actor2Details.name}</p>
      </div>
    `;
  }
}

async function searchMovieByTitle(title) {
  const encodedTitle = encodeURIComponent(title);
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodedTitle}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: bearerToken,
    },
  });

  const data = await response.json();

  return data.results.sort((a, b) => b.popularity - a.popularity);
}

async function fetchActors(movieId, listItem) {
  console.log("fetching cast for movie id:", movieId);

  // Clear any previous actor lists below this item
  const existingActorList = listItem.querySelector("ul");
  if (existingActorList) {
    listItem.removeChild(existingActorList);
    return; // Collapse the actor list if clicked again
  }

  try {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/credits`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: bearerToken,
      },
    });

    const data = await response.json();

    if (data.cast && data.cast.length > 0) {
      const actorList = document.createElement("ul"); // Create a sublist for actors
      actorList.style.marginTop = "10px";
      actorList.style.listStyleType = "none";
      actorList.style.padding = "0";

      data.cast
        .sort((a, b) => b.popularity - a.popularity)
        // Limit to top 10 actors
        .slice(0, 10)
        .forEach((actor) => {
          const actorItem = document.createElement("li");
          actorItem.style.display = "flex";
          actorItem.style.alignItems = "center";
          actorItem.style.marginBottom = "10px";

          const imageUrl = actor.profile_path
            ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` // Construct the image URL
            : "https://via.placeholder.com/50x75?text=No+Image"; // Placeholder if no image is available

          actorItem.innerHTML = `
          <img src="${imageUrl}" alt="${actor.name}" style="width: 50px; height: 75px; object-fit: cover; margin-right: 10px; border-radius: 5px;">
          <span>${actor.name}</span>
        `;

          actorItem.addEventListener("click", (event) => {
            event.stopPropagation();
            selectActor(actor, actorItem);
          });

          actorList.appendChild(actorItem);
        });

      listItem.appendChild(actorList);
    } else {
      alert("No actors found for this movie.");
    }
  } catch (error) {
    console.error("Error fetching actors:", error);
    alert("Error fetching actors. Please try again later.");
  }
}

function selectActor(actor, actorItem) {
  // Check if actor is already selected
  const actorIndex = selectedActors.findIndex((a) => a.id === actor.id);

  console.log("actorIndex", actorIndex, "name", actor.name, "id", actor.id);

  if (actorIndex > -1) {
    selectedActors.splice(actorIndex, 1); // Deselect if clicked again
    actorItem.style.border = ""; // Remove highlight
  } else {
    if (selectedActors.length < 2) {
      selectedActors.push(actor); // Add to selected list
      actorItem.style.border = "2px solid #007BFF"; // Highlight selected actor
    } else {
      alert("You can only select two actors.");
    }
  }

  // Show the "Send Link to Friend" button if two actors are selected
  shareButton.style.display = selectedActors.length === 2 ? "block" : "none";
}

// Trigger renderActors only on guess.html
document.addEventListener("DOMContentLoaded", () => {
  console.log("dom loaded", window.location.pathname);
  if (window.location.pathname.endsWith("guess.html")) {
    console.log("dom loaded rendering actors");

    const urlParams = new URLSearchParams(window.location.search);
    const actor1Id = urlParams.get("actor1");
    const actor2Id = urlParams.get("actor2");

    renderActors(actor1Id, actor2Id);

    // Event listener for the guess button
    submitGuess.addEventListener("click", async () => {
      const guess = guessInput.value.trim();

      if (!guess) {
        feedback.textContent = "Please enter a guess.";
        feedback.style.color = "red";
        return;
      }

      // Hardcoded answer for now!! Need to do this better to pass
      // the movie from the other page somehow!
      let answer = "terminator";

      if (guess === answer) {
        feedback.textContent = `Correct! The movie is "${answer}".`;
        feedback.style.color = "green";
      } else {
        feedback.textContent = "Incorrect guess. Try again!";
        feedback.style.color = "red";
      }
    });

    return;
  }

  shareButton.addEventListener("click", async () => {
    if (selectedActors.length === 2) {
      const actor1Id = selectedActors[0].id; // Use actor ID
      const actor2Id = selectedActors[1].id; // Use actor ID

      // Generate a shareable link with actor IDs
      const shareLink = `${window.location.href.replace(
        /\/index\.html$/,
        "",
      )}/guess.html?actor1=${actor1Id}&actor2=${actor2Id}`;

      console.log("link:", shareLink);

      try {
        // Copy the link to the clipboard
        await navigator.clipboard.writeText(shareLink);

        // Show the notification next to the button
        const notification = document.getElementById("notification");
        const buttonRect = shareButton.getBoundingClientRect();

        // Position the notification near the button
        notification.style.top = `${buttonRect.top + window.scrollY - 10}px`;
        notification.style.left = `${buttonRect.left + window.scrollX + shareButton.offsetWidth + 10
          }px`;
        notification.style.display = "block";

        // Automatically hide the notification after 3 seconds
        setTimeout(() => {
          notification.style.display = "none";
        }, 2000);
      } catch (error) {
        console.error("Failed to copy the link:", error);
        alert("Failed to copy the link. Please try again.");
      }
    } else {
      alert("Please select two actors.");
    }
  });

  document
    .getElementById("movieForm")
    .addEventListener("submit", async function(event) {
      event.preventDefault(); // Prevent default form submission
      const title = document.getElementById("movieInput").value;
      const movieList = document.getElementById("movieList");

      movieList.innerHTML = "";

      if (title.trim() === "") {
        alert("Please enter a movie name.");
        return;
      }

      try {
        const movies = await searchMovieByTitle(title);
        if (movies && movies.length > 0) {
          movies.forEach((movie) => {
            const listItem = document.createElement("li");

            listItem.innerHTML = `
          <strong>${movie.title}</strong>
          <span>Release Date: ${movie.release_date || "N/A"}</span>
        `;

            listItem.addEventListener("click", () =>
              fetchActors(movie.id, listItem),
            );

            movieList.appendChild(listItem);
          });
        } else {
          movieList.innerHTML = "<li>No movies found.</li>";
        }
      } catch (error) {
        alert("failed to search movie: " + error);
      }
    });
});
