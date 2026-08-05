import re

def rewrite_gemini(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    html = html.replace('OPENAI_API_KEY', 'GEMINI_API_KEY')

    # Replace sendMessage in patient.html
    if 'sendMessage' in html:
        send_msg_old = '''const url = "https://api.openai.com/v1/chat/completions";
    
    // Construct request history payload
    const messages = [];
    messages.push({ role: "system", content: "You are an Ayurvedic health assistant answering queries for a Panchakarma patient. Keep your answers concise and helpful." });
    
    if (window.chatHistory) {
      window.chatHistory.forEach(h => {
        messages.push({ role: h.role, content: h.text });
      });
    }
    
    messages.push({ role: "user", content: msg });

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({ 
        model: "gpt-4o-mini", // Using efficient model
        messages: messages 
      })
    });

    const data = await response.json();
    
    const typing = document.getElementById("typingIndicator");
    if (typing) typing.remove();
    
    if (data.error) {
      addMessage("Bot", "Error: " + data.error.message);
    } else {
      const reply = data.choices[0].message.content;'''

        send_msg_new = '''const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const contents = [];
    if (window.chatHistory) {
      window.chatHistory.forEach(h => {
        contents.push({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.text }] });
      });
    }
    contents.push({ role: "user", parts: [{ text: msg }] });

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        system_instruction: { parts: { text: "You are an Ayurvedic health assistant answering queries for a Panchakarma patient. Keep your answers concise and helpful." } },
        contents: contents 
      })
    });

    const data = await response.json();
    
    const typing = document.getElementById("typingIndicator");
    if (typing) typing.remove();
    
    if (data.error) {
      addMessage("Bot", "Error: " + data.error.message);
    } else {
      const reply = data.candidates[0].content.parts[0].text;'''
        html = html.replace(send_msg_old, send_msg_new)

    # Replace getTreatmentSuggestion in patient.html
    if 'getTreatmentSuggestion' in html:
        treatment_old = '''const url = "https://api.openai.com/v1/chat/completions";

    const prompt = `You are an Ayurvedic expert. A patient reports these symptoms: "${symptoms}".
    Based on these symptoms, suggest exactly 2 most relevant therapies from this specific list: ${THERAPY_LIST.join(", ")}.
    For each suggestion, provide a 1-sentence reason.
    Response format MUST BE STRICTLY as follows (one suggestion per line):
    THERAPY: [Therapy Name from List] | REASON: [Your Reason]
    THERAPY: [Therapy Name from List] | REASON: [Your Reason]`;

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Unknown API Error: " + JSON.stringify(data));
    }
    
    const text = data.choices[0].message.content;'''
        
        treatment_new = '''const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `You are an Ayurvedic expert. A patient reports these symptoms: "${symptoms}".
    Based on these symptoms, suggest exactly 2 most relevant therapies from this specific list: ${THERAPY_LIST.join(", ")}.
    For each suggestion, provide a 1-sentence reason.
    Response format MUST BE STRICTLY as follows (one suggestion per line):
    THERAPY: [Therapy Name from List] | REASON: [Your Reason]
    THERAPY: [Therapy Name from List] | REASON: [Your Reason]`;

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Unknown API Error: " + JSON.stringify(data));
    }
    
    const text = data.candidates[0].content.parts[0].text;'''
        html = html.replace(treatment_old, treatment_new)

    # Replace AI Report generator (admin.html, doctor.html)
    if 'generateReport' in html:
        report_old = '''const url = "https://api.openai.com/v1/chat/completions";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    if(data.error) throw new Error(data.error.message);

    const reportContent = data.choices[0].message.content;'''
        report_new = '''const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if(data.error) throw new Error(data.error.message);

    const reportContent = data.candidates[0].content.parts[0].text;'''
        html = html.replace(report_old, report_new)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html)

rewrite_gemini('patient.html')
rewrite_gemini('doctor.html')
rewrite_gemini('admin.html')
