document.addEventListener("DOMContentLoaded", function () {
  // === AUTOCOMPLETE YANG DIOPTIMALKAN ===
  // list kode supplier
  const supplierList = [
    "SPP000322", "SPP000471", "SPP000783", "SPP000774", "SPP000693",
    "SPP000563", "SPP000359", "SPP000659", "SPP000653", "SPP000072",
    "SPP000078", "SPP000449", "SPP000652", "SPP000618", "SPP000786",
    "SPP000772", "SPP000174", "SPP000362", "SPP000742", "SPP000729",
    "SPP000687", "SPP000775", "SPP000180", "SPP000635"
  ];

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
  
  // Render fungsi untuk supplier
  function renderSuggestionSupplier(filteredSuppliers) {
    console.log("Rendering supplier suggestions:", filteredSuppliers?.length);
    
    if (filteredSuppliers && filteredSuppliers.length > 0) {
      let htmlSuggestions = filteredSuppliers
        .map(item => `<li class="suggestion-item">${item}</li>`)
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
    const inputVal = inputSupplier.value.trim().toLowerCase();
    const filteredSuppliers = supplierList.filter(supplier => 
      supplier.toLowerCase().includes(inputVal)
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
  
  // Event listener untuk click pada suggestion supplier
  suggestionBoxSupplier.addEventListener('click', function(e) {
    e.stopPropagation(); // Hindari event bubbling ke document
    
    if (e.target.classList.contains('suggestion-item')) {
      inputSupplier.value = e.target.textContent;
      suggestionBoxSupplier.style.display = 'none';
      console.log("Selected supplier:", e.target.textContent);
    }
  });
  
  // Tutup suggestion box ketika klik diluar box
  document.addEventListener('click', function(e) {
    // Hide suggestion box for kode barang if click is outside
    if (e.target !== inputBarang && !suggestionBoxBarang.contains(e.target)) {
      suggestionBoxBarang.style.display = 'none';
    }
    
    // Hide suggestion box for supplier if click is outside
    if (e.target !== inputSupplier && !suggestionBoxSupplier.contains(e.target)) {
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
  
  inputSupplier.addEventListener('focus', function() {
    setTimeout(() => {
      renderSuggestionSupplier(supplierList);
    }, 50);
  });
  
  // Input events
  inputBarang.addEventListener('input', handleBarangInput);
  inputSupplier.addEventListener('input', handleSupplierInput);
  
  // Menghentikan event propagation ketika klik di dalam input
  inputBarang.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  inputSupplier.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  // Utility function untuk menampilkan error
  function showErrorMessage(message) {
    console.error(message);
    // Implementasi sesuai UI - misalnya alert atau toast notification
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

    // Simpan ke localStorage
    let savedData = JSON.parse(localStorage.getItem("savedData")) || [];

    if (savedData.length >= 3) {
      alert("Maksimal hanya 3 entri yang boleh disimpan!");
      return;
    }

    savedData.push({ kodeBarang, kodeSupplier, noSuratJalan, noPo, qty, satuan });
    localStorage.setItem("savedData", JSON.stringify(savedData));

    alert("Data berhasil disimpan!");

    // Clear input
    document.getElementById("kode-barang").value = "";
    document.getElementById("kode-supplier").value = "";
    document.getElementById("no-surat-jalan").value = "";
    document.getElementById("no-po").value = "";
    document.getElementById("qty").value = "";
    document.getElementById("satuan").value = "";
  });
  
  // Initialize - load data
  console.log("Initializing autocomplete...");
  fetchItemData();
});