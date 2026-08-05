import os

for filename in ['patient.html', 'doctor.html', 'admin.html']:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Let's replace 'gemini-1.5-flash' with 'gemini-pro'
    content = content.replace('gemini-1.5-flash', 'gemini-pro')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filename}")
