document.addEventListener("DOMContentLoaded", function () {
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

  // === AUTOCOMPLETE YANG DIOPTIMALKAN ===
  // list kode supplier (hanya untuk fallback jika tidak ada session)
  const supplierList = Object.keys(supplierDatabase);

  // Global variables
  let itemList = [];
  let itemSearchIndex = {}; // Index untuk pencarian lebih cepat
  const MAX_SUGGESTIONS = 10;
  const MIN_SEARCH_LENGTH = 1;
  
  // DOM Elements
  const inputBarang = document.getElementById("kode-barang");
  const inputSupplier = document.getElementById("kode-supplier");
  
  // PENTING: Setiap input memiliki suggestion box sendiri
  const suggestionBoxBarang = inputBarang.parentElement.parentElement.querySelector('.suggestion-box');
  const suggestionListBarang = suggestionBoxBarang.querySelector('ul');
  
  const suggestionBoxSupplier = inputSupplier.parentElement.parentElement.querySelector('.suggestion-box');
  const suggestionListSupplier = suggestionBoxSupplier.querySelector('ul');
  
  console.log("DOM Elements:", {
    inputBarang, 
    inputSupplier,
    suggestionBoxBarang,
    suggestionListBarang,
    suggestionBoxSupplier,
    suggestionListSupplier
  });

  // === AUTO-FILL KODE SUPPLIER DARI SESSION LOGIN ===
  function initializeSupplierCode() {
    if (loggedInSupplierCode) {
      console.log("Auto-filling supplier code:", loggedInSupplierCode);
      inputSupplier.value = loggedInSupplierCode;
      
      // Disable input supplier karena sudah ditentukan dari login
      inputSupplier.disabled = true;
      inputSupplier.style.backgroundColor = '#475569'; // Warna lebih gelap untuk menunjukkan disabled
      inputSupplier.style.cursor = 'not-allowed';
      
      // Tambahkan tooltip atau info untuk user
      inputSupplier.title = `Kode supplier sudah sesuai dengan login Anda: ${loggedInSupplierName || loggedInSupplierCode}`;
      
      // Hide suggestion box untuk supplier karena sudah fixed
      if (suggestionBoxSupplier) {
        suggestionBoxSupplier.style.display = 'none !important';
      }
      
      console.log("Supplier code initialized:", {
        code: loggedInSupplierCode,
        name: loggedInSupplierName
      });
    } else {
      console.warn("No supplier code found in session. User might not be logged in.");
      // Tetap enable autocomplete jika tidak ada session (fallback)
      inputSupplier.disabled = false;
    }
  }
  
  // Fetch data dan buat indeks pencarian
  function fetchItemData() {
    console.log("Fetching item data...");
    return fetch('baan-kode.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        itemList = data;
        console.log(`Loaded ${itemList.length} items`);
        
        // Buat indeks pencarian untuk kecepatan
        createSearchIndex(data);
        return data;
      })
      .catch(error => {
        console.error('Error loading JSON data:', error);
        // Gunakan data dummy jika gagal load untuk testing
        itemList = [
          { Item: "KIBXXX-12345" },
          { Item: "IMEXXX-67890" }
        ];
        // Tampilkan pesan error ke pengguna
        showErrorMessage('Gagal memuat data kode barang: ' + error.message);
      });
  }
  
  // Buat indeks pencarian berdasarkan awalan karakter
  function createSearchIndex(data) {
    // Membangun indeks pencarian untuk akses cepat
    data.forEach(item => {
      if (!item.Item) {
        console.warn("Item doesn't have 'Item' property:", item);
        return;
      }
      
      const itemCode = item.Item.toLowerCase();
      // Indeks berdasarkan 2-3 karakter pertama
      for (let i = 1; i <= 3; i++) {
        if (itemCode.length >= i) {
          const prefix = itemCode.substring(0, i);
          if (!itemSearchIndex[prefix]) {
            itemSearchIndex[prefix] = [];
          }
          itemSearchIndex[prefix].push(item);
        }
      }
    });
    console.log('Search index created');
  }
  
  // Fungsi untuk mencari item dengan pendekatan yang dioptimalkan
  function searchItems(query) {
    if (!query || query.length < MIN_SEARCH_LENGTH) {
      return itemList.slice(0, MAX_SUGGESTIONS); // Tampilkan beberapa item pertama saja
    }
    
    query = query.toLowerCase();
    
    // Coba cari dari indeks terlebih dahulu (lebih cepat)
    const prefix = query.substring(0, Math.min(3, query.length));
    let candidateItems = itemSearchIndex[prefix] || [];
    
    // Filter lebih lanjut jika query lebih dari 3 karakter
    if (query.length > 3) {
      candidateItems = candidateItems.filter(item => 
        item.Item.toLowerCase().includes(query)
      );
    }
    
    // Jika tidak ada hasil dari indeks, atau indeks belum siap, gunakan pencarian linear
    if (candidateItems.length === 0) {
      candidateItems = itemList.filter(item => 
        item.Item && item.Item.toLowerCase().includes(query)
      );
    }
    
    return candidateItems.slice(0, MAX_SUGGESTIONS);
  }
  
  // Debounce function untuk mengurangi jumlah pencarian
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }
  
  // Render fungsi untuk kode barang
  function renderSuggestionBarang(filteredItems) {
    console.log("Rendering barang suggestions:", filteredItems?.length);
    
    if (filteredItems && filteredItems.length > 0) {
      let htmlSuggestions = filteredItems
        .map(item => {
          if (!item.Item) return '';
          return `<li class="suggestion-item">${item.Item}</li>`;
        })
        .filter(html => html !== '') // Filter out empty strings
        .join('');
      
      suggestionListBarang.innerHTML = htmlSuggestions;
      suggestionBoxBarang.style.display = 'block';
    } else {
      suggestionBoxBarang.style.display = 'none';
      suggestionListBarang.innerHTML = '';
    }
  }
  
  // Render fungsi untuk supplier (hanya jika tidak ada session login)
  function renderSuggestionSupplier(filteredSuppliers) {
    // Jangan tampilkan suggestion jika sudah ada supplier dari login
    if (loggedInSupplierCode) {
      return;
    }
    
    console.log("Rendering supplier suggestions:", filteredSuppliers?.length);
    
    if (filteredSuppliers && filteredSuppliers.length > 0) {
      let htmlSuggestions = filteredSuppliers
        .map(supplierCode => {
          const supplierName = supplierDatabase[supplierCode]?.name || '';
          return `<li class="suggestion-item" data-code="${supplierCode}">
            ${supplierCode} - ${supplierName}
          </li>`;
        })
        .join('');
      
      suggestionListSupplier.innerHTML = htmlSuggestions;
      suggestionBoxSupplier.style.display = 'block';
    } else {
      suggestionBoxSupplier.style.display = 'none';
      suggestionListSupplier.innerHTML = '';
    }
  }
  
  // Event handlers dengan delay untuk menghindari konflik dengan event click
  const handleBarangInput = debounce(function() {
    const inputVal = inputBarang.value.trim();
    const filteredItems = searchItems(inputVal);
    renderSuggestionBarang(filteredItems);
  }, 150); // 150ms debounce
  
  const handleSupplierInput = debounce(function() {
    // Jangan proses input jika supplier sudah ditentukan dari login
    if (loggedInSupplierCode) {
      return;
    }
    
    const inputVal = inputSupplier.value.trim().toLowerCase();
    const filteredSuppliers = supplierList.filter(supplier => 
      supplier.toLowerCase().includes(inputVal) || 
      (supplierDatabase[supplier]?.name || '').toLowerCase().includes(inputVal)
    );
    renderSuggestionSupplier(filteredSuppliers);
  }, 150); // 150ms debounce
  
  // Event listener untuk click pada suggestion kode barang
  suggestionBoxBarang.addEventListener('click', function(e) {
    e.stopPropagation(); // Hindari event bubbling ke document
    
    if (e.target.classList.contains('suggestion-item')) {
      inputBarang.value = e.target.textContent;
      suggestionBoxBarang.style.display = 'none';
      console.log("Selected item:", e.target.textContent);
    }
  });
  
  // Event listener untuk click pada suggestion supplier (hanya jika tidak ada session)
  if (!loggedInSupplierCode) {
    suggestionBoxSupplier.addEventListener('click', function(e) {
      e.stopPropagation(); // Hindari event bubbling ke document
      
      if (e.target.classList.contains('suggestion-item')) {
        const supplierCode = e.target.dataset.code;
        inputSupplier.value = supplierCode;
        suggestionBoxSupplier.style.display = 'none';
        console.log("Selected supplier:", supplierCode);
      }
    });
  }
  
  // Tutup suggestion box ketika klik diluar box
  document.addEventListener('click', function(e) {
    // Hide suggestion box for kode barang if click is outside
    if (e.target !== inputBarang && !suggestionBoxBarang.contains(e.target)) {
      suggestionBoxBarang.style.display = 'none';
    }
    
    // Hide suggestion box for supplier if click is outside (hanya jika tidak ada session)
    if (!loggedInSupplierCode && e.target !== inputSupplier && !suggestionBoxSupplier.contains(e.target)) {
      suggestionBoxSupplier.style.display = 'none';
    }
  });
  
  // Gunakan setTimeout untuk memisahkan event focus dan event click
  inputBarang.addEventListener('focus', function() {
    setTimeout(() => {
      if (itemList.length > 0) {
        renderSuggestionBarang(itemList.slice(0, MAX_SUGGESTIONS));
      }
    }, 50);
  });
  
  // Focus handler untuk supplier (hanya jika tidak ada session)
  if (!loggedInSupplierCode) {
    inputSupplier.addEventListener('focus', function() {
      setTimeout(() => {
        renderSuggestionSupplier(supplierList);
      }, 50);
    });
  }
  
  // Input events
  inputBarang.addEventListener('input', handleBarangInput);
  
  // Input event untuk supplier hanya jika tidak ada session
  if (!loggedInSupplierCode) {
    inputSupplier.addEventListener('input', handleSupplierInput);
  }
  
  // Menghentikan event propagation ketika klik di dalam input
  inputBarang.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  if (!loggedInSupplierCode) {
    inputSupplier.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
  
  // Utility function untuk menampilkan error
  function showErrorMessage(message) {
    console.error(message);
    // Implementasi sesuai UI - misalnya alert atau toast notification
    // Anda bisa menambahkan UI notification di sini
  }
  
  // === SAVE INPUT ===
  document.getElementById("save-input").addEventListener("click", function () {
    // Ambil nilai dari input fields
    let kodeBarang = document.getElementById("kode-barang").value;
    let kodeSupplier = document.getElementById("kode-supplier").value;
    let noSuratJalan = document.getElementById("no-surat-jalan").value;
    let noPo = document.getElementById("no-po").value;
    let qty = document.getElementById("qty").value;
    let satuan = document.getElementById("satuan").value;

    // Validasi input
    if (!kodeBarang || !kodeSupplier || !noSuratJalan || !noPo || !qty || !satuan) {
      alert("Harap isi semua data!");
      return;
    }

    // Validasi kode supplier
    if (!kodeSupplier.startsWith("SPP")) {
      alert("Kode Supplier harus diawali dengan 'SPP'!");
      return;
    }

    // Validasi kode supplier harus sesuai dengan yang login (jika ada session)
    if (loggedInSupplierCode && kodeSupplier !== loggedInSupplierCode) {
      alert(`Kode Supplier harus sesuai dengan akun login Anda: ${loggedInSupplierCode}`);
      return;
    }

    // Simpan ke localStorage
    let savedData = JSON.parse(localStorage.getItem("savedData")) || [];

    if (savedData.length >= 3) {
      alert("Maksimal hanya 3 entri yang boleh disimpan!");
      return;
    }

    // Tambahkan informasi supplier name jika ada
    const supplierName = loggedInSupplierName || supplierDatabase[kodeSupplier]?.name || '';
    
    const dataToSave = {
      kodeBarang, 
      kodeSupplier, 
      supplierName,
      noSuratJalan, 
      noPo, 
      qty, 
      satuan,
      timestamp: new Date().toISOString(),
      loginSession: loggedInSupplierCode ? true : false
    };

    savedData.push(dataToSave);
    localStorage.setItem("savedData", JSON.stringify(savedData));

    alert(`Data berhasil disimpan untuk ${supplierName ? `${kodeSupplier} - ${supplierName}` : kodeSupplier}!`);

    // Clear input (kecuali kode supplier jika dari session login)
    document.getElementById("kode-barang").value = "";
    if (!loggedInSupplierCode) {
      document.getElementById("kode-supplier").value = "";
    }
    document.getElementById("no-surat-jalan").value = "";
    document.getElementById("no-po").value = "";
    document.getElementById("qty").value = "";
    document.getElementById("satuan").value = "";
  });
  
  // === INITIALIZATION ===
  console.log("Initializing autocomplete...");
  
  // Initialize supplier code dari session login
  initializeSupplierCode();
  
  // Initialize item data
  fetchItemData();
  
  // Debug info
  console.log("Session Info:", {
    supplierCode: loggedInSupplierCode,
    supplierName: loggedInSupplierName,
    isLoggedIn: localStorage.getItem("isLoggedIn")
  });
});