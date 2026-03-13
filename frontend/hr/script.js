// ===== CONFIGURATION =====
const API_BASE_URL = "http://localhost:5000/api";
const FORM_URL = "http://localhost:5678/form/ea6c0b26-19a6-4ba5-a687-8b78ea1c1590";

// ===== GLOBAL STATE =====
let candidates = [];
let filteredCandidates = [];
let currentView = "grid";
let currentCandidateId = null;
let currentTab = "dashboard";
let jobTemplates = [];
let selectedTemplate = null;

// ===== LOGIN LOGIC =====
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const u = document.getElementById("loginUser").value;
    const p = document.getElementById("loginPass").value;
    if (u === "Admin" && p === "Admin") {
      document.getElementById("loginError").style.display = "none";
      document.getElementById("loginPage").style.display = "none";
      document.getElementById("portalPage").classList.remove("hidden");
      loadCandidates();
      loadJobTemplates();
      initFormIframe();
    } else {
      document.getElementById("loginError").style.display = "block";
    }
  });
});

function logout() {
  location.reload();
}

// ===== TAB NAVIGATION =====
async function switchTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.getElementById(tabName + "Tab").classList.add("active");
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
  if (activeBtn) activeBtn.classList.add("active");
  
  if (tabName === "create") {
    initFormIframe(true);
    loadJobTemplates();
  } else if (tabName === "templates") {
    await loadJobTemplates();
    renderTemplatesTab();
  }
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById("portalSidebar");
  sidebar.classList.toggle("mobile-open");
}

// ===== JOB TEMPLATES API =====
async function loadJobTemplates() {
  try {
    const response = await fetch(`${API_BASE_URL}/job-templates`);
    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }
    const result = await response.json();
    jobTemplates = result.data || [];
    renderTemplateSelector();
    console.log('Job templates loaded:', jobTemplates.length);
  } catch (error) {
    console.error('Error loading job templates:', error);
    showNotification('Failed to load job templates', 'error');
  }
}

function renderTemplateSelector() {
  const selector = document.getElementById('templateSelector');
  if (!selector) return;
  
  selector.innerHTML = '<option value="">-- Select a Template --</option>';
  
  jobTemplates.forEach(template => {
    const option = document.createElement('option');
    option.value = template.template_key;
    option.textContent = `${template.template_key} - ${template.job_title}`;
    selector.appendChild(option);
  });
}

function onTemplateSelect() {
  const selector = document.getElementById('templateSelector');
  const templateKey = selector.value;
  
  if (!templateKey) {
    selectedTemplate = null;
    hideSelectedTemplateInfo();
    return;
  }
  
  selectedTemplate = jobTemplates.find(t => t.template_key === templateKey);
  
  if (selectedTemplate) {
    showSelectedTemplateInfo(selectedTemplate);
    showNotification(`Template "${selectedTemplate.job_title}" selected!`, 'success');
  }
}

function autoFillFormFromTemplate() {
  if (!selectedTemplate) {
    showNotification('Please select a template first', 'error');
    return;
  }
  displayTemplateData(selectedTemplate);
  showNotification('Template data loaded!', 'success');
}

function displayTemplateData(template) {
  const dataDisplay = document.getElementById('templateDataDisplay');
  if (!dataDisplay) return;
  
  dataDisplay.innerHTML = `
    <div style="background: white; padding: 16px; border-radius: 10px; margin-top: 12px; border: 2px solid #3b82f6;">
      <h4 style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 10px;">📋 Template Data (Copy to Form Above)</h4>
      <div style="display: grid; gap: 10px; font-size: 13px;">
        <div>
          <strong style="color: #374151;">Job Title:</strong>
          <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; margin-top: 4px; font-family: monospace;">${template.job_title}</div>
        </div>
        <div>
          <strong style="color: #374151;">Job Description:</strong>
          <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; margin-top: 4px; font-family: monospace; white-space: pre-wrap;">${template.job_description || 'N/A'}</div>
        </div>
        <div>
          <strong style="color: #374151;">Required Skills:</strong>
          <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; margin-top: 4px; font-family: monospace;">${template.required_skills || 'N/A'}</div>
        </div>
        <div>
          <strong style="color: #374151;">Number of Candidates:</strong>
          <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; margin-top: 4px; font-family: monospace;">${template.number_of_candidates || 'N/A'}</div>
        </div>
        ${template.survey_question_1 ? `
        <div>
          <strong style="color: #374151;">Survey Question 1:</strong>
          <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; margin-top: 4px; font-family: monospace;">${template.survey_question_1}</div>
        </div>
        ` : ''}
        ${template.survey_q1_expected_answer ? `
        <div>
          <strong style="color: #374151;">Expected Answer:</strong>
          <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; margin-top: 4px; font-family: monospace;">${template.survey_q1_expected_answer}</div>
        </div>
        ` : ''}
      </div>
    </div>
  `;
  dataDisplay.style.display = 'block';
}

function showSelectedTemplateInfo(template) {
  const infoDiv = document.getElementById('selectedTemplateInfo');
  if (!infoDiv) return;
  
  infoDiv.innerHTML = `
    <strong>📋 Selected Template:</strong> ${template.template_key} - ${template.job_title}
    <br><small>Click "Show Template Data" button to view all fields below.</small>
  `;
  infoDiv.style.display = 'block';
}

function hideSelectedTemplateInfo() {
  const infoDiv = document.getElementById('selectedTemplateInfo');
  if (infoDiv) infoDiv.style.display = 'none';
  
  const dataDisplay = document.getElementById('templateDataDisplay');
  if (dataDisplay) dataDisplay.style.display = 'none';
}

// ===== TEMPLATES TAB =====
function renderTemplatesTab() {
  const container = document.getElementById('templatesGrid');
  if (!container) return;
  
  if (!jobTemplates || jobTemplates.length === 0) {
    container.innerHTML = '<p class="subtext">No templates found. Click "Add Template" to create one.</p>';
    return;
  }
  
  container.innerHTML = jobTemplates.map(template => `
    <div class="template-card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <h4 style="font-size: 15px; font-weight: 700; color: #111827; margin: 0;">${template.job_title}</h4>
        <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 10px; border-radius: 14px; font-size: 11px; font-weight: 600;">${template.template_key}</span>
      </div>
      <p style="font-size: 13px; color: #6b7280; margin: 8px 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${template.job_description || 'No description'}</p>
      <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
        <div style="font-size: 12px; color: #9ca3af; margin-bottom: 6px;">
          <strong style="color: #374151;">Skills:</strong> ${template.required_skills || 'N/A'}
        </div>
        <div style="font-size: 12px; color: #9ca3af;">
          <strong style="color: #374151;">Candidates:</strong> ${template.number_of_candidates || 'N/A'}
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
        <button onclick="editTemplate('${template.template_key}')" class="template-action-btn edit-btn">✏️ Edit</button>
        <button onclick="deleteTemplate('${template.template_key}')" class="template-action-btn delete-btn">🗑️ Delete</button>
        <button onclick="viewTemplateDetail('${template.template_key}')" class="template-action-btn view-btn">👁️ View</button>
      </div>
    </div>
  `).join('');
}

function viewTemplateDetail(templateKey) {
  const template = jobTemplates.find(t => t.template_key === templateKey);
  if (!template) return;
  
  const modal = document.getElementById('templateDetailModal');
  if (!modal) return;
  
  document.getElementById('modalTemplateKey').textContent = template.template_key;
  document.getElementById('modalTemplateTitle').textContent = template.job_title;
  document.getElementById('modalTemplateDescription').textContent = template.job_description || 'N/A';
  document.getElementById('modalTemplateSkills').textContent = template.required_skills || 'N/A';
  document.getElementById('modalTemplateCandidates').textContent = template.number_of_candidates || 'N/A';
  document.getElementById('modalTemplateQ1').textContent = template.survey_question_1 || 'N/A';
  document.getElementById('modalTemplateA1').textContent = template.survey_q1_expected_answer || 'N/A';
  
  modal.style.display = 'flex';
}

function closeTemplateDetailModal() {
  const modal = document.getElementById('templateDetailModal');
  if (modal) modal.style.display = 'none';
}

// ===== TEMPLATE CRUD OPERATIONS =====
function openAddTemplateModal() {
  const modal = document.getElementById('templateEditModal');
  if (!modal) return;
  
  document.getElementById('modalEditMode').value = 'add';
  document.getElementById('modalEditTemplateKey').value = '';
  document.getElementById('editTemplateKey').value = '';
  document.getElementById('editTemplateKey').disabled = false;
  document.getElementById('editJobTitle').value = '';
  document.getElementById('editJobDescription').value = '';
  document.getElementById('editRequiredSkills').value = '';
  document.getElementById('editNumberOfCandidates').value = '';
  document.getElementById('editSurveyQ1').value = '';
  document.getElementById('editSurveyA1').value = '';
  
  document.getElementById('templateEditModalTitle').textContent = '➕ Add New Template';
  modal.style.display = 'flex';
}

function editTemplate(templateKey) {
  const template = jobTemplates.find(t => t.template_key === templateKey);
  if (!template) return;
  
  const modal = document.getElementById('templateEditModal');
  if (!modal) return;
  
  document.getElementById('modalEditMode').value = 'edit';
  document.getElementById('modalEditTemplateKey').value = templateKey;
  document.getElementById('editTemplateKey').value = template.template_key;
  document.getElementById('editTemplateKey').disabled = true;
  document.getElementById('editJobTitle').value = template.job_title || '';
  document.getElementById('editJobDescription').value = template.job_description || '';
  document.getElementById('editRequiredSkills').value = template.required_skills || '';
  document.getElementById('editNumberOfCandidates').value = template.number_of_candidates || '';
  document.getElementById('editSurveyQ1').value = template.survey_question_1 || '';
  document.getElementById('editSurveyA1').value = template.survey_q1_expected_answer || '';
  
  document.getElementById('templateEditModalTitle').textContent = '✏️ Edit Template';
  modal.style.display = 'flex';
}

async function saveTemplate() {
  const mode = document.getElementById('modalEditMode').value;
  const originalKey = document.getElementById('modalEditTemplateKey').value;
  
  const templateData = {
    template_key: document.getElementById('editTemplateKey').value.trim(),
    job_title: document.getElementById('editJobTitle').value.trim(),
    job_description: document.getElementById('editJobDescription').value.trim(),
    required_skills: document.getElementById('editRequiredSkills').value.trim(),
    number_of_candidates: document.getElementById('editNumberOfCandidates').value.trim(),
    survey_question_1: document.getElementById('editSurveyQ1').value.trim(),
    survey_q1_expected_answer: document.getElementById('editSurveyA1').value.trim()
  };
  
  if (!templateData.template_key || !templateData.job_title) {
    showNotification('Template Key and Job Title are required!', 'error');
    return;
  }
  
  try {
    let response;
    if (mode === 'add') {
      response = await fetch(`${API_BASE_URL}/job-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });
    } else {
      response = await fetch(`${API_BASE_URL}/job-templates/${originalKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });
    }
    
    const result = await response.json();
    
    if (result.success || response.ok) {
      showNotification(mode === 'add' ? 'Template created successfully!' : 'Template updated successfully!', 'success');
      closeTemplateEditModal();
      await loadJobTemplates();
      renderTemplatesTab();
    } else {
      showNotification(result.message || 'Failed to save template', 'error');
    }
  } catch (error) {
    console.error('Error saving template:', error);
    showNotification('Error saving template. Check console for details.', 'error');
  }
}

async function deleteTemplate(templateKey) {
  if (!confirm(`Are you sure you want to delete template "${templateKey}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/job-templates/${templateKey}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (result.success || response.ok) {
      showNotification('Template deleted successfully!', 'success');
      await loadJobTemplates();
      renderTemplatesTab();
    } else {
      showNotification(result.message || 'Failed to delete template', 'error');
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    showNotification('Error deleting template. Check console for details.', 'error');
  }
}

function closeTemplateEditModal() {
  const modal = document.getElementById('templateEditModal');
  if (modal) modal.style.display = 'none';
}

// ===== CANDIDATES API =====
async function fetchCandidates() {
  try {
    const response = await fetch(`${API_BASE_URL}/hr/candidates`);
    const result = await response.json();
    if (result.success) {
      candidates = result.data || [];
      filteredCandidates = [...candidates];
      sortCandidates();
      updateQuickStats();
    } else {
      showError("Failed to load candidates");
    }
  } catch (error) {
    console.error(error);
    showError("Network error. Check if the server is running.");
  }
}

async function fetchCandidateDetail(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/candidates/${id}`);
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function updateCandidateComment(id, comment) {
  try {
    const response = await fetch(`${API_BASE_URL}/candidates/${id}/comment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision_comment: comment }),
    });
    const result = await response.json();
    if (result.success) {
      const idx = candidates.findIndex((c) => c.id === id);
      if (idx !== -1) {
        candidates[idx].decision_comment = comment;
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// ===== SEARCH / FILTER / SORT =====
function filterCandidates() {
  const input = document.getElementById("searchInput");
  const term = input ? input.value.toLowerCase() : "";
  filteredCandidates = candidates.filter((c) => {
    const name = (c.name || "").toLowerCase();
    const email = (c.email || "").toLowerCase();
    const phone = c.phone || "";
    return name.includes(term) || email.includes(term) || phone.includes(term);
  });
  sortCandidates(false);
}

function sortCandidates(reload = true) {
  const select = document.getElementById("sortSelect");
  const sortValue = select ? select.value : "score-desc";
  switch (sortValue) {
    case "score-asc":
      filteredCandidates.sort((a, b) => (a.score || 0) - (b.score || 0));
      break;
    case "score-desc":
      filteredCandidates.sort((a, b) => (b.score || 0) - (a.score || 0));
      break;
    case "name-asc":
      filteredCandidates.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      break;
    case "name-desc":
      filteredCandidates.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      break;
    case "date-asc":
      filteredCandidates.sort((a, b) => new Date(a.created_at || a.date || 0) - new Date(b.created_at || b.date || 0));
      break;
    case "date-desc":
      filteredCandidates.sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
      break;
  }
  if (reload) {
    renderCandidates();
  }
}

function toggleView(view) {
  currentView = view;
  const gridViewBtn = document.getElementById("gridViewBtn");
  const listViewBtn = document.getElementById("listViewBtn");
  const gridContainer = document.getElementById("candidatesContainer");
  const listContainer = document.getElementById("candidatesListContainer");
  if (view === "grid") {
    gridViewBtn && gridViewBtn.classList.add("active");
    listViewBtn && listViewBtn.classList.remove("active");
    gridContainer && gridContainer.classList.remove("hidden");
    listContainer && listContainer.classList.add("hidden");
  } else {
    listViewBtn && listViewBtn.classList.add("active");
    gridViewBtn && gridViewBtn.classList.remove("active");
    listContainer && listContainer.classList.remove("hidden");
    gridContainer && gridContainer.classList.add("hidden");
  }
  renderCandidates();
}

// ===== DASHBOARD RENDER =====
function formatDate(dateString) {
  if (!dateString) return "-";
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

async function loadCandidates() {
  if (!candidates.length) {
    await fetchCandidates();
  }
  renderCandidates();
}

function getScoreBadgeColor(score) {
  const s = Number(score || 0);
  if (s >= 80) return "background: linear-gradient(135deg, #10b981 0%, #059669 100%);";
  if (s >= 60) return "background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);";
  return "background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);";
}

function updateQuickStats() {
  const total = candidates.length;
  const avg = total === 0 ? 0 : Math.round(candidates.reduce((sum, c) => sum + Number(c.score || 0), 0) / total);
  const shortlisted = candidates.filter((c) => c.status === "shortlisted").length;
  const rejected = candidates.filter((c) => c.status === "rejected").length;
  const tEl = document.getElementById("statTotal");
  const aEl = document.getElementById("statAverage");
  const sEl = document.getElementById("statShortlisted");
  const rEl = document.getElementById("statRejected");
  if (tEl) tEl.textContent = total;
  if (aEl) aEl.textContent = avg;
  if (sEl) sEl.textContent = shortlisted;
  if (rEl) rEl.textContent = rejected;
}

function renderCandidates() {
  if (currentView === "grid") {
    renderGridView();
  } else {
    renderListView();
  }
  const grid2 = document.getElementById("candidatesContainer2");
  if (grid2) {
    if (!filteredCandidates.length) {
      grid2.innerHTML = '<p class="subtext">No candidates found</p>';
    } else {
      grid2.innerHTML = filteredCandidates.map((c) => {
        const score = c.score || 0;
        return `
          <div class="candidate-card" onclick="openCandidateModal(${c.id})">
            <div class="candidate-header">
              <div class="candidate-name">${c.name || "Unnamed"}</div>
              <div class="score-badge" style="${getScoreBadgeColor(score)}">${score}</div>
            </div>
            <div class="candidate-info">
              <p>📧 ${c.email || "-"}</p>
              <p>📱 ${c.phone || "N/A"}</p>
            </div>
            <div class="candidate-date">Submitted: ${formatDate(c.date || c.created_at)}</div>
          </div>`;
      }).join("");
    }
  }
}

function renderGridView() {
  const container = document.getElementById("candidatesContainer");
  if (!container) return;
  if (!filteredCandidates.length) {
    container.innerHTML = '<p class="subtext">No candidates found</p>';
    return;
  }
  container.innerHTML = filteredCandidates.map((c) => {
    const score = c.score || 0;
    return `
      <div class="candidate-card" onclick="openCandidateModal(${c.id})">
        <div class="candidate-header">
          <div class="candidate-name">${c.name || "Unnamed"}</div>
          <div class="score-badge" style="${getScoreBadgeColor(score)}">${score}</div>
        </div>
        <div class="candidate-info">
          <p>📧 ${c.email || "-"}</p>
          <p>📱 ${c.phone || "N/A"}</p>
        </div>
        <div class="candidate-date">Submitted: ${formatDate(c.date || c.created_at)}</div>
      </div>`;
  }).join("");
}

function renderListView() {
  const container = document.getElementById("candidatesListContainer");
  if (!container) return;
  if (!filteredCandidates.length) {
    container.innerHTML = '<p class="subtext">No candidates found</p>';
    return;
  }
  container.innerHTML = filteredCandidates.map((c) => {
    const score = c.score || 0;
    return `
      <div class="list-item" onclick="openCandidateModal(${c.id})">
        <div class="list-name">${c.name || "Unnamed"}</div>
        <div class="list-contact">
          <p>${c.email || "-"}</p>
          <p>${c.phone || "N/A"}</p>
        </div>
        <div class="list-date">${formatDate(c.date || c.created_at)}</div>
        <div class="list-score" style="${getScoreBadgeColor(score)}">${score}</div>
        <div class="list-action">
          <button class="list-action-btn" onclick="event.stopPropagation(); openCandidateModal(${c.id})">View</button>
        </div>
      </div>`;
  }).join("");
}

// ===== CANDIDATE MODAL =====
async function openCandidateModal(id) {
  currentCandidateId = id;
  const modal = document.getElementById("candidateModal");
  modal.style.display = "flex";
  const detail = await fetchCandidateDetail(id);
  if (!detail) {
    showNotification("Failed to load candidate details", "error");
    return;
  }
  renderCandidateDetail(detail);
}

function closeCandidateModal() {
  const modal = document.getElementById("candidateModal");
  modal.style.display = "none";
  currentCandidateId = null;
}

function renderCandidateDetail(c) {
  document.getElementById("modalCandidateName").textContent = c.name || "Unknown";
  document.getElementById("modalCandidateEmail").textContent = c.email || "-";
  document.getElementById("modalCandidatePhone").textContent = c.phone || "N/A";
  document.getElementById("modalCandidateScore").textContent = c.final_score || c.score || 0;
  document.getElementById("modalInterviewScore").textContent = c.interview_score || 0;
  document.getElementById("modalSecurityScore").textContent = c.security_score || 0;
  document.getElementById("modalRecommendation").textContent = c.recommendation || "N/A";
  const secDetails = c.security_details || {};
  document.getElementById("modalViolationsCount").textContent = secDetails.total_violations || 0;
  document.getElementById("modalSeverity").textContent = secDetails.severity_level || "low";
  const violations = secDetails.violations || [];
  const violationsList = document.getElementById("violationsList");
  if (!violations.length) {
    violationsList.innerHTML = '<p style="font-size:13px;color:#6b7280;">No violations recorded.</p>';
  } else {
    violationsList.innerHTML = violations.map((v) => `
      <div class="violation-item">
        <div>
          <span class="violation-type">${v.type || "Unknown"}</span>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">${v.description || ""}</div>
        </div>
        <div class="violation-time">${v.timestamp || ""}</div>
      </div>`
    ).join("");
  }
  const events = secDetails.timeline || [];
  const timelineList = document.getElementById("timelineList");
  if (!events.length) {
    timelineList.innerHTML = '<p style="font-size:13px;color:#6b7280;">No timeline events.</p>';
  } else {
    timelineList.innerHTML = events.map((e, i) => `
      <div class="timeline-item">
        <span style="font-weight:600;color:#3b82f6;">${i + 1}.</span>
        <span style="font-size:12px;">${e.event || ""} (${e.time || ""})</span>
      </div>`
    ).join("");
  }
  renderCommentSection(c.decision_comment);
}

function renderCommentSection(comment) {
  const container = document.getElementById("commentContainer");
  if (comment) {
    container.innerHTML = `
      <div class="comment-display" id="commentDisplay">
        <p>${comment}</p>
      </div>
      <div class="comment-actions">
        <button class="comment-btn comment-btn-secondary" onclick="enableCommentEdit()">✏️ Edit</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <p style="font-size:13px;color:#6b7280;margin-bottom:8px;">No comments yet. Click "Add/Edit Comment" to add one.</p>
      <div class="comment-actions">
        <button class="comment-btn comment-btn-primary" onclick="enableCommentEdit()">➕ Add Comment</button>
      </div>
    `;
  }
}

function enableCommentEdit() {
  const candidate = candidates.find((c) => c.id === currentCandidateId);
  const currentComment = candidate ? candidate.decision_comment || "" : "";
  const container = document.getElementById("commentContainer");
  container.innerHTML = `
    <div class="comment-edit">
      <textarea id="commentTextarea" class="comment-textarea" placeholder="Enter your decision comment here...">${currentComment}</textarea>
    </div>
    <div class="comment-actions">
      <button class="comment-btn comment-btn-primary" onclick="saveComment()">💾 Save</button>
      <button class="comment-btn comment-btn-secondary" onclick="cancelCommentEdit()">❌ Cancel</button>
    </div>
  `;
  document.getElementById("commentTextarea").focus();
}

async function saveComment() {
  const textarea = document.getElementById("commentTextarea");
  const comment = textarea.value.trim();
  const success = await updateCandidateComment(currentCandidateId, comment);
  if (success) {
    showNotification("Comment saved successfully", "success");
    renderCommentSection(comment);
  } else {
    showNotification("Failed to save comment", "error");
  }
}

function cancelCommentEdit() {
  const candidate = candidates.find((c) => c.id === currentCandidateId);
  const currentComment = candidate ? candidate.decision_comment || null : null;
  renderCommentSection(currentComment);
}

// ===== FORM IFRAME =====
function initFormIframe(reload = false) {
  const iframe = document.getElementById("formIframe");
  if (reload && iframe) {
    iframe.src = FORM_URL;
  }
}

// ===== NOTIFICATIONS & ERRORS =====
function showNotification(msg, type = "info") {
  const notif = document.createElement("div");
  notif.className = "notification";
  notif.textContent = msg;
  if (type === "error") {
    notif.style.background = "#ef4444";
  } else if (type === "success") {
    notif.style.background = "#10b981";
  }
  document.body.appendChild(notif);
  setTimeout(() => {
    notif.remove();
  }, 3000);
}

function showError(msg) {
  showNotification(msg, "error");
}