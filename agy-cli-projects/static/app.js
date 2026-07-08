document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let releaseNotes = [];
  let currentFilter = 'ALL';
  let searchQuery = '';
  let selectedUpdate = null;

  // DOM Elements
  const notesContainer = document.getElementById('notes-container');
  const searchInput = document.getElementById('search-input');
  const refreshBtn = document.getElementById('refresh-btn');
  const filterPills = document.querySelectorAll('.filter-pill');
  
  // Drawer Elements
  const tweetDrawer = document.getElementById('tweet-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const previewType = document.getElementById('preview-type');
  const previewDate = document.getElementById('preview-date');
  const previewText = document.getElementById('preview-text');
  const tweetTextarea = document.getElementById('tweet-textarea');
  const charCounter = document.getElementById('char-counter');
  const sendTweetBtn = document.getElementById('send-tweet-btn');
  const appContainer = document.getElementById('app-container');

  // Initialize
  fetchReleaseNotes();

  // Event Listeners
  refreshBtn.addEventListener('click', fetchReleaseNotes);
  
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderNotes();
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter');
      renderNotes();
    });
  });

  // Drawer event listeners
  closeDrawerBtn.addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);
  
  tweetTextarea.addEventListener('input', () => {
    updateCharCount();
  });

  sendTweetBtn.addEventListener('click', () => {
    const text = tweetTextarea.value;
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    showToast('Redirected to Twitter/X!');
    closeDrawer();
  });

  // Fetch Release Notes
  async function fetchReleaseNotes() {
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    renderSkeletons();

    try {
      const response = await fetch('/api/release-notes');
      const result = await response.json();

      if (result.success) {
        releaseNotes = result.data;
        renderNotes();
      } else {
        showError(result.error || 'Failed to fetch release notes.');
      }
    } catch (err) {
      showError('Network error connecting to Flask backend.');
    } finally {
      refreshBtn.classList.remove('loading');
      refreshBtn.disabled = false;
    }
  }

  // Render Skeleton Cards
  function renderSkeletons() {
    notesContainer.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton-card';
      notesContainer.appendChild(skeleton);
    }
  }

  // Render Notes with Filter & Search Applied
  function renderNotes() {
    notesContainer.innerHTML = '';

    const filtered = releaseNotes.filter(note => {
      // 1. Filter by category pill
      if (currentFilter !== 'ALL') {
        const typeUpper = note.type.toUpperCase();
        if (currentFilter === 'ISSUE' && typeUpper !== 'ISSUE') return false;
        if (currentFilter === 'FEATURE' && typeUpper !== 'FEATURE') return false;
        if (currentFilter === 'UPDATE' && typeUpper !== 'UPDATE') return false;
        if (currentFilter === 'ANNOUNCEMENT' && typeUpper !== 'ANNOUNCEMENT') return false;
        if (currentFilter === 'DEPRECATION' && typeUpper !== 'DEPRECATION') return false;
      }

      // 2. Filter by search input
      if (searchQuery) {
        const textMatch = note.text.toLowerCase().includes(searchQuery);
        const typeMatch = note.type.toLowerCase().includes(searchQuery);
        const dateMatch = note.date.toLowerCase().includes(searchQuery);
        return textMatch || typeMatch || dateMatch;
      }

      return true;
    });

    if (filtered.length === 0) {
      renderEmptyState();
      return;
    }

    filtered.forEach(note => {
      const card = document.createElement('div');
      card.className = `note-card ${note.type}`;
      
      // Escape HTML helper for attributes
      const escapedTextAttr = note.text.replace(/"/g, '&quot;');

      card.innerHTML = `
        <div>
          <div class="card-header">
            <span class="card-date">${note.date}</span>
            <span class="type-badge">${note.type}</span>
          </div>
          <div class="card-content">
            ${note.html}
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-tweet-select" data-id="${note.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Select & Tweet
          </button>
          <button class="btn-quick-tweet" data-id="${note.id}" title="Quick Tweet (Standard template)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
        </div>
      `;

      // Set event listeners for action buttons
      card.querySelector('.btn-tweet-select').addEventListener('click', () => openDrawer(note));
      card.querySelector('.btn-quick-tweet').addEventListener('click', () => quickTweet(note));

      notesContainer.appendChild(card);
    });
  }

  // Render Empty State
  function renderEmptyState() {
    notesContainer.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:1rem">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>No release notes match your filters</h3>
        <p>Try clearing your search query or selecting a different category pill.</p>
      </div>
    `;
  }

  // Show Error State
  function showError(msg) {
    notesContainer.innerHTML = `
      <div class="empty-state" style="color: var(--color-issue)">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:1rem">
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Failed to load release notes</h3>
        <p>${msg}</p>
      </div>
    `;
  }

  // Open Drawer and Setup Tweet
  function openDrawer(note) {
    selectedUpdate = note;
    
    // Set preview details
    previewType.innerText = note.type;
    previewDate.innerText = note.date;
    previewText.innerText = note.text;
    
    // Set preview classes
    previewType.className = `type-badge ${note.type}`;
    
    // Generate drafted tweet text
    tweetTextarea.value = generateDefaultTweet(note);
    
    // Open Drawer UI
    tweetDrawer.classList.add('open');
    drawerBackdrop.classList.add('active');
    appContainer.classList.add('drawer-open');
    
    updateCharCount();
    tweetTextarea.focus();
  }

  // Close Drawer
  function closeDrawer() {
    tweetDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('active');
    appContainer.classList.remove('drawer-open');
    selectedUpdate = null;
  }

  // Generate Default Tweet Text
  function generateDefaultTweet(note) {
    const hashtags = ' #GoogleCloud #BigQuery';
    const intro = `BigQuery [${note.date}] - ${note.type}: `;
    const link = `\n\nRead more: ${note.link}`;
    
    // Twitter counts links as 23 characters
    const linkLength = 23 + 2; // +2 for newlines
    const fixedLength = intro.length + hashtags.length + linkLength;
    const maxDescLength = 280 - fixedLength - 4; // -4 for " ..."
    
    let desc = note.text.replace(/\s+/g, ' ').trim();
    if (desc.length > maxDescLength) {
      desc = desc.substring(0, maxDescLength) + '...';
    }
    
    return `${intro}${desc}${link}${hashtags}`;
  }

  // Quick Tweet without Opening Drawer
  function quickTweet(note) {
    const text = generateDefaultTweet(note);
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    showToast('Redirected to Twitter/X!');
  }

  // Calculate real twitter characters (counting any HTTP link as 23 chars)
  function calculateTwitterCharacters(text) {
    // Regex to find URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    let length = text.length;
    let match;
    
    while ((match = urlRegex.exec(text)) !== null) {
      length = length - match[0].length + 23;
    }
    
    return length;
  }

  // Update Character Counter and Enable/Disable Button
  function updateCharCount() {
    const text = tweetTextarea.value;
    const charCount = calculateTwitterCharacters(text);
    const remaining = 280 - charCount;
    
    charCounter.innerText = `${charCount} / 280`;
    
    // Styling states based on count
    charCounter.className = 'char-counter';
    if (remaining < 0) {
      charCounter.classList.add('danger');
      sendTweetBtn.disabled = true;
    } else if (remaining <= 40) {
      charCounter.classList.add('warning');
      sendTweetBtn.disabled = false;
    } else {
      sendTweetBtn.disabled = false;
    }
  }

  // Toast System
  function showToast(message) {
    // Check if toast already exists
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-default)" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;
    
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
});
