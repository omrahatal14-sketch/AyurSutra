import re

def add_razorpay_patient():
    with open('patient.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Add Razorpay SDK to head
    if '<script src="https://checkout.razorpay.com/v1/checkout.js"></script>' not in html:
        html = html.replace('</head>', '  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>\n</head>')

    # Update loadSessions function to show payment buttons
    old_list_item = '''html += `
        <div class="list-item">
          <strong>${therapy}</strong><br>
          ${formatDisplayDate(data.date)} | ${data.time}<br>
          Doctor: ${doctorName}<br>
          Status: <span class="pending">${statusLabel}</span>
        </div>
      `;'''
    new_list_item = '''let paymentHtml = "";
      if (status === "scheduled") {
        if (!data.advancePaid && !data.advance_paid) paymentHtml = `<button class="btn small" onclick="payAdvance('${docSnap.id}')">Pay Advance (40%)</button>`;
        else paymentHtml = `<span class="badge active">Advance Paid</span>`;
      } else if (status === "completed") {
        if (!data.remainingPaid && !data.remaining_paid && !data.offline_remaining_paid) paymentHtml = `<button class="btn small" onclick="payRemaining('${docSnap.id}')">Pay Remaining</button>`;
        else paymentHtml = `<span class="badge active">Fully Paid</span>`;
      }

      html += `
        <div class="list-item" style="flex-direction:column; align-items:flex-start; gap:8px;">
          <div style="width:100%; display:flex; justify-content:space-between;">
            <div>
              <strong>${therapy}</strong><br>
              ${formatDisplayDate(data.date)} | ${data.time}<br>
              Doctor: ${doctorName}<br>
              Status: <span class="pending">${statusLabel}</span>
            </div>
            <div>${paymentHtml}</div>
          </div>
        </div>
      `;'''
    if 'let paymentHtml = "";' not in html:
        html = html.replace(old_list_item, new_list_item)

    # Add payment functions
    if 'window.payAdvance' not in html:
        payment_funcs = '''
window.payAdvance = async function(sessionId) {
  try {
    const res = await fetch(`/api/payments/session/${sessionId}/advance-order`, { method: 'POST' });
    const data = await res.json();
    if (data.error) return alert(data.error);

    const options = {
      key: data.keyId,
      amount: data.amount * 100,
      currency: data.currency,
      name: "AyurSutra",
      description: "Advance Session Fee",
      order_id: data.orderId,
      handler: async function(response) {
        const verifyRes = await fetch(`/api/payments/session/${sessionId}/advance-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        });
        const vData = await verifyRes.json();
        if (vData.error) alert(vData.error);
        else { alert("Advance Paid!"); loadSessions(); }
      }
    };
    new window.Razorpay(options).open();
  } catch (err) { alert("Error initiating payment"); }
};

window.payRemaining = async function(sessionId) {
  try {
    const res = await fetch(`/api/payments/session/${sessionId}/remaining-order`, { method: 'POST' });
    const data = await res.json();
    if (data.error) return alert(data.error);

    const options = {
      key: data.keyId,
      amount: data.amount * 100,
      currency: data.currency,
      name: "AyurSutra",
      description: "Remaining Session Fee",
      order_id: data.orderId,
      handler: async function(response) {
        const verifyRes = await fetch(`/api/payments/session/${sessionId}/remaining-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        });
        const vData = await verifyRes.json();
        if (vData.error) alert(vData.error);
        else { alert("Remaining Paid!"); loadSessions(); }
      }
    };
    new window.Razorpay(options).open();
  } catch (err) { alert("Error initiating payment"); }
};
'''
        html = html.replace('</script>\n</body>', payment_funcs + '\n</script>\n</body>')

    with open('patient.html', 'w', encoding='utf-8') as f:
        f.write(html)

def update_doctor():
    with open('doctor.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # For doctor.html, we also need to allow doctor to see completed sessions waiting for payment, or at least the option to mark offline paid
    # Let's modify loadTodaySessions to include completed sessions where remaining is not paid
    old_if = '''!(d.status || "").toLowerCase().includes("complete")'''
    new_if = '''(!(d.status || "").toLowerCase().includes("complete") || (d.status.toLowerCase() === "completed" && !d.remainingPaid && !d.remaining_paid && !d.offline_remaining_paid))'''
    
    html = html.replace(old_if, new_if)

    old_btns = '''<button class="small" onclick="startSession('${docSnap.id}')">Start</button>
          <button class="small" onclick="completeSession('${docSnap.id}')">Complete</button>'''
    
    new_btns = '''${d.status === 'completed' ? `<button class="small" onclick="markPaidOffline('${docSnap.id}')">Mark Paid Offline</button>` : `<button class="small" onclick="startSession('${docSnap.id}')">Start</button> <button class="small" onclick="completeSession('${docSnap.id}')">Complete</button>`}'''

    if "markPaidOffline" not in html:
        html = html.replace(old_btns, new_btns)

    if 'window.markPaidOffline' not in html:
        offline_func = '''
window.markPaidOffline = async function(id) {
  try {
    const res = await fetch(`/api/payments/session/${id}/offline-paid`, { method: 'POST' });
    const data = await res.json();
    if (data.error) return alert(data.error);
    alert("Marked as paid offline");
    loadTodaySessions();
  } catch (err) { alert("Error marking paid"); }
};
'''
        html = html.replace('</script>\n</body>', offline_func + '\n</script>\n</body>')

    with open('doctor.html', 'w', encoding='utf-8') as f:
        f.write(html)

add_razorpay_patient()
update_doctor()
