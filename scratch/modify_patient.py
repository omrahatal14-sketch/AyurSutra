import re

with open('patient.html', 'r', encoding='utf-8') as f:
    html = f.read()

sidebar_pattern = r'<!-- SIDEBAR -->\s*<aside class="sidebar" id="sidebar">[\s\S]*?</aside>\s*<!-- MAIN CONTENT -->\s*<div class="main-content">\s*<!-- TOPBAR -->\s*<header class="topbar">\s*<div class="topbar-left">\s*<button class="menu-toggle" id="menuToggle">Menu</button>\s*</div>\s*<div class="topbar-right">'

replacement = '''<!-- MAIN CONTENT -->
  <div class="main-content" style="padding-top:0;">
    <!-- TOPBAR -->
    <header class="topbar" style="padding-left: 24px; gap: 20px;">
      <div class="topbar-left" style="flex: 1; display: flex; align-items: center; gap: 24px; overflow: hidden;">
        <div class="brand" style="display: flex; align-items: center; gap: 12px; min-width: max-content;">
          <img src="Image/Logo.png" class="logo-img" style="width: 40px; height: 40px; border-radius: 8px;">
          <div class="brand-text">
            <h2 style="font-size: 20px; font-weight: 700; margin: 0; color: var(--text-main);">AyurSutra</h2>
            <span style="font-size: 12px; color: var(--text-muted);">Patient Dashboard</span>
          </div>
        </div>
        <button class="menu-toggle" id="menuToggle">Menu</button>
        <nav class="nav-menu" style="display: flex; gap: 8px; flex: 1; overflow-x: auto; padding-bottom: 0;">
          <button class="tab active" onclick="showTab('dashboard',this)"><span class="label">Dashboard</span></button>
          <button class="tab" onclick="showTab('sessions',this)"><span class="label">Sessions</span></button>
          <button class="tab" onclick="showTab('request',this)"><span class="label">Request</span></button>
          <button class="tab" onclick="showTab('consult',this)"><span class="label">Consult AI</span></button>
          <button class="tab" onclick="showTab('feedback',this)"><span class="label">Feedback</span></button>
        </nav>
      </div>
      <div class="topbar-right">'''

html = re.sub(sidebar_pattern, replacement, html)

with open('patient.html', 'w', encoding='utf-8') as f:
    f.write(html)
