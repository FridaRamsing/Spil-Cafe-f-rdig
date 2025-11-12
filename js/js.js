// Simple script to load images from app.json and populate card images
// It expects app.json to be in the project root and the page to be served over HTTP


async function loadGames() {
  try {
    const res = await fetch('app.json');
    if (!res.ok) throw new Error('Kunne ikke hente app.json: ' + res.status);
    const games = await res.json();

    // Find sektioner/kolonner
    const sections = {
      nye: document.querySelector('.hero .cards'),
      maaned: document.querySelector('.collections .collection:nth-child(1) .cards'),
      glemte: document.querySelector('.collections .collection:nth-child(2) .cards'),
      populaere: document.querySelector('.collections .collection:nth-child(3) .cards')
    };

    // Fordel alle spil jævnt i de fire kolonner
    const sectionKeys = ['nye', 'maaned', 'glemte', 'populaere'];
    const sectionCount = sectionKeys.length;
    const sectionArrays = [[], [], [], []];
    games.forEach((game, idx) => {
      sectionArrays[idx % sectionCount].push(game);
    });

    function createCard(game, idx) {
      const card = document.createElement('article');
      card.className = 'card';
      // add data- attributes for filtering
      card.dataset.genre = (game.genre || '').toString();
      card.dataset.language = (game.language || '').toString();
      card.dataset.difficulty = (game.difficulty || '').toString();
      card.dataset.playtime = (game.playtime || 0).toString();
      card.dataset.minplayers = (game.players && game.players.min) ? game.players.min : '';
      card.dataset.maxplayers = (game.players && game.players.max) ? game.players.max : '';
      card.dataset.age = (game.age || '').toString();
      // Billede
      const media = document.createElement('div');
      media.className = 'card-media';
      const img = document.createElement('img');
      img.src = game.image || '';
      img.alt = game.title || '';
      media.appendChild(img);
      card.appendChild(media);
      // Favorit-knap
      const fav = document.createElement('button');
      fav.className = 'fav';
      const favImg = document.createElement('img');
      favImg.src = 'images/Favorite.svg';
      favImg.alt = 'Favorit';
      fav.appendChild(favImg);
      card.appendChild(fav);
      // Detaljer-knap
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'Detaljer';
      card.appendChild(btn);
      // Favorit-persist
      const storageKey = `fav:${game.title || 'card-'+idx}`;
      if (localStorage.getItem(storageKey) === '1') {
        card.classList.add('favorited');
      }
      fav.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.toggle('favorited');
        const isFav = card.classList.contains('favorited');
        localStorage.setItem(storageKey, isFav ? '1' : '0');
      });

      // Modal logic for details
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const modal = document.getElementById('game-modal');
        const body = modal.querySelector('.modal-body');
        // Build info HTML
        body.innerHTML = `
          <h2 style="margin-top:0;">${game.title || ''}</h2>
          <img src="${game.image || ''}" alt="${game.title || ''}" style="width:100%;max-width:220px;border-radius:12px;margin-bottom:12px;" />
          <p><strong>Genre:</strong> ${game.genre || '-'}</p>
          <p><strong>Spillere:</strong> ${game.players ? game.players.min + '–' + game.players.max : '-'}</p>
          <p><strong>Alder:</strong> ${game.age || '-'}</p>
          <p><strong>Varighed:</strong> ${game.playtime ? game.playtime + ' min' : '-'}</p>
          <p><strong>Stemning:</strong> ${game.difficulty || '-'}</p>
          <p style="margin-top:10px;">${game.description || ''}</p>
        `;
        modal.style.display = 'flex';
      });
      return card;
    }
    // Modal close logic
    const modal = document.getElementById('game-modal');
    if (modal) {
      // Close when clicking outside modal-content
      modal.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
          modal.style.display = 'none';
        }
      });
      // Close when clicking the close button (red circle)
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
          e.preventDefault();
          modal.style.display = 'none';
        });
      }
    }

    // Populate filter selects with unique values
    function populateFilters(items) {
      const genreSel = document.getElementById('filter-genre');
      const playersSel = document.getElementById('filter-players');
      const ageSel = document.getElementById('filter-age');
      const moodSel = document.getElementById('filter-mood');

      const genres = new Set();
      const players = new Set();
      const ages = new Set();
      const diffs = new Set();

      items.forEach(g => {
        if (g.genre) genres.add(g.genre);
        if (g.players) players.add(g.players.min + '-' + g.players.max);
        if (g.age) ages.add(g.age);
        if (g.difficulty) diffs.add(g.difficulty);
      });

      Array.from(genres).sort().forEach(v => {
        const o = document.createElement('option'); o.value = v; o.textContent = v; genreSel.appendChild(o);
      });
      Array.from(players).sort().forEach(v => {
        const o = document.createElement('option'); o.value = v; o.textContent = v.replace('-', '–'); playersSel.appendChild(o);
      });
      Array.from(ages).sort((a,b)=>a-b).forEach(v => {
        const o = document.createElement('option'); o.value = v; o.textContent = v + '+'; ageSel.appendChild(o);
      });
      Array.from(diffs).sort().forEach(v => {
        const o = document.createElement('option'); o.value = v; o.textContent = v; moodSel.appendChild(o);
      });
    }

    function applyFilters() {
      const dur = document.getElementById('filter-duration').value;
      const players = document.getElementById('filter-players').value;
      const genre = document.getElementById('filter-genre').value;
      const age = document.getElementById('filter-age').value;
      const mood = document.getElementById('filter-mood').value;
      const search = document.getElementById('search-bar') ? document.getElementById('search-bar').value.trim().toLowerCase() : '';

      const allCards = document.querySelectorAll('.collections .cards .card, .hero .cards .card');
      allCards.forEach(card => {
        let show = true;
        const pt = parseInt(card.dataset.playtime || '0', 10);
        const minp = card.dataset.minplayers ? parseInt(card.dataset.minplayers,10) : 0;
        const maxp = card.dataset.maxplayers ? parseInt(card.dataset.maxplayers,10) : 0;
        const cardAge = card.dataset.age ? parseInt(card.dataset.age,10) : 0;
        const title = card.querySelector('.card-media + .fav + .btn') ? card.querySelector('.card-media + .fav + .btn').textContent : '';
        // Search by game title (from image alt or game.title)
        const img = card.querySelector('img');
        const cardTitle = img && img.alt ? img.alt.toLowerCase() : '';

        if (search) {
          show = show && cardTitle.includes(search);
        }
        if (dur) {
          if (dur === '<=30') show = show && (pt <= 30);
          else if (dur === '<=60') show = show && (pt <= 60);
          else if (dur === '<=90') show = show && (pt <= 90);
          else if (dur === '>90') show = show && (pt > 90);
        }
        if (players) {
          const [minS, maxS] = players.split('-').map(n=>parseInt(n,10));
          // show if players range overlaps
          show = show && !(maxp < minS || minp > maxS);
        }
        if (genre) show = show && (card.dataset.genre === genre);
        if (age) show = show && (cardAge >= parseInt(age,10));
        if (mood) show = show && (card.dataset.difficulty === mood);

        card.style.display = show ? '' : 'none';
      });
    }

    // Note: populateFilters and event wiring will run after cards are injected (see below)

    // Ryd eksisterende kort
    Object.values(sections).forEach(sec => sec.innerHTML = '');

    // Tilføj kort til hver sektion
    sectionArrays.forEach((arr, sIdx) => {
      arr.forEach((game, idx) => {
        sections[sectionKeys[sIdx]].appendChild(createCard(game, idx));
      });
    });

    // Populate filters and wire events now that cards are present in the DOM
    populateFilters(games);
    ['filter-duration','filter-players','filter-genre','filter-age','filter-mood'].forEach(id=>{
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', applyFilters);
    });
    // Search bar event
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
      searchBar.addEventListener('input', applyFilters);
    }
    const clear = document.getElementById('filter-clear');
    if (clear) clear.addEventListener('click', ()=>{
      ['filter-duration','filter-players','filter-genre','filter-age','filter-mood'].forEach(id=>{
        const e = document.getElementById(id); if (e) e.value = ''; });
      applyFilters();
    });

  } catch (err) {
    console.error(err);
  }
}

window.addEventListener('DOMContentLoaded', loadGames);


