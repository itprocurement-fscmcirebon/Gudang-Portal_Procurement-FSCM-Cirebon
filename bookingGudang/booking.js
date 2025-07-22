// === Dropdown slot sesi jam (interval 30 menit) ===
function generateTimeSlots(startHour = 0, endHour = 15, intervalMins = 30) {
  const slotDropdown = document.getElementById("slot");
  if (!slotDropdown) return;

  slotDropdown.innerHTML = "";

  // Tambahkan option default yang tidak bisa dipilih
  slotDropdown.appendChild(new Option("Pilih Jam", "", true, true)).disabled = true;

  const start = startHour * 60;
  const end = endHour * 60;

  for (let m = start; m < end; m += intervalMins) {
    const h1 = String(Math.floor(m / 60)).padStart(2, "0");
    const m1 = String(m % 60).padStart(2, "0");
    const h2 = String(Math.floor((m + intervalMins) / 60)).padStart(2, "0");
    const m2 = String((m + intervalMins) % 60).padStart(2, "0");
    
    // PERBAIKAN: Pisahkan antara nilai (value) dan tampilan (label)
    const value = `${h1}:${m1}-${h2}:${m2}`;      // Nilai untuk dikirim ke backend (tanpa spasi)
    const label = `${h1}:${m1} - ${h2}:${m2}`;    // Teks yang dilihat pengguna (dengan spasi)
    
    slotDropdown.appendChild(new Option(label, value));
  }
}

// === AMBIL KODE SUPPLIER DARI SESSION LOGIN ===
const loggedInSupplierCode = localStorage.getItem("supplierCode");
const loggedInSupplierName = localStorage.getItem("supplierName");

// === SUPPLIER DATA DARI LOGIN SYSTEM ===
const supplierDatabase = {
  SPP000123: { name: "Radith Fawwaz CV" },
  SPP000322: { name: "ANEKA GRAFIKA CV" },
  SPP000471: { name: "ANUGERAH SPAREPARTS SEJAHTERA PT." },
  SPP000783: { name: "BIOMASA JAYA NUSANTARA PT" },
  SPP000774: { name: "CAHAYA PRIMA MANDIRI CV" },
  SPP000693: { name: "CIPTA MAJUJAYA BERSAMA PT" },
  SPP000563: { name: "HANA CITRA BUANA CV" },
  SPP000359: { name: "HANWA STEEL SERVICE INDONESIA PT" },
  SPP000659: { name: "HARAITO MAJU MAPAN PT" },
  SPP000653: { name: "INDOMETAL MITRABUANA PT" },
  SPP000072: { name: "INDOPRINT ABADI CV" },
  SPP000078: { name: "INDUSTRIAL CHEMITOMO NUSANTARA" },
  SPP000449: { name: "INKOTE INDONESIA PT (JKT)" },
  SPP000652: { name: "MIRE PRIN COLL PT" },
  SPP000618: { name: "MITRA NIAGA MAHKOTA PT" },
  SPP000786: { name: "NISAKA EKA PLASTIK PT" },
  SPP000772: { name: "PT BESQ SARANA ABADI" },
  SPP000174: { name: "STAR CHEMICAL INDUSTRY PT" },
  SPP000362: { name: "TATA KARYA RUBBERINDO" },
  SPP000742: { name: "TIGER STAR INDONESIA PT" },
  SPP000729: { name: "TRI CENTRUM FORTUNA PT" },
  SPP000687: { name: "TRISENTOSA RAYA ESOLUSI PT" },
  SPP000775: { name: "UD WIDJAYA" },
  SPP000664: { name: "UNIT TEKNIS KARANG TARUNA" },
  SPP000180: { name: "UNITED STEEL CENTER INDONESIA PT" },
  SPP000635: { name: "YOGYA PRESISI TEHNIKATAMA INDUSTRI" },
};

// === DOM Elements ===
const inputSupplier = document.querySelector('input[name="supplier"]');
const suggestionBoxSupplier =
  inputSupplier?.parentElement.querySelector(".suggestion-box");

// === AUTO-FILL KODE SUPPLIER DARI SESSION LOGIN ===
function initializeSupplierCode() {
  console.log("Initializing supplier code...", {
    loggedInSupplierCode,
    loggedInSupplierName,
  });

  if (!loggedInSupplierCode) {
    console.error("No supplier code in session!");
    return false;
  }

  if (!inputSupplier) {
    console.error("Supplier input element not found!");
    return false;
  }

  console.log(
    "Auto-filling supplier code in booking form:",
    loggedInSupplierCode
  );

  // Set value supplier dengan force
  inputSupplier.value = loggedInSupplierCode;

  // Set sebagai readonly tapi tetap enabled agar value terbaca saat submit
  inputSupplier.readOnly = true;
  inputSupplier.style.backgroundColor = "#475569";
  inputSupplier.style.cursor = "not-allowed";
  inputSupplier.style.opacity = "0.7";

  // Tambahkan attribute untuk memastikan value terbaca
  inputSupplier.setAttribute("value", loggedInSupplierCode);

  // Trigger event change untuk memastikan form mengenali value
  const changeEvent = new Event("change", { bubbles: true });
  inputSupplier.dispatchEvent(changeEvent);

  // Tambahkan tooltip
  const supplierName =
    loggedInSupplierName || supplierDatabase[loggedInSupplierCode]?.name || "";
  inputSupplier.title = `Kode supplier sesuai login: ${loggedInSupplierCode}${
    supplierName ? " - " + supplierName : ""
  }`;

  // Hide suggestion box
  if (suggestionBoxSupplier) {
    suggestionBoxSupplier.style.display = "none";
  }

  console.log("Supplier code successfully initialized:", {
    code: loggedInSupplierCode,
    name: supplierName,
    inputValue: inputSupplier.value,
    inputAttribute: inputSupplier.getAttribute("value"),
  });

  return true;
}

// === Status Message Handling ===
// Variabel global untuk mengontrol timeout
let statusMessageTimeout;

function showStatusMessage(statusEl, message, isSuccess = true, duration = 5000) {
  if (!statusEl) return;

  // 1. Hapus timeout sebelumnya jika ada
  clearTimeout(statusMessageTimeout);

  // 2. Set pesan dan class baru
  statusEl.textContent = message;
  statusEl.className = `status-message ${isSuccess ? "status-success" : "status-error"}`;

  // 3. Tampilkan elemen dan paksa browser menggambar ulang
  statusEl.style.display = 'block';
  void statusEl.offsetWidth; // Trik untuk memastikan transisi berjalan

  // 4. Tambahkan class 'show' untuk memicu animasi
  statusEl.classList.add('show');

  // 5. Set timeout baru untuk menyembunyikan notifikasi
  statusMessageTimeout = setTimeout(() => {
    statusEl.classList.remove('show');
    
    // Sembunyikan elemen setelah animasi selesai
    setTimeout(() => {
        if (!statusEl.classList.contains('show')) {
            statusEl.style.display = 'none';
        }
    }, 500); // Sesuaikan dengan durasi transisi di CSS Anda

  }, duration);
}

// === Form Submission ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing booking form...");

  // Generate time slots
  generateTimeSlots();

  // Waktu jadwal yang sudah terlewat -> tidak bisa dipilih
  updateAvailableTimeSlots();

  // Wait a bit untuk memastikan semua elemen sudah siap, lalu coba beberapa kali
  let initAttempts = 0;
  const maxAttempts = 5;

  function tryInitialize() {
    initAttempts++;
    console.log(`Initialization attempt ${initAttempts}/${maxAttempts}`);

    const success = initializeSupplierCode();
    if (!success && initAttempts < maxAttempts) {
      setTimeout(tryInitialize, 200);
    } else if (!success) {
      console.error(
        "Failed to initialize supplier code after",
        maxAttempts,
        "attempts"
      );
    }
  }

  const dateInput = document.getElementById("tanggal");
  if (dateInput) {
    dateInput.addEventListener("change", updateAvailableTimeSlots);
  }

  setTimeout(tryInitialize, 100);

  const form = document.getElementById("bookingForm");
  const status = document.getElementById("formStatus");

  if (!form || !status) {
    console.error("Form or status element not found!");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Form submitted...");

    // Pastikan supplier code terisi sebelum submit
    const supplierInput = form.querySelector('input[name="supplier"]');
    if (!supplierInput || !supplierInput.value.trim()) {
      console.error("Supplier input not found or empty!");
      showStatusMessage(
        status,
        "❌ Kode supplier tidak terisi! Silakan refresh halaman.",
        false
      );

      // Coba initialize ulang
      setTimeout(() => {
        initializeSupplierCode();
      }, 500);
      return;
    }

    const supplierValue = supplierInput.value.trim();
    console.log("Supplier value:", supplierValue);

    // Validasi kode supplier
    if (!supplierValue.startsWith("SPP")) {
      showStatusMessage(
        status,
        "❌ Kode Supplier harus diawali dengan 'SPP'!",
        false
      );
      return;
    }

    // Validasi kode supplier harus sesuai dengan session
    if (supplierValue !== loggedInSupplierCode) {
      showStatusMessage(
        status,
        `❌ Kode Supplier tidak sesuai dengan login: ${loggedInSupplierCode}`,
        false
      );
      return;
    }
    const formData = new FormData(form);
    formData.append("action", "createBooking");
    const selectedDateStr = formData.get("tanggal");
    const selectedSlot = formData.get("slot");

    // --- VALIDASI WAKTU REAL-TIME (TAMBAHKAN BLOK INI) ---
    try {
      const today = new Date();
      const selectedDate = new Date(selectedDateStr + "T00:00:00"); // Hindari masalah timezone

      // Cek apakah tanggal yang dipilih adalah hari ini
      if (
        selectedDate.getFullYear() === today.getFullYear() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getDate() === today.getDate()
      ) {
        // Jika ya, periksa jam-nya
        const startTimeStr = selectedSlot.split("-")[0].trim(); // e.g., "09:00"
        const bookingStartDateTime = new Date(
          `${selectedDateStr}T${startTimeStr}:00`
        );

        // Jika waktu slot sudah lewat dari waktu sekarang
        if (bookingStartDateTime < today) {
          showStatusMessage(
            status,
            `❌ Tidak bisa booking di waktu yang sudah lewat: ${selectedSlot}`,
            false
          );
          return; // Hentikan proses submit
        }
      }
    } catch (err) {
      console.error("Error validating time:", err);
    }

    // Tambahkan informasi supplier name
    const supplierName =
      loggedInSupplierName ||
      supplierDatabase[loggedInSupplierCode]?.name ||
      "";
    formData.append("supplierName", supplierName);
    formData.append("loginSession", "true");

    // Debug form data
    console.log("Form data being sent:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const submitUrl =
      "https://script.google.com/macros/s/AKfycbxTBxSZCo8AlZ3x6OeMmK9m9DAHSQ6X6REz9qzpQktaHFvUgq0lVFCEq97CvC51hSwK/exec";

    try {
      // --- PERUBAHAN PESAN 1: PESAN SAAT LOADING ---
      showStatusMessage(status, "⏳ Mengirim booking Anda...", true);

      const response = await fetch(submitUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Response from server:", result);

      if (result.success === true) {
        // --- PERUBAHAN PESAN 2: PESAN SUKSES BARU ---
        showStatusMessage(
          status,
          "✅ Permintaan Diterima! Jadwal Anda sedang diproses dan akan dikonfirmasi dalam beberapa menit. Silakan periksa halaman Riwayat Booking untuk melihat status final.",
          true,
          8000 // Tampilkan pesan sedikit lebih lama (8 detik)
        );

        form.reset();
        updateAvailableTimeSlots(); // Pastikan slot direset setelah form di-reset

        setTimeout(() => {
          initializeSupplierCode();
        }, 200);
      } else {
        throw new Error(result.error || "Terjadi kesalahan pada server");
      }
    } catch (error) {
      console.error("Booking error:", error);
      showStatusMessage(
        status,
        `❌ Gagal melakukan booking: ${error.message}`,
        false
      );
    }
  });

  // Debug session info
  console.log("Booking form session info:", {
    supplierCode: loggedInSupplierCode,
    supplierName: loggedInSupplierName,
    isLoggedIn: localStorage.getItem("isLoggedIn"),
  });
});

function updateAvailableTimeSlots() {
  const dateInput = document.getElementById("tanggal"); // Pastikan ID input tanggal Anda adalah 'tanggal'
  const slotDropdown = document.getElementById("slot"); // Pastikan ID dropdown slot adalah 'slot'
  if (!dateInput || !slotDropdown) return;

  const selectedDateStr = dateInput.value;
  if (!selectedDateStr) {
    // Jika tanggal belum dipilih, aktifkan semua slot
    for (const option of slotDropdown.options) {
      option.disabled = false;
    }
    return;
  }

  const today = new Date();
  const selectedDate = new Date(selectedDateStr + "T00:00:00");

  // Reset semua slot ke kondisi normal dulu
  for (const option of slotDropdown.options) {
    option.disabled = false;
  }

  // Hanya jalankan logika jika tanggal yang dipilih adalah hari ini
  if (
    selectedDate.getFullYear() === today.getFullYear() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getDate() === today.getDate()
  ) {
    const currentTime = today.getHours() * 60 + today.getMinutes(); // Waktu saat ini dalam menit

    for (const option of slotDropdown.options) {
      try {
        const slotStartTimeStr = option.value.split("-")[0].trim(); // "09:00"
        const slotHour = parseInt(slotStartTimeStr.split(":")[0]);
        const slotMinute = parseInt(slotStartTimeStr.split(":")[1]);
        const slotTimeInMinutes = slotHour * 60 + slotMinute;

        // Jika waktu slot lebih awal dari waktu sekarang, nonaktifkan
        if (slotTimeInMinutes < currentTime) {
          option.disabled = true;
        }
      } catch (e) {
        // Abaikan jika ada format slot yang aneh
        console.error("Could not parse slot:", option.value);
      }
    }
  }
}
