// NEW AUTHENTICATION LOGIC USING LOCAL NODE.JS SERVER AND MYSQL

// SIGNUP
document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;
  const name = document.getElementById("name").value;

  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);
  formData.append('role', role);
  formData.append('name', name);

  if (role === 'doctor') {
    const degreeFile = document.getElementById("degreeFile")?.files[0];
    const idProofFile = document.getElementById("idProofFile")?.files[0];
    const license = document.getElementById("license")?.value || "";
    
    if (!degreeFile || !idProofFile) {
      alert("Please upload both Degree Certificate and ID Proof.");
      return;
    }
    
    formData.append('degreeFile', degreeFile);
    formData.append('idProofFile', idProofFile);
    formData.append('licenseNumber', license);
  }

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      body: formData // No Content-Type header needed for FormData (browser sets it with boundary)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    alert("Signup done! You can now login.");
    window.location.href = "login.html";
  } catch (error) {
    console.error("Signup error:", error);
    alert(error.message);
  }
});


// LOGIN
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Save JWT token and user info
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Redirect based on role
    const role = data.user.role;
    if (role === "admin") window.location.href = "admin.html";
    else if (role === "doctor") window.location.href = "doctor.html";
    else window.location.href = "patient.html";
    
  } catch (error) {
    console.error("Login error:", error);
    alert(error.message);
  }
});