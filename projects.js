// projects.js — fetches recent public GitHub repos and renders cards into #projects-grid
(function () {
  'use strict';

  const GRID_ID = 'projects-grid';
  const MANUAL_SECTION_SELECTOR = '.manual-projects';
  const DEFAULT_PER_PAGE = 3;
  // fetch a larger page so we can filter excluded repos and still show DEFAULT_PER_PAGE
  const FETCH_PAGE = 10;
  // repositories to exclude from the recent list
  const EXCLUDED_REPOS = ['Lama-Raj.github.io', 'Lama-Raj'];
  // cache key and TTL (ms)
  const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

  function getUsername() {
    // 1) allow override via global
    if (window.GITHUB_USERNAME) return window.GITHUB_USERNAME;

    // 2) look for a GitHub link in the sidebar/contact area
    try {
      const a = document.querySelector('.contact-info a[href*="github.com/"]');
      if (a) {
        const href = a.getAttribute('href');
        const m = href.match(/github\.com\/(?!settings)([^\/\?\#]+)/i);
        if (m && m[1]) return m[1];
      }
    } catch (e) {
      /* ignore */
    }

    // 3) fallback to placeholder (page contains 'yourusername' by default)
    return 'yourusername';
  }

  function showManualFallback(gridEl, message) {
    gridEl.innerHTML = '';
    const manual = document.querySelector(MANUAL_SECTION_SELECTOR);
    const card = document.createElement('div');
    card.className = 'project-card';
    const p = document.createElement('p');
    p.textContent = message || 'Unable to load projects from GitHub. Showing manual project list below.';
    card.appendChild(p);
    gridEl.appendChild(card);
    if (manual) manual.style.display = 'block';
  }

  function createRepoCard(repo) {
    const card = document.createElement('div');
    card.className = 'project-card';

    // cover intentionally removed — keep cards minimal and text-focused

    const h3 = document.createElement('h3');
    const a = document.createElement('a');
    a.href = repo.html_url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = repo.name;
    h3.appendChild(a);
    card.appendChild(h3);

    if (repo.description) {
      const desc = document.createElement('p');
      desc.textContent = repo.description;
      card.appendChild(desc);
    }

    const meta = document.createElement('div');
    meta.style.display = 'flex';
    meta.style.gap = '0.6rem';
    meta.style.alignItems = 'center';
    meta.style.marginTop = '0.6rem';

    if (repo.language) {
      const lang = document.createElement('span');
      lang.textContent = repo.language;
      lang.style.background = '#eef6ff';
      lang.style.color = '#024';
      lang.style.padding = '0.2rem 0.5rem';
      lang.style.borderRadius = '999px';
      lang.style.fontSize = '0.85rem';
      meta.appendChild(lang);
    }

    const stats = document.createElement('div');
    stats.style.marginLeft = 'auto';
    stats.style.display = 'flex';
    stats.style.gap = '0.6rem';

    const star = document.createElement('span');
    star.textContent = `★ ${repo.stargazers_count || 0}`;
    star.style.color = '#f5b301';
    star.style.fontWeight = '600';
    stats.appendChild(star);

    const fork = document.createElement('span');
    fork.textContent = `⑂ ${repo.forks_count || 0}`;
    fork.style.color = '#666';
    fork.style.fontWeight = '600';
    stats.appendChild(fork);

    meta.appendChild(stats);
    card.appendChild(meta);

    return card;
  }

  async function fetchRepos(username, perPage = FETCH_PAGE) {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=${perPage}`;
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (!res.ok) {
      const err = new Error(`GitHub API responded ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  function filterAndPick(repos, take = DEFAULT_PER_PAGE) {
    if (!Array.isArray(repos)) return [];
    const filtered = repos.filter(r => !EXCLUDED_REPOS.includes(r.name));
    return filtered.slice(0, take);
  }

  function readCache(username) {
    try {
      const key = `projects_cache_${username}`;
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.timestamp || !obj.repos) return null;
      if (Date.now() - obj.timestamp > CACHE_TTL) return null;
      return obj.repos;
    } catch (e) {
      return null;
    }
  }

  function writeCache(username, repos) {
    try {
      const key = `projects_cache_${username}`;
      const obj = { timestamp: Date.now(), repos };
      sessionStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {
      /* ignore */
    }
  }

  async function init() {
    const grid = document.getElementById(GRID_ID);
    if (!grid) return;

    const username = getUsername();
    if (!username || username === 'yourusername') {
      showManualFallback(grid, 'Update the GitHub username in the sidebar or set window.GITHUB_USERNAME to enable auto-fetching of repos.');
      return;
    }

    grid.innerHTML = '';
    const loading = document.createElement('div');
    loading.className = 'project-card';
    loading.textContent = 'Loading recent projects...';
    grid.appendChild(loading);

    try {
      // check cache first
      let repos = readCache(username);
      if (!repos) {
        const fetched = await fetchRepos(username, FETCH_PAGE);
        repos = filterAndPick(fetched, DEFAULT_PER_PAGE);
        if (repos.length > 0) writeCache(username, repos);
      }

      // if cache/fetch produced no repos, try a direct fetch (maybe user has few repos)
      if (!Array.isArray(repos) || repos.length === 0) {
        const fetched = await fetchRepos(username, FETCH_PAGE);
        repos = filterAndPick(fetched, DEFAULT_PER_PAGE);
      }

      if (!Array.isArray(repos) || repos.length === 0) {
        showManualFallback(grid, 'No public repositories found for ' + username + '.');
        return;
      }

      grid.innerHTML = '';
      repos.forEach(r => grid.appendChild(createRepoCard(r)));

      // background refresh: re-fetch every CACHE_TTL to keep the list up-to-date
      setInterval(async function () {
        try {
          const fetched = await fetchRepos(username, FETCH_PAGE);
          const fresh = filterAndPick(fetched, DEFAULT_PER_PAGE);
          // if different, update cache and DOM
          const cached = readCache(username) || [];
          const cachedNames = cached.map(x => x.full_name || x.name || '');
          const freshNames = fresh.map(x => x.full_name || x.name || '');
          if (JSON.stringify(cachedNames) !== JSON.stringify(freshNames)) {
            writeCache(username, fresh);
            const gridEl = document.getElementById(GRID_ID);
            if (gridEl) {
              gridEl.innerHTML = '';
              fresh.forEach(r => gridEl.appendChild(createRepoCard(r)));
            }
          }
        } catch (e) {
          // silently ignore background refresh errors
        }
      }, CACHE_TTL);
    } catch (err) {
      console.error('projects.js: failed to fetch repos', err);
      if (err && err.status === 403) {
        showManualFallback(grid, 'GitHub rate limit reached. Showing manual projects instead.');
      } else {
        showManualFallback(grid, 'Unable to load projects from GitHub. Showing manual list.');
      }
    }
  }

  // run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// carousel removed — rendering projects as grid cards
