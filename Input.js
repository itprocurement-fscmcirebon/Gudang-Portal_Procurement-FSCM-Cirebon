document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("save-input").addEventListener("click", function () {
    // Ambil nilai dari input fields
    let kodeBarang = document.getElementById("kode-barang").value;
    let namaSupplier = document.getElementById("nama-supplier").value;
    let noSuratJalan = document.getElementById("no-surat-jalan").value;
    let noPo = document.getElementById("no-po").value;
    let qty = document.getElementById("qty").value;
    let satuan = document.getElementById("satuan").value;

    
    // Validasi input (opsional)
    if (!kodeBarang || !namaSupplier || !noSuratJalan || !noPo || !qty || !satuan) {
      alert("Harap isi semua data!");
      return;
    }
    
    // Validasi Kode Supplier
    if (!namaSupplier.startsWith("SPP")) {
      alert("Kode Supplier harus diawali dengan 'SPP'!");
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
      namaSupplier,
      noSuratJalan,
      noPo, 
      qty,
      satuan,
    });

    // Simpan kembali ke localStorage
    localStorage.setItem("savedData", JSON.stringify(savedData));

    // Beri konfirmasi
    alert("Data berhasil disimpan!");

    // Kosongkan input setelah menyimpan
    document.getElementById("kode-barang").value = "";
    document.getElementById("nama-supplier").value = "";
    document.getElementById("no-surat-jalan").value = "";
    document.getElementById("no-po").value = "";
    document.getElementById("qty").value = "";
    document.getElementById("satuan").value = "";
  });
});
