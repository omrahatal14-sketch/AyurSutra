import re

with open('doctor.html', 'r', encoding='utf-8') as f:
    html = f.read()

sidebar_pattern = r'<!-- SIDEBAR -->\s*<aside class="sidebar" id="sidebar">[\s\S]*?</aside>\s*<!-- MAIN CONTENT -->\s*<div class="main-content">\s*<div id="fraudWarningBanner"[^>]*>[\s\S]*?</div>\s*<!-- TOPBAR -->\s*<header class="topbar">\s*<div class="topbar-left">\s*<button class="menu-toggle" id="menuToggle">Menu</button>\s*<div class="search-bar">\s*<input type="text" placeholder="Search...">\s*</div>\s*</div>\s*<div class="topbar-right">'

replacement = '''<!-- MAIN CONTENT -->
  <div class="main-content" style="padding-top:0;">
    <div id="fraudWarningBanner" style="display:none; background:#fee2e2; color:#dc2626; padding:15px; text-align:center; font-weight:600; border-bottom:1px solid #fca5a5; z-index:50;">
      WARNING: Your account has been flagged for suspicious behavior. Please contact the administrator.
    </div>

    <!-- TOPBAR -->
    <header class="topbar" style="padding-left: 24px; gap: 20px;">
      <div class="topbar-left" style="flex: 1; display: flex; align-items: center; gap: 24px; overflow: hidden;">
        <div class="brand" style="display: flex; align-items: center; gap: 12px; min-width: max-content;">
          <img src="Image/Logo.png" class="logo-img" style="width: 40px; height: 40px; border-radius: 8px;">
          <div class="brand-text">
            <h2 style="font-size: 20px; font-weight: 700; margin: 0; color: var(--text-main);">AyurSutra</h2>
            <span style="font-size: 12px; color: var(--text-muted);">Doctor Dashboard</span>
          </div>
        </div>
        <button class="menu-toggle" id="menuToggle">Menu</button>
        <nav class="nav-menu" style="display: flex; gap: 8px; flex: 1; overflow-x: auto; padding-bottom: 0;">
          <button class="tab active" data-section="dashboard"><span class="label">Dashboard</span></button>
          <button class="tab" data-section="patients"><span class="label">My Patients</span></button>
          <button class="tab" data-section="requests"><span class="label">Requests</span></button>
          <button class="tab" data-section="sessions"><span class="label">Sessions</span></button>
          <button class="tab" data-section="reports"><span class="label">Reports</span></button>
          <button class="tab" data-section="feedback"><span class="label">Feedback</span></button>
        </nav>
      </div>
      <div class="topbar-right">
        <div class="search-bar" style="margin-right: 15px;">
          <input type="text" placeholder="Search...">
        </div>'''

html = re.sub(sidebar_pattern, replacement, html)

# Fix sections visibility issue
# Replace `<section class="section view" id="xxx">` with `<section class="section view" id="xxx" style="display:none">` except for dashboard
def fix_sections(match):
    tag = match.group(0)
    if 'id="dashboard"' in tag:
        return tag
    if 'style="display:none"' not in tag:
        return tag.replace('id="', 'style="display:none" id="')
    return tag

html = re.sub(r'<section class="section view" id="[^"]+">', fix_sections, html)

# Also update the JS to handle display toggle if needed, but in style.css we probably need to handle .active ?
# Wait, let's just update the JS in doctor.html to toggle display property.
js_pattern = r'sections\.forEach\(sec => sec\.classList\.remove\("active"\)\);\s*document\.getElementById\(this\.dataset\.section\)\.classList\.add\("active"\);'
js_replacement = '''sections.forEach(sec => {
            sec.classList.remove("active");
            sec.style.display = "none";
        });
        const target = document.getElementById(this.dataset.section);
        target.classList.add("active");
        target.style.display = "block";'''

html = re.sub(js_pattern, js_replacement, html)

with open('doctor.html', 'w', encoding='utf-8') as f:
    f.write(html)
