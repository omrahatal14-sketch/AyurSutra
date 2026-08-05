// JWT Route Guard

export function protect(requiredRole = null) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    window.location.href = "login.html";
    return;
  }

  try {
    const user = JSON.parse(userStr);
    
    if (requiredRole && user.role !== requiredRole) {
      alert("Unauthorized Access");
      window.location.href = "login.html";
      return;
    }

    // Set a global user object for other scripts to use
    window.currentUser = user;

    // Optional: display user name in the top bar
    document.addEventListener("DOMContentLoaded", () => {
      const uName = document.getElementById("userName");
      if(uName) uName.textContent = user.name;
    });

  } catch (err) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = "login.html";
  }
}