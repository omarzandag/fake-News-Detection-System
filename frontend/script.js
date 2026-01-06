// ===== NAVIGATION =====
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    link.classList.add('active');
    const pageId = link.getAttribute('data-page');
    document.getElementById(`${pageId}-page`).classList.add('active');

    // Load history when navigating to it
    if (pageId === 'history') {
      renderHistory();
    }
    
    if (pageId === 'analysis') renderAnalysis(); // 👈 NEW
  });
});

// ===== PREDICTION (ONLY ONE HANDLER!) =====
document.getElementById('predictBtn').addEventListener('click', async () => {
  const input = document.getElementById('newsInput').value.trim();
  const resultDiv = document.getElementById('result');

  if (!input) {
    alert('Please enter some news text.');
    return;
  }

  // Prevent double-click (optional but recommended)
  const btn = document.getElementById('predictBtn');
  btn.disabled = true;
  btn.textContent = 'Analyzing...';

  resultDiv.textContent = 'Analyzing...';
  resultDiv.className = '';
  resultDiv.style.display = 'block';

  try {
    const response = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();

    // Update UI
    if (data.prediction === 'FAKE') {
      resultDiv.className = 'fake';
      resultDiv.textContent = `🚨 This news is likely FAKE. (Confidence: ${data.confidence}%)`;
    } else {
      resultDiv.className = 'real';
      resultDiv.textContent = `✅ This news is likely REAL. (Confidence: ${data.confidence}%)`;
    }
  } catch (error) {
    console.error('Prediction failed:', error);
    resultDiv.className = 'error';
    resultDiv.textContent = '⚠️ Could not analyze news. Please check your connection or try again later.';
  } finally {
    // Re-enable button
    btn.disabled = false;
    btn.textContent = 'Check News';
  }
});

// ===== HISTORY MANAGEMENT (MONGODB) =====
let allHistoryRecords = []; // Store full history for search

async function renderHistory(searchQuery = '') {
  const historyPage = document.getElementById('history-page');
  const container = historyPage.querySelector('.container');
  
  // Keep search bar, replace only history list
  const contentDiv = container.querySelector('#historyRecords') || document.createElement('div');
  if (!contentDiv.id) contentDiv.id = 'historyRecords';
  
  // Show loading
  contentDiv.innerHTML = '<p>Loading history...</p>';
  if (!container.querySelector('#historyRecords')) {
    container.appendChild(contentDiv);
  }

  try {
    const response = await fetch('http://localhost:8000/history');
    if (!response.ok) throw new Error('Failed to load history');
    
    allHistoryRecords = await response.json();

    // Filter based on search
    let filteredRecords = allHistoryRecords;
    if (searchQuery.trim()) {
      const term = searchQuery.trim().toLowerCase();
      filteredRecords = allHistoryRecords.filter(item => 
        item.news.toLowerCase().includes(term)
      );
    }

    if (filteredRecords.length === 0) {
      contentDiv.innerHTML = `
        <div class="history-empty">
          <p>No results found for "${escapeHtml(searchQuery)}"</p>
          <button id="clearSearchBtn" class="btn btn-secondary" style="margin-top: 12px; padding: 6px 16px;">
            Clear Search
          </button>
        </div>
      `;
      document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
        document.getElementById('historySearch').value = '';
        renderHistory();
      });
      return;
    }

    // Build UI
    contentDiv.innerHTML = `
      <div class="history-list" id="historyRecordsList">
        ${filteredRecords.map(item => `
          <div class="history-item" data-id="${item._id}" data-prediction="${item.prediction}">
            <div class="history-item-content">
              <div class="history-text">${escapeHtml(item.news)}</div>
              <div class="history-meta">
                <span class="badge ${item.prediction === 'FAKE' ? 'badge-fake' : 'badge-real'}">
                  ${item.prediction}
                </span>
                <span class="confidence">${item.confidence}%</span>
                <span class="timestamp">${new Date(item.timestamp).toLocaleString()}</span>
              </div>
            </div>
            <button class="btn btn-remove" data-id="${item._id}">Remove</button>
          </div>
        `).join('')}
      </div>
    `;

    // Reattach event listeners
    document.querySelectorAll('.btn-remove').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.target.dataset.id;
        removeHistoryRecord(id);
      };
    });

  } catch (error) {
    contentDiv.innerHTML = `
      <div class="history-error">
        <p>❌ Failed to load history. Make sure the backend is running.</p>
      </div>
    `;
    console.error(error);
  }
}

async function removeHistoryRecord(id) {
  if (!confirm("Are you sure you want to delete this record?")) return;

  try {
    const response = await fetch(`http://localhost:8000/history/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error();
    renderHistory();
  } catch (error) {
    alert('Failed to delete record.');
  }
}

async function clearAllHistory() {
  if (!confirm("⚠️ Delete all history? This cannot be undone.")) return;

  try {
    const response = await fetch('http://localhost:8000/history', {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error();
    renderHistory();
  } catch (error) {
    alert('Failed to clear history.');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


async function renderAnalysis() {
  const container = document.getElementById('analysis-page').querySelector('.container');
  container.innerHTML = '<p>Loading analysis...</p>';

  try {
    const response = await fetch('http://localhost:8000/analysis');
    if (!response.ok) throw new Error('Failed to load analysis');
    const data = await response.json();

    let content = `
      <div class="analysis-header">
        <h1>📊 Detection Overview</h1>
        <p>Real-time insights from your analyzed news</p>
      </div>
      <div class="analysis-stats">
        <div class="stat-card total">
          <div class="stat-number">${data.total}</div>
          <div class="stat-label">Total Analyzed</div>
        </div>
        <div class="stat-card real">
          <div class="stat-number">${data.real} <span class="stat-pct">(${data.real_percentage}%)</span></div>
          <div class="stat-label">Real News</div>
        </div>
        <div class="stat-card fake">
          <div class="stat-number">${data.fake} <span class="stat-pct">(${data.fake_percentage}%)</span></div>
          <div class="stat-label">Fake News</div>
        </div>
      </div>
    `;

    // Optional: Add chart-like visual
    if (data.total > 0) {
      const realBar = (data.real / data.total) * 100;
const fakeBar = (data.fake / data.total) * 100;
content += `
  <div class="analysis-chart">
    <div class="chart-container">
      <div class="real-bar" style="width: ${realBar}%;"></div>
      <div class="fake-bar" style="width: ${fakeBar}%;"></div>
    </div>
    <div class="chart-legend">
      <span><span class="legend-dot real"></span> Real</span>
      <span><span class="legend-dot fake"></span> Fake</span>
    </div>
  </div>
`;
    }

    container.innerHTML = content;
  } catch (error) {
    container.innerHTML = `
      <div class="analysis-error">
        <h2>❌ Analysis Unavailable</h2>
        <p>Could not load statistics. Make sure the backend is running.</p>
      </div>
    `;
    console.error("Analysis error:", error);
  }
}



// ===== Search Functionality =====
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('historySearch');
  const clearBtn = document.getElementById('clearSearch');

  if (!searchInput) return;

  // Live search as you type (debounced)
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderHistory(e.target.value);
    }, 300); // Wait 300ms after typing stops
  });

  // Clear search
  clearBtn?.addEventListener('click', () => {
    searchInput.value = '';
    renderHistory();
    searchInput.focus();
  });

  // Trigger initial load when navigating to history
  document.querySelector('[data-page="history"]')?.addEventListener('click', () => {
    renderHistory();
    setTimeout(() => searchInput?.focus(), 100);
  });
});

// Clear all history button
document.getElementById('clearHistoryBtn')?.addEventListener('click', async () => {
  if (!confirm("⚠️ Delete all history? This cannot be undone.")) return;
  try {
    const response = await fetch('http://localhost:8000/history', {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to clear history');
    renderHistory(); // Refresh the list
    document.getElementById('historySearch').value = ''; // Optional: clear search too
  } catch (error) {
    alert('Failed to clear history.');
    console.error(error);
  }
});

// ===== Theme Toggle Logic =====
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  // Check system preference and localStorage
  const userPref = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const isDarkMode = userPref === 'dark' || (userPref !== 'light' && systemPrefersDark);

  if (isDarkMode) {
    document.body.classList.add('dark-theme');
    toggleBtn.querySelector('.sun-icon').style.display = 'block';
    toggleBtn.querySelector('.theme-toggle svg:not(.sun-icon)').style.display = 'none';
  }

  toggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Toggle icons
    const moon = toggleBtn.querySelector('svg:not(.sun-icon)');
    const sun = toggleBtn.querySelector('.sun-icon');
    if (isDark) {
      sun.style.display = 'block';
      moon.style.display = 'none';
    } else {
      sun.style.display = 'none';
      moon.style.display = 'block';
    }
  });
});