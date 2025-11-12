// Simple script to load images from app.json and populate card images
// It expects app.json to be in the project root and the page to be served over HTTP

async function loadGames() {
  try {
    const res = await fetch('app.json');
    if (!res.ok) throw new Error('Kunne ikke hente app.json: ' + res.status);
    const games = await res.json();

    // Collect all img elements inside cards in document order
    const cardImgs = Array.from(document.querySelectorAll('.card img'));
    // Map first N games to the images
    for (let i = 0; i < cardImgs.length && i < games.length; i++) {
      cardImgs[i].src = games[i].image || cardImgs[i].src;
      cardImgs[i].alt = games[i].title || cardImgs[i].alt;
    }
  } catch (err) {
    console.error(err);
  }
}

window.addEventListener('DOMContentLoaded', loadGames);
