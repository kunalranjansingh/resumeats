const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const analyzeBtn = document.getElementById('analyze-btn');
const clearBtn = document.getElementById('clear-btn');
const preview = document.getElementById('preview');
const fileNameEl = document.getElementById('file-name');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('results');
const errorMsg = document.getElementById('error-msg');
const manualText = document.getElementById('manual-text');

const scoreBar = document.getElementById('score-bar');
const scoreText = document.getElementById('score-text');
const missingKeywordsList = document.getElementById('missing-keywords');
const strengthsList = document.getElementById('strengths');
const weaknessesList = document.getElementById('weaknesses');
const suggestionsList = document.getElementById('suggestions');
const formattingIssuesList = document.getElementById('formatting-issues');

let selectedFile;

const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
const API_BASE = isLocalhost ? 'http://localhost:5000' : '';

function getAnalyzeUrl() {
  return isLocalhost ? `${API_BASE}/analyze` : '/api/analyze';
}



// Helpers
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove('hidden');
}

function clearError() {
  errorMsg.textContent = '';
  errorMsg.classList.add('hidden');
}

function toggleLoading(show) {
  loading.classList.toggle('hidden', !show);
}

function showResults(data) {
  let score = Number(data.score ?? 0);
  score = Math.max(1, Math.min(100, score));
  scoreBar.style.width = `${score}%`;
  scoreText.textContent = `${score}/100`;
  document.getElementById('score-value').textContent = score;

  function setList(listEl, items) {
    listEl.innerHTML = '';
    if (!items || items.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'None detected.';
      listEl.appendChild(li);
      return;
    }
    items.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      listEl.appendChild(li);
    });
  }

  setList(missingKeywordsList, data.missing_keywords);
  setList(strengthsList, data.strengths);
  setList(weaknessesList, data.weaknesses);
  setList(suggestionsList, data.suggestions);
  setList(formattingIssuesList, data.formatting_issues);

  resultsSection.classList.remove('hidden');
}

function reset() {
  selectedFile = null;
  fileInput.value = '';
  fileNameEl.textContent = '';
  preview.classList.add('hidden');
  resultsSection.classList.add('hidden');
  manualText.value = '';
  clearError();
  scoreBar.style.width = '0';
  scoreText.textContent = '';
  document.getElementById('score-value').textContent = '0';
  toggleLoading(false);
  missingKeywordsList.innerHTML = '';
  strengthsList.innerHTML = '';
  weaknessesList.innerHTML = '';
  suggestionsList.innerHTML = '';
  formattingIssuesList.innerHTML = '';
}

function handleFile(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf', 'docx'].includes(ext)) {
    showError('Unsupported file type. Please upload PDF or DOCX.');
    return;
  }
  selectedFile = file;
  fileNameEl.textContent = file.name;
  preview.classList.remove('hidden');
  clearError();
}

// Drag and drop events
['dragenter', 'dragover'].forEach(event => {
  dropZone.addEventListener(event, e => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragging');
  });
});

dropZone.addEventListener('dragleave', e => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('dragging');
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('dragging');

  const file = e.dataTransfer.files[0];
  handleFile(file);
});

fileInput.addEventListener('change', e => {
  handleFile(e.target.files[0]);
});

clearBtn.addEventListener('click', () => {
  reset();
});

analyzeBtn.addEventListener('click', async () => {
  clearError();
  resultsSection.classList.add('hidden');

  if (!selectedFile && !manualText.value.trim()) {
    showError('Please upload a resume file or paste resume text.');
    toggleLoading(false);
    return;
  }

  toggleLoading(true);

  const formData = new FormData();

  if (selectedFile) {
    formData.append('resume', selectedFile);
  }

  if (manualText.value.trim()) {
    formData.append('text', manualText.value.trim());
  }

  try {
    const response = await fetch(getAnalyzeUrl(), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const text = await response.text();
      let errMsg = `Server error ${response.status} ${response.statusText}`;
      try {
        const parsed = JSON.parse(text);
        errMsg = parsed.error || parsed.message || errMsg;
      } catch (_) {
        errMsg = `${errMsg}: ${text.slice(0, 400)}`;
      }
      throw new Error(errMsg);
    }

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error('Invalid JSON response from server: ' + text.slice(0, 400));
      }
    }
    showResults(data);
  } catch (err) {
    showError(err.message);
  } finally {
    toggleLoading(false);
  }
});
// allow text manual input to override file
manualText.addEventListener('input', () => {
  if (manualText.value.trim()) {
    selectedFile = null;
    fileInput.value = '';
    fileNameEl.textContent = '';
    preview.classList.add('hidden');
  }
});
