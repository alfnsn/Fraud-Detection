// Configuration
const API_BASE_URL = "http://localhost:5000";

// Statistics
let stats = {
  total: 0,
  fraud: 0,
  normal: 0,
};

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  checkHealth();
  getModelInfo();
  loadStats();

  // Form handlers
  document
    .getElementById("singlePredictForm")
    .addEventListener("submit", handleSinglePredict);
  document
    .getElementById("batchPredictForm")
    .addEventListener("submit", handleBatchPredict);
});

// Example text
function setExampleText(text) {
  document.getElementById("singleText").value = text;
}

// Check API health
async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();

    if (data.status === "healthy") {
      document.getElementById("apiStatus").className = "api-status online";
      document.getElementById("apiStatusText").textContent = "API Connected";
    } else {
      throw new Error("API unhealthy");
    }
  } catch (error) {
    document.getElementById("apiStatus").className = "api-status offline";
    document.getElementById("apiStatusText").textContent = "API Disconnected";
    console.error("Health check failed:", error);
  }
}

// Get model info
async function getModelInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/model/info`);
    const data = await response.json();

    document.getElementById("modelInfo").textContent =
      `${data.model_type} (${data.n_neighbors || "N/A"} neighbors)`;
  } catch (error) {
    document.getElementById("modelInfo").textContent =
      "Error loading model info";
    console.error("Model info failed:", error);
  }
}

// Handle single prediction
async function handleSinglePredict(e) {
  e.preventDefault();

  const text = document.getElementById("singleText").value.trim();
  if (!text) return;

  // Show loading
  document.getElementById("singleSpinner").classList.add("active");
  document.getElementById("singleResult").style.display = "none";

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    });

    if (!response.ok) throw new Error("Prediction failed");

    const data = await response.json();
    displaySingleResult(data);
    updateStats(data.is_fraud);
  } catch (error) {
    alert("Error: " + error.message);
    console.error("Prediction error:", error);
  } finally {
    document.getElementById("singleSpinner").classList.remove("active");
  }
}

// Display single result
function displaySingleResult(data) {
  document.getElementById("singleResult").style.display = "block";

  // Prediction badge
  const predictionBadge = document.getElementById("singlePrediction");
  if (data.is_fraud) {
    predictionBadge.className = "badge fraud-badge bg-danger";
    predictionBadge.innerHTML =
      '<i class="bi bi-exclamation-triangle"></i> FRAUD';
  } else {
    predictionBadge.className = "badge fraud-badge bg-success";
    predictionBadge.innerHTML = '<i class="bi bi-check-circle"></i> NORMAL';
  }

  // Probability
  const probability = data.fraud_probability;
  document.getElementById("singleProbabilityText").textContent =
    probability.toFixed(2) + "%";

  const progressBar = document.getElementById("singleProbabilityBar");
  progressBar.style.width = probability + "%";
  progressBar.textContent = probability.toFixed(1) + "%";

  if (probability >= 80) {
    progressBar.className = "progress-bar bg-danger";
  } else if (probability >= 60) {
    progressBar.className = "progress-bar bg-warning";
  } else if (probability >= 40) {
    progressBar.className = "progress-bar bg-info";
  } else {
    progressBar.className = "progress-bar bg-success";
  }

  // Text timestamp
  document.getElementById("singleTextResult").textContent = data.text;
  document.getElementById("singleTimestamp").textContent = new Date(
    data.timestamp,
  ).toLocaleString("id-ID");
}

// Handle batch prediction
async function handleBatchPredict(e) {
  e.preventDefault();

  const batchText = document.getElementById("batchText").value.trim();
  if (!batchText) return;

  // Split by lines
  const texts = batchText.split("\n").filter((t) => t.trim());
  if (texts.length === 0) return;

  try {
    const response = await fetch(`${API_BASE_URL}/predict/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ texts: texts }),
    });

    if (!response.ok) throw new Error("Batch prediction failed");

    const data = await response.json();
    displayBatchResults(data);

    // Update stats
    data.results.forEach((result) => updateStats(result.is_fraud));
  } catch (error) {
    alert("Error: " + error.message);
    console.error("Batch prediction error:", error);
  } finally {
    document.getElementById("batchSpinner").classList.remove("active");
  }
}

// Display batch results
function displayBatchResults(data) {
  document.getElementById("batchResults").style.display = "block";
  document.getElementById("batchCount").textContent = data.count;

  const container = document.getElementById("batchResultsContainer");
  container.innerHTML = "";

  data.results.forEach((result, index) => {
    const item = document.createElement("div");
    item.className = "batch-item";

    const badgeClass = result.is_fraud ? "bg-danger" : "bg-success";
    const badgeIcon = result.is_fraud ? "exclamation-triangle" : "check-circle";
    const badgeText = result.is_fraud ? "FRAUD" : "NORMAL";

    item.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start">
                        <div style="flex: 1;">
                            <small class="text-muted fw-bold">#${index + 1}</small>
                            <p class="mb-1">${escapeHtml(result.text)}</p>
                        </div>
                        <div class="text-end ms-3" style="min-width: 100px;">
                            <span class="badge ${badgeClass} mb-1">
                                <i class="bi bi-${badgeIcon}"></i> ${badgeText}
                            </span>
                            <br>
                            <small class="text-muted">${result.fraud_probability.toFixed(1)}%</small>
                        </div>
                    </div>
                `;

    container.appendChild(item);
  });
}

// Update statistics
function updateStats(isFraud) {
  stats.total++;
  if (isFraud) {
    stats.fraud++;
  } else {
    stats.normal++;
  }

  document.getElementById("totalPredictions").textContent = stats.total;
  document.getElementById("fraudCount").textContent = stats.fraud;
  document.getElementById("normalCount").textContent = stats.normal;

  document.getElementById("statsContainer").style.display = "block";
  saveStats();
}

// Save stats to localStorage
function saveStats() {
  localStorage.setItem("fraudDetectionStats", JSON.stringify(stats));
}

// Load stats from localStorage
function loadStats() {
  const saved = localStorage.getItem("fraudDetectionStats");
  if (saved) {
    stats = JSON.parse(saved);
    document.getElementById("totalPredictions").textContent = stats.total;
    document.getElementById("fraudCount").textContent = stats.fraud;
    document.getElementById("normalCount").textContent = stats.normal;

    if (stats.total > 0) {
      document.getElementById("statsContainer").style.display = "block";
    }
  }
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Auto health check every 30 seconds
setInterval(checkHealth, 30000);