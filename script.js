const token = "put your token here!!";

const bearerToken = `Bearer ${token}`;
const notFoundImage =
  "https://user-images.githubusercontent.com/24848110/33519396-7e56363c-d79d-11e7-969b-09782f5ccbab.png";

let selectedActors = []; // Track the two selected actors
const shareButton = document.getElementById("shareButton");

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

  console.log("actorIndex", actorIndex, "name", actor.name);

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

shareButton.addEventListener("click", () => {
  console.log("click share button:", selectedActors.length);

  if (selectedActors.length === 2) {
    const actor1 = encodeURIComponent(selectedActors[0].name);
    const actor2 = encodeURIComponent(selectedActors[1].name);

    // Generate a shareable link
    const shareLink = `${window.location.origin}?actor1=${actor1}&actor2=${actor2}`;
    alert(`Share this link with your friend:\n\n${shareLink}`);
  } else {
    alert("Please select two actors.");
  }
});

document
  .getElementById("movieForm")
  .addEventListener("submit", async function (event) {
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
          ); // Attach click event to fetch actors

          movieList.appendChild(listItem);
        });
      } else {
        movieList.innerHTML = "<li>No movies found.</li>";
      }
    } catch (error) {
      alert("failed to search movie: " + error);
    }
  });
