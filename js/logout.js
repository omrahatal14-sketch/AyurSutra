document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = "login.html";
});

window.logout = function() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = "login.html";
};