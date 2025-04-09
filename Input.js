document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("save-input").addEventListener("click", function () {
    // Ambil nilai dari input fields
    let kodeBarang = document.getElementById("kode-barang").value;
    let namaBarang = document.getElementById("nama-barang").value;
    let namaSupplier = document.getElementById("nama-supplier").value;
    let noSuratJalan = document.getElementById("no-surat-jalan").value;
    let noPo = document.getElementById("no-po").value;
    let qty = document.getElementById("qty").value;

    // Validasi input (opsional)
    if (!kodeBarang || !namaBarang || !namaSupplier || !noSuratJalan || !noPo || !qty) {
      alert("Harap isi semua data!");
      return;
    }

    // Ambil data lama dari localStorage
    let savedData = JSON.parse(localStorage.getItem("savedData")) || [];

    // Cek apakah sudah ada 3 entri
    if (savedData.length >= 3) {
      alert("Maksimal hanya 3 entri yang boleh disimpan!");
      return;
    }

    // Tambahkan data baru ke array
    savedData.push({
      kodeBarang,
      namaBarang,
      namaSupplier,
      noSuratJalan,
      noPo,
      qty,
    });

    // Simpan kembali ke localStorage
    localStorage.setItem("savedData", JSON.stringify(savedData));

    // Beri konfirmasi
    alert("Data berhasil disimpan!");

    // Kosongkan input setelah menyimpan
    document.getElementById("kode-barang").value = "";
    document.getElementById("nama-barang").value = "";
    document.getElementById("nama-supplier").value = "";
    document.getElementById("no-surat-jalan").value = "";
    document.getElementById("no-po").value = "";
    document.getElementById("qty").value = "";
  });
});
