import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add Revenue Stat Card
revenue_card = '''<div class="stat-card card">
                  <div class="stat-icon"></div>
                  <div class="stat-info">
                    <h4 id="m-revenue">₹0</h4>
                    <p>Platform Revenue</p>
                  </div>
                </div>'''

if '<h4 id="m-revenue">' not in html:
    html = html.replace('<div class="stats-grid">', '<div class="stats-grid">\n                ' + revenue_card)

# Fetch revenue in JS
fetch_revenue_js = '''
window.adminLoadRevenue = async function() {
  try {
    const res = await fetch('/api/payments/admin/summary');
    const data = await res.json();
    document.getElementById('m-revenue').textContent = "₹" + (data.platformRevenue || 0).toLocaleString('en-IN');
  } catch (e) { console.error(e); }
};
window.adminLoadRevenue();
'''

if 'window.adminLoadRevenue' not in html:
    html = html.replace('window.adminLoadPatients();', 'window.adminLoadPatients();\n' + fetch_revenue_js)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
