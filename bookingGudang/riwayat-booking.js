// ===== RIWAYAT BOOKING JAVASCRIPT - FIXED VERSION =====

// Global Variables
let currentData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 3;
let currentSupplierCode = "";
let lastBookingUpdate = localStorage.getItem("bookingUpdated") || "0";
let currentBookingForRevision = null;
let currentBookingForCancellation = null;

// Google Apps Script Web App URLs
const FETCH_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxTBxSZCo8AlZ3x6OeMmK9m9DAHSQ6X6REz9qzpQktaHFvUgq0lVFCEq97CvC51hSwK/exec";

// ===== API FUNCTIONS =====
const getBookingHistory = async (supplierCode) => {
  try {
    const response = await fetch(
      `${FETCH_SCRIPT_URL}?action=getHistory&supplier=${supplierCode}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getBookingHistory:", error);
    throw error;
  }
};

const getStatistics = async (supplierCode) => {
  try {
    const response = await fetch(
      `${FETCH_SCRIPT_URL}?action=getStatistics&supplier=${supplierCode}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getStatistics:", error);
    throw error;
  }
};

const updateBooking = async (bookingId, supplierCode, updateData, action) => {
  try {
    const formData = new FormData();
    formData.append("action", action);

    // Gunakan rowIndex dari bookingId sebagai identifier
    formData.append("rowIndex", bookingId);
    formData.append("supplierCode", supplierCode);

    if (action === "reviseBooking") {
      // Untuk revisi, gunakan action "updateBooking"
      formData.append("tanggal", updateData.newDate);
      formData.append("sesiWaktu", updateData.newTimeSlot);
      formData.append("catatan", updateData.reason);
    } else if (action === "cancelBooking") {
      // Untuk pembatalan, sudah benar
      formData.append(
        "reason",
        updateData.reason || "Dibatalkan oleh supplier"
      );
    }

    const response = await fetch(FETCH_SCRIPT_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in updateBooking:", error);
    throw error;
  }
};

// DOM Elements
const elements = {
  supplierDisplay: document.getElementById("supplierDisplay"),
  loadingState: document.getElementById("loadingState"),
  emptyState: document.getElementById("emptyState"),
  historyTable: document.getElementById("historyTable"),
  historyTableBody: document.getElementById("historyTableBody"),
  paginationContainer: document.getElementById("paginationContainer"),

  // Filter elements
  filterDateFrom: document.getElementById("filterDateFrom"),
  filterDateTo: document.getElementById("filterDateTo"),
  filterStatus: document.getElementById("filterStatus"),
  btnFilter: document.getElementById("btnFilter"),
  btnReset: document.getElementById("btnReset"),
  btnRefresh: document.getElementById("btnRefresh"),

  // Pagination elements
  btnPrevPage: document.getElementById("btnPrevPage"),
  btnNextPage: document.getElementById("btnNextPage"),
  pageInfo: document.getElementById("pageInfo"),

  // Detail Modal elements
  detailModal: document.getElementById("detailModal"),
  modalBody: document.getElementById("modalBody"),
  modalClose: document.getElementById("modalClose"),
  btnCloseModal: document.getElementById("btnCloseModal"),

  // Statistics elements
  statTotal: document.getElementById("statTotal"),
  statProcessed: document.getElementById("statProcessed"),
  statCancelled: document.getElementById("statCancelled"),

  // Status message
  statusMessage: document.getElementById("statusMessage"),

  // Revision Modal elements
  revisionModal: document.getElementById("revisionModal"),
  currentBookingDetails: document.getElementById("currentBookingDetails"),
  revisionForm: document.getElementById("revisionForm"),
  newDate: document.getElementById("newDate"),
  submitRevisionBtn: document.getElementById("submitRevisionBtn"),

  // Cancel Modal elements
  cancelModal: document.getElementById("cancelModal"),
  cancelBookingDetails: document.getElementById("cancelBookingDetails"),
  cancelReason: document.getElementById("cancelReason"),
  confirmCancelBtn: document.getElementById("confirmCancelBtn"),
};

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", function () {
  initializePage();
  initializeFilters();
  setupEventListeners();
  loadBookingHistory();
  setupAutoRefresh();
});

function initializePage() {
  currentSupplierCode =
    localStorage.getItem("supplierCode") ||
    getUrlParameter("supplier") ||
    "Unknown";
  updateSupplierDisplay();

  // Set default date range (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (elements.filterDateFrom) {
    elements.filterDateFrom.value = formatDateForInput(thirtyDaysAgo);
  }
  if (elements.filterDateTo) {
    elements.filterDateTo.value = formatDateForInput(today);
  }
}

// Tambahkan fungsi ini untuk dipanggil saat page load
function initializeFilters() {
  // Reset semua filter saat page baru dibuka
  if (elements.filterStatus) elements.filterStatus.value = "";
  if (elements.filterDateFrom) elements.filterDateFrom.value = "";
  if (elements.filterDateTo) elements.filterDateTo.value = "";

  // Set filteredData sama dengan currentData
  filteredData = [...currentData];
}

function setupEventListeners() {
  // Filter events
  if (elements.btnFilter)
    elements.btnFilter.addEventListener("click", applyFilters);
  if (elements.btnReset)
    elements.btnReset.addEventListener("click", resetFilters);
  if (elements.btnRefresh)
    elements.btnRefresh.addEventListener("click", refreshData);

  // Pagination events
  if (elements.btnPrevPage) {
    elements.btnPrevPage.addEventListener("click", () =>
      changePage(currentPage - 1)
    );
  }
  if (elements.btnNextPage) {
    elements.btnNextPage.addEventListener("click", () =>
      changePage(currentPage + 1)
    );
  }

  // Revision Modal events
  const revisionModal = document.getElementById("revisionModal");
  if (revisionModal) {
    revisionModal.addEventListener("click", function (e) {
      if (e.target === revisionModal) {
        closeRevisionModal();
      }
    });
  }

  // Cancel Modal events
  const cancelModal = document.getElementById("cancelModal");
  if (cancelModal) {
    cancelModal.addEventListener("click", function (e) {
      if (e.target === cancelModal) {
        closeCancelModal();
      }
    });
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      // Check if revision modal is visible
      if (revisionModal && revisionModal.classList.contains("show")) {
        closeRevisionModal();
      }
      // Check if cancel modal is visible
      if (cancelModal && cancelModal.classList.contains("show")) {
        closeCancelModal();
      }
    }
  });
  // Storage changes listener
  window.addEventListener("storage", function (e) {
    if (e.key === "bookingUpdated") {
      checkForBookingUpdates();
    }
  });

  // Visibility change listener
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      checkForBookingUpdates();
    }
  });

  // --- PENGGANTI FUNGSI-FUNGSI ENHANCEMENT ---
  const modals = ["revisionModal", "cancelModal"];
  modals.forEach((modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // 1. Event listener untuk klik di luar modal (overlay) untuk menutup
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal(modalId);
      }
    });

    // 2. Event listener untuk transisi fade-out
    modal.addEventListener("transitionend", () => {
      if (!modal.classList.contains("show")) {
        modal.style.display = "none";
      }
    });
  });

  // 3. Event listener untuk keyboard (tombol Escape)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modals.forEach((modalId) => {
        const modal = document.getElementById(modalId);
        if (modal && modal.classList.contains("show")) {
          closeModal(modalId);
        }
      });
    }
  });
}

// ===== DATA LOADING =====
async function loadBookingHistory() {
  try {
    showLoadingState();

    let response;
    try {
      response = await getBookingHistory(currentSupplierCode);
    } catch (error) {
      console.warn("API failed, using dummy data for testing:", error);
      response = {
        success: true,
        data: [
          {
            rowIndex: 2, // Simulasi row index dari Google Sheets
            timestamp: "2025-06-15 10:30",
            tanggal: "2025-06-20",
            sesiWaktu: "08:00-10:00",
            status: "Pending",
            catatan: "Booking untuk pengiriman material",
          },
          {
            rowIndex: 3,
            timestamp: "2025-06-14 14:20",
            tanggal: "2025-06-22",
            sesiWaktu: "13:00-15:00",
            status: "Pending",
            catatan: "Perlu revisi jadwal",
          },
        ],
      };
    }

    if (response.success) {
      currentData = response.data || [];
      // Pastikan setiap booking menggunakan rowIndex sebagai ID
      currentData = currentData.map((item, index) => ({
        ...item,
        id: item.rowIndex || `booking_${index}_${Date.now()}`,
      }));

      filteredData = [...currentData];

      if (currentData.length === 0) {
        showEmptyState();
      } else {
        showHistoryTable();
        await updateStatistics();
        updateTable();
        updatePagination();
      }
    } else {
      throw new Error(response.error || "Failed to load booking history");
    }
  } catch (error) {
    console.error("Error loading booking history:", error);
    showStatusMessage(
      "Gagal memuat riwayat booking: " + error.message,
      "error"
    );
    showEmptyState();
  }
}

// ===== STATISTICS =====
async function updateStatistics() {
  try {
    const result = await getStatistics(currentSupplierCode);

    if (result.success) {
      const stats = result.data;
      updateStatisticsDisplay(stats);
    } else {
      updateStatisticsFromLocal();
    }
  } catch (error) {
    console.error("Error updating statistics:", error);
    updateStatisticsFromLocal();
  }
}

function updateStatisticsDisplay(stats) {
  if (elements.statTotal) elements.statTotal.textContent = stats.total || 0;
  if (elements.statProcessed)
    elements.statProcessed.textContent = stats.processed || 0;
  if (elements.statCancelled)
    elements.statCancelled.textContent = stats.cancelled || 0;

  // Add animation effect
  [elements.statTotal, elements.statProcessed, elements.statCancelled].forEach(
    (element) => {
      if (element) {
        element.style.transform = "scale(1.1)";
        setTimeout(() => {
          element.style.transform = "scale(1)";
        }, 200);
      }
    }
  );
}

function updateStatisticsFromLocal() {
  const stats = {
    total: filteredData.length,
    processed: filteredData.filter(
      (item) =>
        item.status.toLowerCase().includes("processed") ||
        item.status.toLowerCase().includes("berhasil")
    ).length,
    cancelled: filteredData.filter(
      (item) =>
        item.status.toLowerCase().includes("cancelled") ||
        item.status.toLowerCase().includes("rejected") ||
        item.status.toLowerCase().includes("gagal")
    ).length,
  };

  updateStatisticsDisplay(stats);
}

// ===== TABLE MANAGEMENT =====
function updateTable() {
  console.log("updateTable called:", {
    currentPage: currentPage,
    itemsPerPage: itemsPerPage,
    filteredDataLength: filteredData.length,
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = filteredData.slice(startIndex, endIndex);

  console.log("Table pagination:", {
    startIndex: startIndex,
    endIndex: endIndex,
    pageDataLength: pageData.length,
  });

  if (elements.historyTableBody) {
    elements.historyTableBody.innerHTML = "";

    // Cek apakah ada data untuk ditampilkan
    if (pageData.length === 0) {
      const isFiltered =
        (elements.filterDateFrom && elements.filterDateFrom.value) ||
        (elements.filterDateTo && elements.filterDateTo.value) ||
        (elements.filterStatus && elements.filterStatus.value);

      showEmptyDataMessage(isFiltered);
      return;
    }

    pageData.forEach((item, index) => {
      const row = createTableRow(item);
      elements.historyTableBody.appendChild(row);
      console.log(`Added row ${index + 1}:`, item.tanggal, item.status);
    });
  }
}

function createTableRow(item) {
  const row = document.createElement("tr");
  const bookingId = item.rowIndex || item.id;

  let displayedStatus = item.status || "Pending";
  let statusClass = getStatusClass(item.status);
  let actionButtonsHTML = "";

  // --- LOGIKA BARU: Prioritaskan pengecekan catatan pembatalan ---
  const isCancelledInNote =
    item.catatan && String(item.catatan).toLowerCase().includes("[cancelled:");

  if (isCancelledInNote) {
    // Jika ada catatan pembatalan, paksa status dan sembunyikan semua tombol.
    displayedStatus = "❌ Cancelled";
    statusClass = "cancelled"; // Menggunakan class CSS untuk status batal
    actionButtonsHTML = '<span class="action-disabled">-</span>'; // Tidak ada aksi
  } else {
    // Jika tidak ada catatan pembatalan, jalankan logika normal seperti sebelumnya.
    const actions = isBookingActionable(item);

    if (actions.canRevise) {
      actionButtonsHTML += `<button class="btn-edit" onclick="openRevisionModal('${bookingId}')" type="button">Revisi Jadwal</button>`;
    }
    if (actions.canCancel) {
      actionButtonsHTML += `<button class="btn-cancel" onclick="openCancelModal('${bookingId}')" type="button">Pembatalan</button>`;
    }
    if (actionButtonsHTML === "") {
      actionButtonsHTML = '<span class="action-disabled">-</span>';
    }
  }
  // --- AKHIR LOGIKA BARU ---

  row.innerHTML = `
    <td>${item.timestamp || "-"}</td>
    <td>${item.tanggal || "-"}</td>
    <td>${item.sesiWaktu || "-"}</td>
    <td><span class="status-badge status-${statusClass}">${displayedStatus}</span></td>
    <td>${truncateText(item.catatan, 30)}</td>
    <td>
      <div class="action-buttons">
        ${actionButtonsHTML}
      </div>
    </td>
  `;

  return row;
}

function getStatusClass(status) {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("processed") || statusLower.includes("berhasil"))
    return "processed";
  if (
    statusLower.includes("cancelled") ||
    statusLower.includes("rejected") ||
    statusLower.includes("gagal")
  )
    return "cancelled";
  return "processed";
}

// ===== FILTERING =====
function applyFilters() {
  const statusFilter = elements.filterStatus ? elements.filterStatus.value : "";
  const dateFromFilter = elements.filterDateFrom
    ? elements.filterDateFrom.value
    : "";
  const dateToFilter = elements.filterDateTo ? elements.filterDateTo.value : "";

  filteredData = currentData.filter((item) => {
    // Filter berdasarkan kategori status (jika dipilih)
    if (statusFilter && getClassifiedStatus(item) !== statusFilter) {
      return false;
    }

    // Filter berdasarkan rentang tanggal (logika yang sudah ada)
    if (dateFromFilter || dateToFilter) {
      const itemDate = parseDate(item.tanggal);
      if (!itemDate) return false;

      if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter + "T00:00:00");
        if (itemDate < fromDate) return false;
      }
      if (dateToFilter) {
        const toDate = new Date(dateToFilter + "T23:59:59");
        if (itemDate > toDate) return false;
      }
    }

    // Jika lolos semua filter
    return true;
  });

  currentPage = 1;
  updateTable();
  updatePagination();
  updateStatisticsFromLocal(); // Update statistik berdasarkan data yang terfilter
}

function resetFilters() {
  if (elements.filterStatus) elements.filterStatus.value = ""; // <-- TAMBAHKAN INI
  if (elements.filterDateFrom) elements.filterDateFrom.value = "";
  if (elements.filterDateTo) elements.filterDateTo.value = "";

  filteredData = [...currentData];
  currentPage = 1;

  updateTable();
  updatePagination();
  updateStatisticsFromLocal();
}

function refreshData() {
  loadBookingHistory();
  showStatusMessage("Data direfresh.", "info");
}

// Fungsi untuk menampilkan pesan ketika tidak ada data
function showEmptyDataMessage(isFiltered = false) {
  if (elements.historyTableBody) {
    const message = isFiltered
      ? "Tidak ada jadwal booking yang sesuai dengan filter tanggal yang dipilih."
      : "Tidak ada data jadwal booking.";

    elements.historyTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-data-message">
          <div class="empty-state">
            <p>${message}</p>
            ${
              isFiltered
                ? '<button onclick="resetFilters()" class="btn-reset-filter">Reset Filter</button>'
                : ""
            }
          </div>
        </td>
      </tr>
    `;
  }
}

// ===== MODAL MANAGEMENT =====
// Revision Modal Functions
function openRevisionModal(bookingId) {
  // Validasi input
  if (!bookingId) {
    showStatusMessage("ID booking tidak valid!", "error");
    return;
  }

  const revisionModal = document.getElementById("revisionModal");
  if (revisionModal) {
    revisionModal.style.display = "flex";

    setTimeout(() => {
      revisionModal.classList.add("show");
    }, 10);
  }

  // Convert bookingId untuk memastikan kompatibilitas
  const bookingIdStr = String(bookingId);
  const bookingIdNum = Number(bookingId);

  // Cari booking dengan berbagai kemungkinan tipe data
  const booking = currentData.find((item) => {
    const matchRowIndex =
      item.rowIndex === bookingId ||
      item.rowIndex === bookingIdStr ||
      item.rowIndex === bookingIdNum;

    const matchId =
      item.id === bookingId ||
      item.id === bookingIdStr ||
      item.id === bookingIdNum;

    return matchRowIndex || matchId;
  });

  if (!booking) {
    showStatusMessage("Data booking tidak ditemukan!", "error");
    return;
  }

  // STATUS CHECK - hanya blok status yang benar-benar final
  const status = booking.status || "";
  const statusLower = status.toString().toLowerCase();

  // Function untuk check status yang tidak bisa direvisi
  function isNonRevisableStatus(status) {
    const statusLower = status.toLowerCase();

    // Status yang dibatalkan - TIDAK BISA DIREVISI
    if (
      statusLower.includes("cancelled") ||
      statusLower.includes("canceled") ||
      statusLower.includes("rejected")
    ) {
      return true;
    }

    // Status gagal - TIDAK BISA DIREVISI
    if (statusLower.includes("gagal") || statusLower.includes("failed")) {
      return true;
    }

    // Status selesai final - TIDAK BISA DIREVISI
    if (
      statusLower.includes("selesai") ||
      statusLower.includes("completed") ||
      statusLower.includes("done")
    ) {
      return true;
    }

    // CATATAN: Status '✓ Processed' BOLEH direvisi
    // Hanya status yang benar-benar final yang tidak bisa direvisi

    return false;
  }

  const cannotRevise = isNonRevisableStatus(status);

  console.log("Status analysis:", {
    originalStatus: status,
    statusLower: statusLower,
    cannotRevise: cannotRevise,
  });

  if (cannotRevise) {
    showStatusMessage(
      `Booking dengan status "${status}" tidak dapat direvisi karena sudah diproses atau dibatalkan.`,
      "error"
    );
    return;
  }

  currentBookingForRevision = booking;

  // Fill current booking details
  const currentBookingDetails = document.getElementById(
    "currentBookingDetails"
  );

  if (currentBookingDetails) {
    const displayBookingId = booking.rowIndex || booking.id || "N/A";
    const tanggal = booking.tanggal || "Tidak tersedia";
    const sesiWaktu = booking.sesiWaktu || "Tidak tersedia";
    const displayStatus = booking.status || "Tidak tersedia";
    const catatan = booking.catatan || "";

    currentBookingDetails.innerHTML = `
      <strong>ID:</strong> ${displayBookingId}<br>
      <strong>Tanggal:</strong> ${tanggal}<br>
      <strong>Waktu:</strong> ${sesiWaktu}<br>
      <strong>Status:</strong> ${displayStatus}
      ${catatan ? `<br><strong>Catatan:</strong> ${catatan}` : ""}
    `;
  }
}

function closeRevisionModal() {
  const revisionModal = document.getElementById("revisionModal");
  if (revisionModal) {
    revisionModal.classList.remove("show");
    
    // --- TAMBAHKAN INI ---
    const revisionForm = document.getElementById("revisionForm");
    if (revisionForm) {
      revisionForm.reset(); // Membersihkan semua isian form revisi
    }
    // --------------------

    setTimeout(() => {
      revisionModal.style.display = "none";
    }, 300);
  }
  currentBookingForRevision = null;
}

async function submitRevision() {
  // 1. Validasi Awal & Pengambilan Referensi
  const revisionForm = document.getElementById("revisionForm");
  if (!revisionForm || !currentBookingForRevision) return;

  const submitBtn = document.getElementById("submitRevisionBtn");
  if (!revisionForm.checkValidity()) {
    revisionForm.reportValidity();
    return;
  }

  const formData = new FormData(revisionForm);
  const newDate = formData.get("newDate");
  const timeSlot = formData.get("timeSlot");
  const reason = formData.get("revisionReason");

  if (!newDate || !timeSlot || !reason.trim()) {
    showStatusMessage("Semua field untuk revisi harus diisi!", "error");
    return;
  }

  // Nonaktifkan tombol untuk mencegah klik ganda dan tampilkan spinner
  if (submitBtn) {
    submitBtn.disabled = true;
    const btnText = submitBtn.querySelector(".btn-text");
    const spinner = submitBtn.querySelector(".loading-spinner");
    if (btnText) btnText.textContent = "Memproses...";
    if (spinner) spinner.style.display = "block";
  }

  // 2. Simpan Data Lama untuk Rollback & Cari Index
  const bookingId = currentBookingForRevision.rowIndex;
  const dataIndex = currentData.findIndex((item) => item.rowIndex == bookingId);
  // Buat salinan mendalam dari data asli sebelum diubah
  const originalBookingData =
    dataIndex !== -1
      ? JSON.parse(JSON.stringify(currentData[dataIndex]))
      : null;

  // 3. Optimistic UI Update: Ubah data di frontend terlebih dahulu
  if (dataIndex !== -1) {
    // Perbarui data di array utama (currentData)
    currentData[dataIndex].tanggal = newDate;
    currentData[dataIndex].sesiWaktu = timeSlot;
    currentData[dataIndex].status = "📝 Revised - Pending"; // Status sementara yang lebih deskriptif
    const originalNotes = currentData[dataIndex].catatan || "";
    currentData[dataIndex].catatan =
      originalNotes + (originalNotes ? " | " : "") + `[REVISION: ${reason}]`;

    // Perbarui juga data di array yang sudah difilter (jika ada)
    const filteredIndex = filteredData.findIndex(
      (item) => item.rowIndex == bookingId
    );
    if (filteredIndex !== -1) {
      filteredData[filteredIndex] = { ...currentData[dataIndex] };
    }

    // Langsung perbarui tabel HTML, tutup modal, dan beri pesan
    updateTable();
    closeRevisionModal();
    showStatusMessage("Perubahan Anda sedang diproses...", "info");
  } else {
    showStatusMessage("Error: Data booking lokal tidak ditemukan.", "error");
    if (submitBtn) submitBtn.disabled = false; // Aktifkan kembali tombol
    return;
  }

  // 4. Kirim Permintaan ke Server (Backend)
  try {
    const updateData = {
      newDate: newDate,
      newTimeSlot: timeSlot,
      reason: reason,
    };

    const result = await updateBooking(
      bookingId,
      currentSupplierCode,
      updateData,
      "reviseBooking" // Nama aksi yang dikirim ke Apps Script
    );

    // 5. Tangani Respons dari Server
    if (result.success) {
      // Jika server berhasil, tampilkan pesan sukses final
      showStatusMessage("Revisi jadwal berhasil disimpan!", "success");
      localStorage.setItem("bookingUpdated", Date.now().toString());
      // UI sudah diperbarui, tidak perlu loadBookingHistory() lagi
      // Cukup perbarui statistik
      updateStatistics();
    } else {
      // Jika server mengembalikan error, lempar error untuk ditangkap blok catch
      throw new Error(result.error || "Gagal melakukan revisi dari server");
    }
  } catch (error) {
    console.error("Error revisi jadwal:", error);

    // 6. Rollback: Kembalikan data ke kondisi semula jika terjadi error
    if (dataIndex !== -1 && originalBookingData) {
      showStatusMessage(
        `Gagal melakukan revisi: ${error.message}`,
        "error",
        8000
      );
      currentData[dataIndex] = originalBookingData;

      const filteredIndex = filteredData.findIndex(
        (item) => item.rowIndex == bookingId
      );
      if (filteredIndex !== -1) {
        filteredData[filteredIndex] = originalBookingData;
      }

      // Perbarui tabel HTML lagi untuk menampilkan data lama
      updateTable();
    }
  } finally {
    // 7. Reset Tombol: Apapun hasilnya (sukses atau gagal), pastikan tombol kembali normal
    if (submitBtn) {
      submitBtn.disabled = false;
      const btnText = submitBtn.querySelector(".btn-text");
      const spinner = submitBtn.querySelector(".loading-spinner");
      if (btnText) btnText.textContent = "Simpan Revisi";
      if (spinner) spinner.style.display = "none";
    }
  }
}

// Cancel Modal Functions
function openCancelModal(bookingId) {
  const cancelModal = document.getElementById("cancelModal");
  if (cancelModal) {
    // Remove classes first
    cancelModal.style.display = "flex";

    setTimeout(() => {
      cancelModal.classList.add("show");
    }, 10);
  }

  // Cari booking berdasarkan rowIndex atau id
  const booking = currentData.find(
    (item) => item.rowIndex == bookingId || item.id == bookingId
  );

  if (!booking) {
    showStatusMessage("Data booking tidak ditemukan!", "error");
    return;
  }

  currentBookingForCancellation = booking;

  // Fill booking details
  const cancelBookingDetails = document.getElementById("cancelBookingDetails");
  if (cancelBookingDetails) {
    cancelBookingDetails.innerHTML = `
      <h5>Detail Booking</h5>
      <p><strong>ID:</strong> ${booking.rowIndex || booking.id}</p>
      <p><strong>Tanggal:</strong> ${booking.tanggal}</p>
      <p><strong>Waktu:</strong> ${booking.sesiWaktu}</p>
      <p><strong>Status:</strong> ${booking.status}</p>
      ${
        booking.catatan
          ? `<p><strong>Catatan:</strong> ${booking.catatan}</p>`
          : ""
      }
    `;
  }

  // Reset textarea
  const cancelReason = document.getElementById("cancelReason");
  if (cancelReason) {
    cancelReason.value = "";
  }
}

function closeCancelModal() {
  const cancelModal = document.getElementById("cancelModal");
  if (cancelModal) {
    cancelModal.classList.remove("show");

    // --- TAMBAHKAN INI ---
    const cancelReason = document.getElementById("cancelReason");
    if (cancelReason) {
      cancelReason.value = ""; // Membersihkan textarea alasan pembatalan
    }
    // --------------------

    setTimeout(() => {
      cancelModal.style.display = "none";
    }, 300);
  }
  currentBookingForCancellation = null;
}

async function confirmCancellation() {
  console.log("Confirming cancellation");

  if (!currentBookingForCancellation) return;

  const confirmBtn = document.getElementById("confirmCancelBtn");
  const cancelReasonInput = document.getElementById("cancelReason");
  const reason = cancelReason ? cancelReason.value.trim() : "";

  if (!reason) {
    showStatusMessage("Alasan pembatalan wajib diisi", "error");
    cancelReasonInput.focus();
    return;
  }

  // Tampilkan status loading pada tombol
  if (confirmBtn) {
    confirmBtn.disabled = true;
    const btnText = confirmBtn.querySelector(".btn-text");
    const spinner = confirmBtn.querySelector(".loading-spinner");
    if (btnText) btnText.textContent = "Membatalkan...";
    if (spinner) spinner.style.display = "block";
  }

  try {
    const bookingId =
      currentBookingForCancellation.rowIndex ||
      currentBookingForCancellation.id;
    const updateData = {
      reason: reason || "Dibatalkan oleh supplier", // Pastikan reason tidak kosong
    };

    // Kirim request ke backend untuk membatalkan
    const result = await updateBooking(
      bookingId,
      currentSupplierCode,
      updateData,
      "cancelBooking"
    );

    // Jika backend berhasil memproses
    if (result.success) {
      // --- PERUBAHAN UTAMA DIMULAI DI SINI ---

      // 1. Cari index data yang dibatalkan di array lokal
      const dataIndex = currentData.findIndex(
        (item) => item.rowIndex == bookingId
      );

      // 2. Jika data ditemukan, perbarui status dan catatannya
      if (dataIndex !== -1) {
        const originalNotes = currentData[dataIndex].catatan || "";
        currentData[dataIndex].status = "❌ Cancelled"; // Status baru
        currentData[dataIndex].catatan =
          originalNotes +
          (originalNotes ? " | " : "") +
          `[CANCELLED: ${reason}]`;
      }

      // (Opsional) Perbarui juga di filteredData jika Anda menggunakannya
      const filteredIndex = filteredData.findIndex(
        (item) => item.rowIndex == bookingId
      );
      if (filteredIndex !== -1) {
        filteredData[filteredIndex] = { ...currentData[dataIndex] };
      }

      // 3. Gambar ulang tabel dengan data yang sudah diperbarui
      updateTable();

      // 4. Tutup modal dan tampilkan pesan sukses
      closeCancelModal();
      showStatusMessage("Booking berhasil dibatalkan!", "success");

      // Baris setTimeout(loadBookingHistory) sudah dihapus
      // --- AKHIR PERUBAHAN ---
    } else {
      // Jika backend mengembalikan error
      throw new Error(result.error || "Gagal membatalkan booking");
    }
  } catch (error) {
    console.error("Error membatalkan booking:", error);
    showStatusMessage(`Gagal membatalkan booking: ${error.message}`, "error");
  } finally {
    // Selalu kembalikan tombol ke keadaan normal
    if (confirmBtn) {
      confirmBtn.disabled = false;
      const btnText = confirmBtn.querySelector(".btn-text");
      const spinner = confirmBtn.querySelector(".loading-spinner");
      if (btnText) btnText.textContent = "Ya, Batalkan Booking";
      if (spinner) spinner.style.display = "none";
    }
  }
}

// ===== TAMBAHAN JAVASCRIPT UNTUK MODAL IMPROVEMENTS =====
// Fungsi untuk cek jadwal yang tersedia
function checkAvailableSchedule() {
  window.open(
    "https://docs.google.com/spreadsheets/d/1hM0e57A0CCTB1Lnw-sO4lSI8JS9pkU6EEf24eZKI7hE/edit?usp=sharing",
    "_blank"
  );
}

// ===== PAGINATION =====
function updatePagination() {
  console.log("updatePagination called:", {
    filteredDataLength: filteredData.length,
    itemsPerPage: itemsPerPage,
    currentPage: currentPage,
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  console.log("Pagination calculation:", {
    totalPages: totalPages,
    shouldShowPagination: totalPages > 1,
  });

  // Update button states
  if (elements.btnPrevPage) {
    elements.btnPrevPage.disabled = currentPage <= 1;
  }

  if (elements.btnNextPage) {
    elements.btnNextPage.disabled = currentPage >= totalPages;
  }

  // Update page info dengan informasi lebih detail
  if (elements.pageInfo) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredData.length);

    elements.pageInfo.textContent = `Menampilkan ${startItem}-${endItem} dari ${filteredData.length} data (Halaman ${currentPage} dari ${totalPages})`;
  }

  // Show/hide pagination container
  if (elements.paginationContainer) {
    if (totalPages > 1) {
      elements.paginationContainer.style.display = "flex";
      console.log("Showing pagination container");
    } else {
      elements.paginationContainer.style.display = "none";
      console.log("Hiding pagination container");
    }
  }
}

function changePage(newPage) {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  console.log("changePage called:", {
    newPage: newPage,
    totalPages: totalPages,
    currentPage: currentPage,
  });

  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    updateTable();
    updatePagination();

    // Scroll to table
    if (elements.historyTable) {
      elements.historyTable.scrollIntoView({ behavior: "smooth" });
    }
  }
}

// ===== UI STATE MANAGEMENT =====
function showLoadingState() {
  if (elements.loadingState) elements.loadingState.style.display = "block";
  if (elements.emptyState) elements.emptyState.style.display = "none";
  if (elements.historyTable) elements.historyTable.style.display = "none";
}

function showEmptyState() {
  if (elements.loadingState) elements.loadingState.style.display = "none";
  if (elements.emptyState) elements.emptyState.style.display = "block";
  if (elements.historyTable) elements.historyTable.style.display = "none";
}

function showHistoryTable() {
  if (elements.loadingState) elements.loadingState.style.display = "none";
  if (elements.emptyState) elements.emptyState.style.display = "none";
  if (elements.historyTable) elements.historyTable.style.display = "block";
}

function updateSupplierDisplay() {
  if (elements.supplierDisplay) {
    elements.supplierDisplay.textContent = `Supplier: ${currentSupplierCode}`;
  }
}

// ===== AUTO REFRESH =====
function setupAutoRefresh() {
  setInterval(() => {
    if (document.visibilityState === "visible") {
      checkForBookingUpdates();
    }
  }, 30000);

  let lastActivity = Date.now();

  document.addEventListener("click", () => {
    lastActivity = Date.now();
  });

  setInterval(() => {
    if (
      document.visibilityState === "visible" &&
      Date.now() - lastActivity < 5 * 60 * 1000
    ) {
      refreshData();
    }
  }, 5 * 60 * 1000);
}

function checkForBookingUpdates() {
  const latestUpdate = localStorage.getItem("bookingUpdated") || "0";
  if (latestUpdate !== lastBookingUpdate && latestUpdate !== "0") {
    lastBookingUpdate = latestUpdate;
    showStatusMessage("Booking baru terdeteksi! Memuat ulang data...", "info");
    setTimeout(() => loadBookingHistory(), 1000);
  }
}

// ===== STATUS MESSAGES =====
// Variabel global untuk mengontrol timeout
let statusMessageTimeout;

function showStatusMessage(message, type = "info", duration = 5000) {
  const statusEl = document.getElementById("statusMessage");
  if (!statusEl) return;

  // 1. Hapus timeout sebelumnya jika ada
  clearTimeout(statusMessageTimeout);

  // 2. Set pesan dan class baru
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`; // Reset class

  // 3. Tampilkan elemen dan paksa browser menggambar ulang
  statusEl.style.display = 'block';
  void statusEl.offsetWidth; // Trik untuk memastikan transisi berjalan

  // 4. Tambahkan class 'show' untuk memicu animasi
  statusEl.classList.add('show');

  // 5. Set timeout baru untuk menyembunyikan notifikasi
  statusMessageTimeout = setTimeout(() => {
    statusEl.classList.remove('show');
    
    // Sembunyikan elemen setelah animasi selesai (sesuai durasi transisi di CSS)
    setTimeout(() => {
        if (!statusEl.classList.contains('show')) { // Pastikan tidak ada notif baru
            statusEl.style.display = 'none';
        }
    }, 500); // Sesuaikan dengan durasi transisi di CSS Anda

  }, duration);
}

// ===== UTILITY FUNCTIONS =====
function formatDate(date) {
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateForInput(date) {
  return date.toISOString().split("T")[0];
}

function parseDate(dateString) {
  if (!dateString || dateString === "-") return null;

  console.log("Parsing date:", dateString);

  let parsedDate = null;

  // Format: YYYY-MM-DD (ISO format) - PERBAIKAN TIMEZONE
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Tambahkan waktu lokal untuk menghindari UTC conversion
    parsedDate = new Date(dateString + "T00:00:00");
  }
  // Format: DD/MM/YYYY
  else if (dateString.includes("/")) {
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      parsedDate = new Date(year, month, day);
    }
  }
  // Format: DD-MM-YYYY
  else if (dateString.includes("-") && dateString.length <= 10) {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // Format YYYY-MM-DD sudah dihandle di atas
        parsedDate = new Date(dateString + "T00:00:00");
      } else {
        // Format DD-MM-YYYY
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        parsedDate = new Date(year, month, day);
      }
    }
  }
  // Format lainnya
  else {
    parsedDate = new Date(dateString);
  }

  // Validasi hasil parsing
  if (parsedDate && !isNaN(parsedDate.getTime())) {
    console.log("Successfully parsed:", dateString, "to:", parsedDate);
    return parsedDate;
  } else {
    console.warn("Failed to parse date:", dateString);
    return null;
  }
}

function truncateText(text, maxLength) {
  if (!text) return "-";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Mengecek apakah sebuah status booking masih bisa direvisi atau dibatalkan.
 * @param {object} item Objek data booking.
 * @returns {object} Objek berisi boolean { canRevise: bool, canCancel: bool }.
 */
function isBookingActionable(item) {
  if (!item) return { canRevise: false, canCancel: false };

  const statusLower = String(item.status || '').toLowerCase();
  
  // Jika status masih menunggu, nonaktifkan semua tombol
  if (statusLower.includes('menunggu diproses')) {
    return { canRevise: false, canCancel: false };
  }

  // --- LOGIKA BARU: Jika sudah direvisi, tombol revisi hilang ---
  if (statusLower.includes('revised')) {
    // Tombol revisi hilang, tapi tombol cancel tetap mengikuti aturan 24 jam
    const result = { canRevise: false, canCancel: true }; 
    try {
      const bookingStartDateTime = new Date(`${item.tanggal}T${item.sesiWaktu.split('-')[0].trim()}:00`);
      if (isNaN(bookingStartDateTime.getTime())) return { canRevise: false, canCancel: false };
      
      const hoursDifference = (bookingStartDateTime.getTime() - new Date().getTime()) / 3600000;
      if (hoursDifference <= 24 || bookingStartDateTime < new Date()) {
        result.canCancel = false;
      }
    } catch(e) { result.canCancel = false; }
    return result;
  }
  // --- AKHIR LOGIKA BARU ---

  const noteLower = String(item.catatan || '').toLowerCase();
  const nonActionableKeywords = ['rejected', 'gagal', 'selesai', 'completed', 'done', 'conflict', 'cancelled', 'canceled', '✅', '❌'];
  
  if (nonActionableKeywords.some(keyword => statusLower.includes(keyword)) || noteLower.includes('[cancelled:')) {
    return { canRevise: false, canCancel: false };
  }
  
  // Logika aturan 24 jam untuk booking normal
  const result = { canRevise: true, canCancel: true };
  try {
    const bookingEndDateTime = new Date(`${item.tanggal}T${item.sesiWaktu.split('-')[1].trim()}:00`);
    if (isNaN(bookingEndDateTime.getTime())) throw new Error("Gagal parse waktu berakhir.");
    
    const now = new Date();
    if (bookingEndDateTime < now) {
      return { canRevise: false, canCancel: false };
    }
    
    const bookingStartDateTime = new Date(`${item.tanggal}T${item.sesiWaktu.split('-')[0].trim()}:00`);
    if (isNaN(bookingStartDateTime.getTime())) throw new Error("Gagal parse waktu mulai.");
    const hoursDifference = (bookingStartDateTime.getTime() - now.getTime()) / 3600000;
    if (hoursDifference <= 24) {
      result.canCancel = false;
    }
  } catch (e) {
    console.error("Error during actionable check:", e.message);
    return { canRevise: false, canCancel: false };
  }
  return result;
}

/**
 * Mengklasifikasikan status booking ke dalam kategori yang ditentukan.
 * @param {object} item - Objek data booking.
 * @returns {string} Kategori status: 'selesai', 'dibatalkan', 'terdekat', atau 'terjadwal'.
 */
function getClassifiedStatus(item) {
  const noteLower = String(item.catatan || "").toLowerCase();
  const statusLower = String(item.status || "").toLowerCase();

  // Kategori 1: Dibatalkan
  if (statusLower.includes("cancel") || noteLower.includes("[cancelled:")) {
    return "dibatalkan";
  }

  // Kategori 2: Sudah Selesai (berdasarkan status atau waktu)
  if (statusLower.includes("selesai") || statusLower.includes("completed")) {
    return "selesai";
  }

  // Cek berdasarkan waktu jika statusnya belum final
  try {
    const bookingEndTimeStr = item.sesiWaktu.split("-")[1].trim();
    const bookingEndDateTime = new Date(
      `${item.tanggal}T${bookingEndTimeStr}:00`
    );
    const now = new Date();

    if (bookingEndDateTime < now) {
      return "selesai";
    }

    // Kategori 3 & 4: Terdekat vs Terjadwal
    const bookingStartTimeStr = item.sesiWaktu.split("-")[0].trim();
    const bookingStartDateTime = new Date(
      `${item.tanggal}T${bookingStartTimeStr}:00`
    );
    const hoursDifference =
      (bookingStartDateTime.getTime() - now.getTime()) / 3600000;

    if (hoursDifference > 0 && hoursDifference <= 24) {
      return "terdekat";
    } else {
      return "terjadwal";
    }
  } catch (e) {
    return "terjadwal"; // Anggap terjadwal jika ada error parsing
  }
}

// ===== GLOBAL FUNCTIONS =====
window.openRevisionModal = openRevisionModal;
window.closeRevisionModal = closeRevisionModal;
window.submitRevision = submitRevision;
window.openCancelModal = openCancelModal;
window.closeCancelModal = closeCancelModal;
window.confirmCancellation = confirmCancellation;

// ===== ERROR HANDLING =====
window.addEventListener("error", function (e) {
  console.error("JavaScript Error:", e.error);
  showStatusMessage("Terjadi kesalahan pada sistem.", "error");
});
