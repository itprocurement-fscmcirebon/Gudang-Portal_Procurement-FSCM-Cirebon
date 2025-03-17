document.addEventListener("DOMContentLoaded", function() {
    const kode_barang = document.querySelector('.kode-barang');
    const nama_barang = document.querySelector('.nama-barang');
    const nama_supplier = document.querySelector('.nama-supplier');
    const no_surat_jalan = document.querySelector('.no-surat-jalan');
    const no_po = document.querySelector('.no-po');
    const qty = document.querySelector('.qty');
    const generateCodeButton = document.querySelector('.generate-qr-code');
    const downloadButton = document.querySelector('.download-qr-code');
    let qrImage = document.querySelector('.qr-image');
    const loading = document.querySelector('.loading');

    

    downloadButton.disabled = true;

    generateCodeButton.onclick = async () => {
        qrImage.src = ''
        let kodeBarang = kode_barang.value;
        let namaBarang = nama_barang.value;
        let namaSupplier = nama_supplier.value;
        let noSuratJalan = no_surat_jalan.value;
        let noPo = no_po.value;
        let qtyValue = qty.value;
        let userData = `${kodeBarang} | ${namaBarang} | ${namaSupplier} | ${noSuratJalan} | ${noPo} | ${qtyValue}`;
        let imgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${userData}`;

        loading.style.display = 'block';
        if(kodeBarang !== '' && namaBarang !== '' && namaSupplier !== '' && noSuratJalan !== '' && noPo !== '' && qtyValue !== ''){
            let response = await fetch(imgSrc);
            let data = await response.blob();
            qrImage.src = URL.createObjectURL(data);
            loading.style.display = 'none';

            downloadButton.disabled = false;
        } else {
            alert('Tolong isi semua kolom yang ada!');
            loading.style.display = 'none';
        }
        URL.revokeObjectURL(data);
    };

    // Function to download the QR Code
    downloadButton.onclick = async() => {
        if (qrImage.src !== '') {
            let link = document.createElement("a");
            link.href = qrImage.src;
            link.download = "QR_Code.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Generate QR Code first!");
            return;
        }
    };
});
