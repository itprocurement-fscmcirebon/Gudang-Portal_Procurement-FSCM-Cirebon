// ===== DOM ELEMENTS =====
const userInfo = document.getElementById('userInfo');
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutBtn = document.getElementById('logoutBtn');
const portalDescription = document.getElementById('portalDescription');
const loginRequired = document.getElementById('loginRequired');
const buttonsContainer = document.querySelector('.buttons');

// ===== UTILITY FUNCTIONS =====
function checkAuthStatus() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const supplierCode = localStorage.getItem('supplierCode');
  const supplierName = localStorage.getItem('supplierName');
  
  return {
    isAuthenticated: isLoggedIn === 'true' && supplierCode,
    supplierCode: supplierCode,
    supplierName: supplierName
  };
}

function showAuthenticatedView(supplierData) {
  // Show user info section
  userInfo.style.display = 'block';
  welcomeMessage.textContent = `Selamat datang, ${supplierData.supplierName || supplierData.supplierCode}!`;
  
  // Show normal portal content
  buttonsContainer.style.display = 'flex';
  portalDescription.style.display = 'block';
  
  // Hide login required message
  loginRequired.style.display = 'none';
}

function showUnauthenticatedView() {
  // Hide user info section
  userInfo.style.display = 'none';
  
  // Hide portal buttons
  buttonsContainer.style.display = 'none';
  portalDescription.style.display = 'none';
  
  // Show login required message
  loginRequired.style.display = 'block';
}

function logout() {
  // Clear all session data
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('supplierCode');
  localStorage.removeItem('supplierName');
  localStorage.removeItem('loginTime');
  
  // Show confirmation (optional)
  if (confirm('Apakah Anda yakin ingin logout?')) {
    // Redirect to login page
    window.location.href = '../Login-System/login.html';
  } else {
    // If cancelled, restore the data (since we already cleared it)
    location.reload();
  }
}

function protectLinks() {
  const protectedLinks = document.querySelectorAll('.buttons a');
  
  protectedLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const auth = checkAuthStatus();
      
      if (!auth.isAuthenticated) {
        e.preventDefault();
        alert('Anda harus login terlebih dahulu!');
        window.location.href = '../Login-System/login.html';
      }
    });
  });
}

// ===== EVENT LISTENERS =====
logoutBtn.addEventListener('click', logout);

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  const auth = checkAuthStatus();
  
  if (auth.isAuthenticated) {
    showAuthenticatedView(auth);
  } else {
    showUnauthenticatedView();
  }
  
  // Protect all navigation links
  protectLinks();
});

// ===== SESSION TIMEOUT (Optional) =====
function checkSessionTimeout() {
  const loginTime = localStorage.getItem('loginTime');
  if (!loginTime) return;
  
  const now = new Date().getTime();
  const loginTimestamp = new Date(loginTime).getTime();
  const timeDiff = now - loginTimestamp;
  
  // Set session timeout to 8 hours (8 * 60 * 60 * 1000 ms)
  const sessionTimeout = 8 * 60 * 60 * 1000;
  
  if (timeDiff > sessionTimeout) {
    alert('Sesi Anda telah berakhir. Silakan login kembali.');
    logout();
  }
}

// Check session timeout every 30 minutes
setInterval(checkSessionTimeout, 30 * 60 * 1000);