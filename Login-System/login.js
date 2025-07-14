// ===== SUPPLIER DATA LOADER =====
let supplierDatabase = {};
let isDataLoaded = false;

// Function to load supplier data from JSON file
async function loadSupplierData() {
  try {
    showMessage("Memuat data supplier...", "info");
    const response = await fetch('data-suppliers.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    supplierDatabase = await response.json();
    isDataLoaded = true;
    console.log('Supplier data loaded successfully');
    hideMessage();
  } catch (error) {
    console.error('Error loading supplier data:', error);
    showMessage('Gagal memuat data supplier. Silakan refresh halaman.', 'error');
    isDataLoaded = false;
  }
}

// ===== DOM ELEMENTS =====
const loginForm = document.getElementById("loginForm");
const supplierCodeInput = document.getElementById("supplierCode");
const passwordInput = document.getElementById("password");
const submitBtn = loginForm.querySelector('button[type="submit"]');
const btnText = submitBtn.querySelector(".btn-text");
const btnLoading = submitBtn.querySelector(".btn-loading");
const messageContainer = document.getElementById("messageContainer");
const messageText = document.getElementById("messageText");
const logoutSection = document.getElementById("logoutSection");
const logoutBtn = document.getElementById("logoutBtn");

// ===== UTILITY FUNCTIONS =====
function showMessage(message, type = "error") {
  messageText.textContent = message;
  messageContainer.className = `message-container ${type}`;
  messageContainer.style.display = "block";

  // Auto hide success and info messages after 3 seconds
  if (type === "success" || type === "info") {
    setTimeout(() => {
      hideMessage();
    }, 3000);
  }
}

function hideMessage() {
  messageContainer.style.display = "none";
}

function setLoadingState(isLoading) {
  if (isLoading) {
    submitBtn.disabled = true;
    btnText.style.display = "none";
    btnLoading.style.display = "inline";
  } else {
    submitBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
  }
}

function validateInputs() {
  const supplierCode = supplierCodeInput.value.trim();
  const password = passwordInput.value.trim();

  if (!supplierCode) {
    showMessage("Kode supplier harus diisi", "error");
    supplierCodeInput.focus();
    return false;
  }

  if (!password) {
    showMessage("Password harus diisi", "error");
    passwordInput.focus();
    return false;
  }

  return true;
}

function authenticateUser(supplierCode, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check if data is loaded
      if (!isDataLoaded) {
        reject("Data supplier belum dimuat. Silakan tunggu atau refresh halaman.");
        return;
      }

      const supplier = supplierDatabase[supplierCode.toUpperCase()];

      if (!supplier) {
        reject("Kode supplier tidak ditemukan");
        return;
      }

      if (supplier.status !== "active") {
        reject("Akun supplier tidak aktif. Hubungi administrator");
        return;
      }

      if (supplier.password !== password) {
        reject("Password salah");
        return;
      }

      resolve({
        code: supplierCode.toUpperCase(),
        name: supplier.name,
        status: supplier.status,
      });
    }, 1500);
  });
}

function saveUserSession(supplierData) {
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("supplierCode", supplierData.code);
  localStorage.setItem("supplierName", supplierData.name);
  localStorage.setItem("loginTime", new Date().toISOString());
}

function isSessionValid() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const supplierCode = localStorage.getItem("supplierCode");
  
  return isLoggedIn === "true" && supplierCode;
}

function redirectToPortal() {
  setTimeout(() => {
    window.location.href = "../landingPage/index.html";
  }, 1000);
}

function logout() {
  // Clear session data
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("supplierCode");
  localStorage.removeItem("supplierName");
  localStorage.removeItem("loginTime");

  // Reset form
  supplierCodeInput.value = "";
  supplierCodeInput.disabled = false;
  passwordInput.value = "";

  // Hide logout section
  logoutSection.style.display = "none";

  // Show logout success message
  showMessage("Logout berhasil. Silakan login kembali.", "success");

  // Focus on supplier code input
  supplierCodeInput.focus();
}

// ===== EVENT LISTENERS =====
loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  // Hide any existing messages
  hideMessage();

  // Check if data is loaded
  if (!isDataLoaded) {
    showMessage("Data supplier belum dimuat. Silakan tunggu sebentar.", "error");
    return;
  }

  // Validate inputs
  if (!validateInputs()) {
    return;
  }

  const supplierCode = supplierCodeInput.value.trim();
  const password = passwordInput.value.trim();

  // Set loading state
  setLoadingState(true);

  try {
    // Authenticate user
    const supplierData = await authenticateUser(supplierCode, password);

    // Save session
    saveUserSession(supplierData);

    // Show success message
    showMessage(`Selamat datang, ${supplierData.name}!`, "success");

    // Redirect to portal page
    redirectToPortal();
  } catch (error) {
    showMessage(error, "error");
  } finally {
    setLoadingState(false);
  }
});

// Clear messages when user starts typing
supplierCodeInput.addEventListener("input", hideMessage);
passwordInput.addEventListener("input", hideMessage);

// Logout button event listener
logoutBtn.addEventListener("click", function () {
  logout();
});

// Auto-focus on supplier code input
supplierCodeInput.focus();

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", async function () {
  // Load supplier data first
  await loadSupplierData();
  
  // Then check session
  if (isSessionValid()) {
    const supplierCode = localStorage.getItem("supplierCode");
    const supplierName = localStorage.getItem("supplierName");
    
    showMessage(
      `Anda sudah login sebagai ${supplierName || supplierCode}. Klik tombol "Masuk" untuk melanjutkan ke portal.`,
      "success"
    );

    // Pre-fill the supplier code
    supplierCodeInput.value = supplierCode;
    supplierCodeInput.disabled = true;

    // Show logout section
    logoutSection.style.display = "block";

    // Focus on password field
    passwordInput.focus();
  }
});