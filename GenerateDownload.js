document.addEventListener("DOMContentLoaded", function () {
  const savedDataList = document.getElementById("saved-data-list");
  const qrCodeContainer = document.getElementById("qr-image"); // Kontainer QR Code
  const generateAllBtn = document.getElementById("generate-qr-code"); // Tombol Generate QR
  const downloadBtn = document.getElementById("download-qr-code"); // Tombol Download QR

  function displayData() {
    savedDataList.innerHTML = ""; // Kosongkan tampilan sebelum menampilkan ulang
    qrCodeContainer.innerHTML = ""; // Kosongkan QR Code sebelumnya

    let savedData = JSON.parse(localStorage.getItem("savedData")) || [];

    if (savedData.length === 0) {
      savedDataList.innerHTML = "<p>Belum ada data tersimpan.</p>";
      return;
    }

    savedData.forEach((data, index) => {
      const dataElement = document.createElement("div");
      dataElement.innerHTML = `
      <div class="data-card">
      <p><strong>Data ${index + 1}:</strong></p>
      <p>Kode Barang: ${data.kodeBarang}</p>
      <p>Nama Supplier: ${data.namaSupplier}</p>
      <p>No Surat Jalan: ${data.noSuratJalan}</p> 
      <p>No PO: ${data.noPo}</p>
      <p>QTY: ${data.qty}</p>
      <p>Satuan: ${data.satuan}</p>
      <button onclick="deleteData(${index})" class="hapus-button">Hapus</button>
      </div>
      `;
      savedDataList.appendChild(dataElement);
    });
  }

  // Fungsi untuk generate QR Code
  function generateAllQRCode() {
    qrCodeContainer.innerHTML = ""; // Kosongkan QR Code sebelumnya
    let savedData = JSON.parse(localStorage.getItem("savedData")) || [];

    if (savedData.length === 0) {
      alert("Tidak ada data untuk dibuat QR Code!");
      return;
    }

    // Gabungkan semua data menjadi satu string
    let qrData = savedData
      .map(
        (data) =>
          `${data.kodeBarang} | ${data.namaSupplier} | ${data.noSuratJalan} | ${data.noPo} | ${data.qty} | ${data.satuan}`
      )
      .join(";\n"); // Pisahkan setiap data dengan baris baru

    // Hapus QR Code lama jika ada
    qrCodeContainer.innerHTML = "";

    // Buat elemen baru untuk menampung QR Code
    const qrDiv = document.createElement("div");
    qrDiv.id = "generated-qr";
    qrCodeContainer.appendChild(qrDiv);

    // Generate QR Code
    const qrCode = new QRCode(qrDiv, {
      text: qrData,
      width: 175,
      height: 175,
    });

    // Tunggu QR Code selesai dibuat sebelum mengambil gambar
    setTimeout(() => {
      const qrImg = qrDiv.querySelector("img"); // Ambil elemen img yang dibuat oleh QRCode.js

      if (qrImg) {
        qrImg.id = "qr-download"; // Tambahkan ID untuk mempermudah seleksi
        downloadBtn.disabled = false; // Aktifkan tombol download
      }
    }, 500);
  }

  // Fungsi untuk mendownload QR Code sebagai gambar
  function downloadQRCode() {
    let qrImg = document.querySelector("#qr-download"); // Ambil gambar QR Code

    if (!qrImg) {
      alert("Silakan buat QR Code terlebih dahulu!");
      return;
    }

    let imgURL = qrImg.src; // Ambil src dari img
    let downloadLink = document.createElement("a");
    downloadLink.href = imgURL;
    downloadLink.download = "qrcode.png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  // Fungsi untuk menghapus data tertentu
  window.deleteData = function (index) {
    let savedData = JSON.parse(localStorage.getItem("savedData")) || [];
    savedData.splice(index, 1);
    localStorage.setItem("savedData", JSON.stringify(savedData));
    displayData();
  };

  // Fungsi untuk menghapus semua data
  window.clearAllData = function () {
    if (confirm("Apakah Anda yakin ingin menghapus semua data?")) {
      localStorage.removeItem("savedData");
      displayData();
    }
  };

  // Event listener untuk tombol "Generate QR Code"
  generateAllBtn.addEventListener("click", generateAllQRCode);

  // Event listener untuk tombol "Download QR Code"
  downloadBtn.addEventListener("click", downloadQRCode);

  // Panggil fungsi untuk menampilkan data saat halaman dimuat
  displayData();
});
