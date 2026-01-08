document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const queueNumberInput = document.getElementById('queueNumber');
    const operatorSelect = document.getElementById('operatorSelect');
    const callBtn = document.getElementById('callBtn');
    const resetBtn = document.getElementById('resetBtn');
    const increaseBtn = document.getElementById('increaseBtn');
    const decreaseBtn = document.getElementById('decreaseBtn');
    const displayQueueNumber = document.getElementById('displayQueueNumber');
    const displayOperator = document.getElementById('displayOperator');
    const historyList = document.getElementById('historyList');
    const operatorGrid = document.getElementById('operatorGrid');
    const currentCallDisplay = document.getElementById('currentCallDisplay');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const testVoiceBtn = document.getElementById('testVoiceBtn');
    const dateTimeElement = document.getElementById('dateTime');
    const operatorStatus = document.getElementById('operatorStatus');
    
    // Data aplikasi
    let queueHistory = [];
    let operators = [
        { id: 1, name: "Operator 1 - Pendaftaran", status: "available" },
        { id: 2, name: "Operator 2 - Verifikasi Dokumen", status: "available" },
        { id: 3, name: "Operator 3 - Tes Akademik", status: "busy" },
        { id: 4, name: "Operator 4 - Wawancara", status: "available" },
        { id: 5, name: "Operator 5 - Administrasi Keuangan", status: "available" },
        { id: 6, name: "Operator 6 - Pengambilan Formulir", status: "available" },
        { id: 7, name: "Operator 7 - Konsultasi Jurusan", status: "available" },
        { id: 8, name: "Operator 8 - Penyerahan Hasil", status: "busy" }
    ];
    
    // Variabel untuk Text-to-Speech
    let speechSynth = window.speechSynthesis;
    let isSpeaking = false;
    let currentVolume = 0.7;
    
    // Inisialisasi aplikasi
    function initApp() {
        updateDateTime();
        renderOperatorGrid();
        updateOperatorStatus();
        loadQueueHistory();
        
        // Update waktu setiap detik
        setInterval(updateDateTime, 1000);
        
        // Event listeners
        callBtn.addEventListener('click', callQueue);
        resetBtn.addEventListener('click', resetQueue);
        increaseBtn.addEventListener('click', increaseQueue);
        decreaseBtn.addEventListener('click', decreaseQueue);
        volumeSlider.addEventListener('input', updateVolume);
        testVoiceBtn.addEventListener('click', testVoice);
        operatorSelect.addEventListener('change', updateOperatorStatus);
        
        // Inisialisasi volume
        updateVolume();
        
        // Tambahkan beberapa riwayat awal
        if (queueHistory.length === 0) {
            addToHistory("A12", "Operator 3");
            addToHistory("A13", "Operator 5");
            addToHistory("A14", "Operator 2");
        }
        
        // Cek dukungan Web Speech API
        checkSpeechSupport();
    }
    
    // Cek dukungan Web Speech API
    function checkSpeechSupport() {
        if (!('speechSynthesis' in window)) {
            alert("Browser Anda tidak mendukung Text-to-Speech. Suara panggilan tidak akan berfungsi.");
            callBtn.disabled = true;
            testVoiceBtn.disabled = true;
        }
    }
    
    // Update tanggal dan waktu
    function updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        dateTimeElement.textContent = now.toLocaleDateString('id-ID', options);
    }
    
    // Render grid operator
    function renderOperatorGrid() {
        operatorGrid.innerHTML = '';
        
        operators.forEach(operator => {
            const operatorCard = document.createElement('div');
            operatorCard.className = `operator-card ${operator.status}`;
            operatorCard.innerHTML = `
                <div class="operator-number">${operator.id}</div>
                <div class="operator-name">${operator.name.split(' - ')[1]}</div>
                <div>
                    <span class="operator-status-indicator ${operator.status}"></span>
                    <span>${operator.status === 'available' ? 'Tersedia' : 'Sibuk'}</span>
                </div>
            `;
            
            // Jika operator ini dipilih, tandai sebagai aktif
            if (parseInt(operatorSelect.value) === operator.id) {
                operatorCard.classList.add('active');
            }
            
            operatorGrid.appendChild(operatorCard);
        });
    }
    
    // Update status operator yang dipilih
    function updateOperatorStatus() {
        const selectedOperatorId = parseInt(operatorSelect.value);
        const selectedOperator = operators.find(op => op.id === selectedOperatorId);
        
        const statusIndicator = operatorStatus.querySelector('.status-indicator');
        const statusText = operatorStatus.querySelector('.status-text');
        
        if (selectedOperator.status === 'available') {
            statusIndicator.className = 'status-indicator available';
            statusText.textContent = 'Tersedia';
        } else {
            statusIndicator.className = 'status-indicator busy';
            statusText.textContent = 'Sibuk';
        }
        
        renderOperatorGrid();
    }
    
    // Tambah nomor antrian
    function increaseQueue() {
        let currentValue = parseInt(queueNumberInput.value);
        queueNumberInput.value = currentValue + 1;
    }
    
    // Kurangi nomor antrian
    function decreaseQueue() {
        let currentValue = parseInt(queueNumberInput.value);
        if (currentValue > 1) {
            queueNumberInput.value = currentValue - 1;
        }
    }
    
    // Update volume suara
    function updateVolume() {
        currentVolume = parseFloat(volumeSlider.value);
        volumeValue.textContent = `${Math.round(currentVolume * 100)}%`;
    }
    
    // Fungsi untuk memanggil antrian dengan suara
    function callQueue() {
        const queueNumber = queueNumberInput.value;
        const operatorId = operatorSelect.value;
        const operatorText = operatorSelect.options[operatorSelect.selectedIndex].text;
        const operatorName = operatorText.split(' - ')[0];
        
        // Format nomor antrian dengan huruf "A" di depan
        const formattedQueueNumber = `A${queueNumber}`;
        
        // Update tampilan
        displayQueueNumber.textContent = formattedQueueNumber;
        displayOperator.textContent = operatorName;
        
        // Tambahkan efek visual
        currentCallDisplay.classList.add('animate__animated', 'animate__pulse');
        setTimeout(() => {
            currentCallDisplay.classList.remove('animate__animated', 'animate__pulse');
        }, 1000);
        
        // Tambahkan ke riwayat
        addToHistory(formattedQueueNumber, operatorName);
        
        // Panggil dengan suara
        speakQueueCall(formattedQueueNumber, operatorName);
        
        // Update status operator menjadi sibuk
        updateOperatorStatusToBusy(parseInt(operatorId));
    }
    
    // Fungsi untuk mengucapkan panggilan antrian
    function speakQueueCall(queueNumber, operatorName) {
        if (isSpeaking) {
            speechSynth.cancel(); // Batalkan jika sedang berbicara
        }
        
        // Teks yang akan diucapkan
        const announcementText = `Nomor antrian ${queueNumber}, silakan menuju ${operatorName}`;
        
        // Buat objek SpeechSynthesisUtterance
        const utterance = new SpeechSynthesisUtterance(announcementText);
        
        // Set properti suara
        utterance.volume = currentVolume;
        utterance.rate = 0.9; // Kecepatan bicara
        utterance.pitch = 1.0; // Nada suara
        
        // Pilih suara wanita jika tersedia
        const voices = speechSynth.getVoices();
        const femaleVoice = voices.find(voice => 
            voice.name.includes('Female') || 
            voice.name.includes('Woman') || 
            voice.name.includes('Perempuan')
        );
        
        if (femaleVoice) {
            utterance.voice = femaleVoice;
        } else {
            // Gunakan suara default
            utterance.lang = 'id-ID';
        }
        
        // Event ketika mulai berbicara
        utterance.onstart = function() {
            isSpeaking = true;
            callBtn.disabled = true;
            callBtn.innerHTML = '<i class="fas fa-volume-up"></i> Sedak Membunyikan...';
        };
        
        // Event ketika selesai berbicara
        utterance.onend = function() {
            isSpeaking = false;
            callBtn.disabled = false;
            callBtn.innerHTML = '<i class="fas fa-bullhorn"></i> Panggil Antrian';
        };
        
        // Event jika terjadi error
        utterance.onerror = function(event) {
            console.error('Error dalam Text-to-Speech:', event);
            isSpeaking = false;
            callBtn.disabled = false;
            callBtn.innerHTML = '<i class="fas fa-bullhorn"></i> Panggil Antrian';
            
            // Fallback: Tampilkan alert jika suara tidak bisa diputar
            alert(`Panggilan: ${announcementText}`);
        };
        
        // Mulai berbicara
        speechSynth.speak(utterance);
    }
    
    // Update status operator menjadi sibuk
    function updateOperatorStatusToBusy(operatorId) {
        const operatorIndex = operators.findIndex(op => op.id === operatorId);
        if (operatorIndex !== -1) {
            operators[operatorIndex].status = 'busy';
            renderOperatorGrid();
            updateOperatorStatus();
            
            // Set timeout untuk mengembalikan status menjadi tersedia setelah 2 menit
            setTimeout(() => {
                operators[operatorIndex].status = 'available';
                renderOperatorGrid();
                updateOperatorStatus();
            }, 120000); // 2 menit
        }
    }
    
    // Tambahkan ke riwayat
    function addToHistory(queueNumber, operatorName) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const historyItem = {
            queueNumber,
            operatorName,
            time: timeString,
            timestamp: now.getTime()
        };
        
        queueHistory.unshift(historyItem); // Tambahkan di awal array
        
        // Simpan ke localStorage
        saveQueueHistory();
        
        // Render ulang riwayat
        renderQueueHistory();
        
        // Batasi riwayat menjadi 10 item terakhir
        if (queueHistory.length > 10) {
            queueHistory = queueHistory.slice(0, 10);
        }
    }
    
    // Render riwayat antrian
    function renderQueueHistory() {
        historyList.innerHTML = '';
        
        queueHistory.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${item.queueNumber}</strong> → ${item.operatorName}
                </div>
                <div class="history-time">${item.time}</div>
            `;
            historyList.appendChild(li);
        });
    }
    
    // Simpan riwayat ke localStorage
    function saveQueueHistory() {
        localStorage.setItem('queueHistory', JSON.stringify(queueHistory));
    }
    
    // Muat riwayat dari localStorage
    function loadQueueHistory() {
        const savedHistory = localStorage.getItem('queueHistory');
        if (savedHistory) {
            queueHistory = JSON.parse(savedHistory);
            renderQueueHistory();
        }
    }
    
    // Reset antrian
    function resetQueue() {
        if (confirm("Apakah Anda yakin ingin mereset antrian? Riwayat akan dihapus.")) {
            queueNumberInput.value = 1;
            displayQueueNumber.textContent = "A1";
            displayOperator.textContent = "Operator 1";
            
            // Reset semua operator menjadi tersedia
            operators.forEach(operator => {
                operator.status = "available";
            });
            
            // Reset riwayat
            queueHistory = [];
            saveQueueHistory();
            renderQueueHistory();
            
            // Render ulang grid operator
            renderOperatorGrid();
            updateOperatorStatus();
            
            // Beri feedback
            alert("Antrian telah direset ke nomor 1.");
        }
    }
    
    // Uji suara
    function testVoice() {
        if (isSpeaking) {
            speechSynth.cancel();
        }
        
        const testText = "Ini adalah uji suara dari sistem antrian SPMB SMA Negeri 1 Magetan. Suara ini digunakan untuk memanggil nomor antrian.";
        
        const utterance = new SpeechSynthesisUtterance(testText);
        utterance.volume = currentVolume;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        // Pilih suara wanita jika tersedia
        const voices = speechSynth.getVoices();
        const femaleVoice = voices.find(voice => 
            voice.name.includes('Female') || 
            voice.name.includes('Woman') || 
            voice.name.includes('Perempuan')
        );
        
        if (femaleVoice) {
            utterance.voice = femaleVoice;
        } else {
            utterance.lang = 'id-ID';
        }
        
        utterance.onstart = function() {
            testVoiceBtn.disabled = true;
            testVoiceBtn.innerHTML = '<i class="fas fa-volume-up"></i> Sedang Menguji...';
        };
        
        utterance.onend = function() {
            testVoiceBtn.disabled = false;
            testVoiceBtn.innerHTML = '<i class="fas fa-play"></i> Uji Suara';
        };
        
        utterance.onerror = function(event) {
            console.error('Error dalam uji suara:', event);
            testVoiceBtn.disabled = false;
            testVoiceBtn.innerHTML = '<i class="fas fa-play"></i> Uji Suara';
            alert("Tidak dapat memutar suara. Pastikan browser mendukung Text-to-Speech.");
        };
        
        speechSynth.speak(utterance);
    }
    
    // Inisialisasi aplikasi saat halaman dimuat
    initApp();
});