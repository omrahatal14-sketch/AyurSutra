// Fetch doctors from MySQL instead of Firebase

window.adminLoadVerificationDoctors = async function() {
  const pendingList = document.getElementById("pendingDoctorsList");
  const allList = document.getElementById("allDoctorsList");
  if (!pendingList || !allList) return;

  try {
    const response = await fetch('/api/users');
    const users = await response.json();
    
    let pendingHtml = "";
    let activeHtml = "";

    users.forEach((data) => {
      if (data.role !== 'doctor') return;
      if (data.flagged === 1) return; // 'flagged' acts as rejected

      const uid = data.id;

      if (data.approved !== 1) {
          const docBtns = [];
          if (data.degree_url) docBtns.push(`<a href="${data.degree_url}" target="_blank" class="btn small ghost">View Degree</a>`);
          if (data.id_proof_url) docBtns.push(`<a href="${data.id_proof_url}" target="_blank" class="btn small ghost">View ID</a>`);

          pendingHtml += `
            <div class="session" style="display:flex; flex-direction:column; align-items:flex-start; gap:10px;">
              <div>
                <strong>${data.name}</strong> (${data.email})<br>
                <span class="muted" style="font-size:14px;">License No: ${data.license_number || "N/A"}</span>
                <div id="mcim-result-${uid}" style="margin-top: 5px; font-size: 13px;"></div>
              </div>
              <div style="display:flex; gap:10px;">
                ${docBtns.join('')}
              </div>
              <div style="display:flex; gap:10px; margin-top:5px; align-items: center;">
                <button class="btn small" onclick="window.approveDoctor(${uid})">Approve</button>
                <button class="btn small ghost" style="color:var(--danger); border-color:var(--danger);" onclick="window.rejectDoctor(${uid})">Reject</button>
                ${data.license_number ? `<button class="btn small ghost" style="color:var(--primary); border-color:var(--primary);" onclick="window.verifyMCIM('${uid}', '${data.license_number}', '${data.name.replace(/'/g, "\\'")}')">Verify MCIM</button>` : ''}
              </div>
            </div>`;
        } else {
          // Approved Doctor
          const statusBadge = data.blocked 
            ? `<span class="badge" style="background:#fecdd3; color:#e11d48;">Suspended</span>` 
            : `<span class="badge">Active</span>`;
            
          const actionBtn = data.blocked
            ? `<button class="btn small" onclick="window.toggleBlockDoctor(${uid}, true)">Unblock</button>`
            : `<button class="btn small ghost" style="color:var(--danger); border-color:var(--danger);" onclick="window.toggleBlockDoctor(${uid}, false)">Suspend Doctor</button>`;

          const docBtns = [];
          if (data.degree_url) docBtns.push(`<a href="${data.degree_url}" target="_blank" class="btn small ghost" style="font-size:12px; padding:4px 8px;">View Degree</a>`);
          if (data.id_proof_url) docBtns.push(`<a href="${data.id_proof_url}" target="_blank" class="btn small ghost" style="font-size:12px; padding:4px 8px;">View ID</a>`);

          activeHtml += `
            <div class="session" style="justify-content:space-between; align-items:flex-start">
              <div>
                <strong>${data.name}</strong> ${statusBadge}<br>
                <span class="muted" style="font-size:14px;">${data.email} | License: ${data.license_number || "N/A"}</span>
                <div style="margin-top:6px; display:flex; gap:6px;">
                  ${docBtns.join('')}
                </div>
              </div>
              <div>
                ${actionBtn}
              </div>
            </div>`;
        }
    });

    pendingList.innerHTML = pendingHtml || `<p class="muted">No pending approvals.</p>`;
    allList.innerHTML = activeHtml || `<p class="muted">No active doctors found.</p>`;

  } catch (err) {
    console.error("Error loading verification doctors:", err);
    pendingList.innerHTML = "<p style='color:red'>Failed to load data.</p>";
    allList.innerHTML = "<p style='color:red'>Failed to load data.</p>";
  }
}

// Global functions
window.approveDoctor = async function(uid) {
  if(!confirm("Are you sure you want to approve this doctor?")) return;
  try {
    await fetch(`/api/users/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: 1 })
    });
    window.adminLoadVerificationDoctors();
  } catch (err) { alert(err.message); }
}

window.rejectDoctor = async function(uid) {
  if(!confirm("Are you sure you want to reject this doctor's application?")) return;
  try {
    await fetch(`/api/users/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagged: 1 })
    });
    window.adminLoadVerificationDoctors();
  } catch (err) { alert(err.message); }
}

window.toggleBlockDoctor = async function(uid, isCurrentlyBlocked) {
  const msg = isCurrentlyBlocked ? "Unblock this doctor?" : "Suspend this doctor? They will not be able to log in.";
  if(!confirm(msg)) return;
  try {
    await fetch(`/api/users/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked: isCurrentlyBlocked ? 0 : 1 })
    });
    window.adminLoadVerificationDoctors();
  } catch (err) { alert(err.message); }
}

window.verifyMCIM = async function(uid, licenseNumber, doctorName) {
  const resultDiv = document.getElementById(`mcim-result-${uid}`);
  if (!resultDiv) return;

  resultDiv.innerHTML = `<span style="color: var(--text-muted);"><i class="fa fa-spinner fa-spin"></i> Checking MCIM Database...</span>`;
  
  try {
    const response = await fetch(`/api/verify-doctor?regNo=${encodeURIComponent(licenseNumber)}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      const mcimName = data.data.fullName.toLowerCase();
      const regName = doctorName.toLowerCase();
      
      const nameMatch = mcimName.includes(regName) || regName.includes(mcimName) || 
                        mcimName.split(' ').some(part => part.length > 3 && regName.includes(part));

      resultDiv.innerHTML = `
        <div style="background: ${nameMatch ? '#dcfce7' : '#fee2e2'}; border: 1px solid ${nameMatch ? '#22c55e' : '#ef4444'}; padding: 8px; border-radius: 4px; margin-top: 5px;">
          <strong style="color: ${nameMatch ? '#15803d' : '#b91c1c'}">
            ${nameMatch ? '✅ MCIM Record Found & Name Matches!' : '⚠️ Warning: Name Mismatch!'}
          </strong><br>
          <span style="color: var(--text-dark);">
            <b>MCIM Name:</b> ${data.data.fullName}<br>
            <b>Qualification:</b> ${data.data.qualification}<br>
            <b>Status:</b> ${data.data.status}
          </span>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `<span style="color: var(--danger);">❌ ${data.error || 'Failed to verify with MCIM'}</span>`;
    }
  } catch (error) {
    resultDiv.innerHTML = `<span style="color: var(--danger);">❌ Error connecting to server</span>`;
  }
}

// Auto-execute if user is already loaded via guard.js
document.addEventListener("DOMContentLoaded", () => {
  if (window.adminLoadVerificationDoctors) {
    window.adminLoadVerificationDoctors();
  }
});
