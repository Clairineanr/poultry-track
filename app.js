/* ==========================================================================
   POULTRYTRACK SCRIPT (GAYA FAATIN & CLAIRINE QA VERIFIED)
   Offline-first state management with Audio-Tactile feedback
   ========================================================================== */

const STORAGE_KEY = 'POULTRYTRACK_FAATIN_V2';

const DEFAULT_STATE = {
  selectedCustType: 'eceran',
  selectedMitraId: '',
  ekor: 3,
  beratKg: 5.40,
  hargaPerKg: 42000,
  selectedCut: '4 Potong',
  customJumlahPotong: 4,
  customRequest: 'Dada saja',
  isTanpaKulit: true,
  payType: 'tunai',

  customers: [
    { id: "AL", name: "AL (Bu Aliyah - Katering/Resto)", phone: "081234567801", currentDebt: 1622000, plafon: 2000000, daysLate: 0 },
    { id: "War", name: "War (Warung Bu Warsiti - Lalapan)", phone: "081234567802", currentDebt: 560000, plafon: 1000000, daysLate: 0 },
    { id: "K", name: "K (Pak Kusno - Depot Bakso)", phone: "081234567803", currentDebt: 400000, plafon: 800000, daysLate: 0 },
    { id: "J", name: "J (Bu Jamilah - Nasi Barokah)", phone: "081234567804", currentDebt: 340000, plafon: 600000, daysLate: 0 },
    { id: "YA", name: "YA (Bu Yanti - Rumah Makan Padang)", phone: "081234567809", currentDebt: 505000, plafon: 1000000, daysLate: 2 },
    { id: "M", name: "M (Mas Munir - Penyetan Malam)", phone: "081234567805", currentDebt: 237000, plafon: 500000, daysLate: 0 }
  ],

  cuttingQueue: [
    { id: 'q1', partnerName: 'AL (Bu Aliyah - Katering)', ekor: 10, cut: 'Potong 4', note: 'Dada saja, tanpa kulit', status: 'antre', time: '05:15' },
    { id: 'q2', partnerName: 'War (Warung Bu Warsiti)', ekor: 5, cut: 'Potong 8', note: 'Jeroan dipisah leher buang', status: 'antre', time: '05:40' }
  ],

  supplies: [
    { id: "SUP-188", date: "2026-10-16", supplier: "UD. Cheyloo Farm Kamal", ekor: 180, kg: 300.5, price: 23500, totalModal: 7061750 }
  ],

  transactions: [
    { id: "TRX-101", date: "2026-10-16", time: "05:15", customerName: "AL (Bu Aliyah)", ekor: 15, kg: 28.5, cut: "Potong 4", price: 42000, total: 1197000, type: "bon" },
    { id: "TRX-102", date: "2026-10-16", time: "05:40", customerName: "Eceran Tunai", ekor: 3, kg: 5.4, cut: "4 Potong", price: 42000, total: 226800, type: "tunai" }
  ]
};

let appState = DEFAULT_STATE;
try {
  const loaded = localStorage.getItem(STORAGE_KEY);
  if (loaded) appState = Object.assign({}, DEFAULT_STATE, JSON.parse(loaded));
} catch(e) { console.error('LocalStorage error', e); }

function saveAppState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appState)); } catch(e){}
}

function formatRp(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}

/* Audio Tactile Click (Subuh Friendly) */
let audioCtx = null;
function playSound(freq = 700) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
  } catch(e){}
}

/* ==========================================================================
   INTERAKSI KASIR (PERSIS SEPERTI GAMBAR FAATIN)
   ========================================================================== */
function selectCustType(type) {
  playSound(650);
  appState.selectedCustType = type;
  document.getElementById('btnTypeEceran').classList.toggle('active', type === 'eceran');
  document.getElementById('btnTypeLangganan').classList.toggle('active', type === 'langganan');

  const dropdownBox = document.getElementById('boxPartnerDropdown');
  if (type === 'langganan') {
    dropdownBox.style.display = 'block';
    populateMitraDropdown();
    selectPayType('bon'); // default langganan bon
  } else {
    dropdownBox.style.display = 'none';
    selectPayType('tunai'); // default eceran tunai
  }
}

function populateMitraDropdown() {
  const sel = document.getElementById('selectMitraLangganan');
  sel.innerHTML = '<option value="">-- Pilih Mitra Warung / Katering --</option>' +
    appState.customers.map(c => `<option value="${c.id}">${c.name} [Bon: ${formatRp(c.currentDebt)}]</option>`).join('');
}

function onMitraSelected() {
  const sel = document.getElementById('selectMitraLangganan');
  const badge = document.getElementById('badgeSaldoMitra');
  const val = document.getElementById('valSaldoMitra');
  const c = appState.customers.find(x => x.id === sel.value);
  if (c && c.currentDebt > 0) {
    badge.style.display = 'block';
    val.innerText = formatRp(c.currentDebt);
  } else {
    badge.style.display = 'none';
  }
}

function stepEkor(delta) {
  playSound(800);
  appState.ekor = Math.max(1, appState.ekor + delta);
  document.getElementById('displayEkor').innerText = appState.ekor + ' Ekor';
  updateCalculation();
}

function setPresetKg(val) {
  playSound(750);
  document.getElementById('inputBeratKg').value = val.toFixed(2);
  appState.beratKg = val;
  updateCalculation();
}

function selectCutTab(cutName) {
  playSound(700);
  appState.selectedCut = cutName;
  document.querySelectorAll('.cut-tab-btn').forEach(b => b.classList.remove('active'));

  if (cutName === 'Utuh') {
    document.getElementById('cutUtuh').classList.add('active');
    document.getElementById('inputJumlahPotong').value = 1;
    document.getElementById('inputRequestPotong').value = 'Utuh karkas bersih';
  } else if (cutName === '4 Potong') {
    document.getElementById('cut4').classList.add('active');
    document.getElementById('inputJumlahPotong').value = 4;
    document.getElementById('inputRequestPotong').value = 'Dada saja';
  } else if (cutName === 'Fillet') {
    document.getElementById('cutFillet').classList.add('active');
    document.getElementById('inputJumlahPotong').value = 1;
    document.getElementById('inputRequestPotong').value = 'Fillet dada bersih kulit';
  }
}

function selectPayType(type) {
  playSound(600);
  appState.payType = type;
  document.getElementById('payTunai').classList.toggle('active', type === 'tunai');
  document.getElementById('payBon').classList.toggle('active', type === 'bon');
}

function updateCalculation() {
  const kg = parseFloat(document.getElementById('inputBeratKg').value) || 0;
  const price = parseFloat(document.getElementById('inputHargaKg').value) || 0;
  const total = Math.round(kg * price);

  document.getElementById('displayTotalTagihan').innerText = formatRp(total);
  document.getElementById('displayFormula').innerText = kg.toFixed(2) + ' Kg × ' + formatRp(price);
}

function simpanPesananKasir() {
  playSound(1100);
  const kg = parseFloat(document.getElementById('inputBeratKg').value) || 0;
  const price = parseFloat(document.getElementById('inputHargaKg').value) || 0;
  const ekor = appState.ekor;
  const cut = appState.selectedCut;
  const customJml = document.getElementById('inputJumlahPotong').value;
  const customReq = document.getElementById('inputRequestPotong').value;
  const tanpaKulit = document.getElementById('toggleTanpaKulit').checked;

  if (kg <= 0 || price <= 0) {
    alert('Masukkan berat (Kg) dan harga per Kg yang valid!');
    return;
  }

  let custName = 'Eceran Tunai';
  let custId = 'ECR';
  if (appState.selectedCustType === 'langganan') {
    const sel = document.getElementById('selectMitraLangganan');
    if (!sel.value) {
      alert('Pilih nama mitra langganan terlebih dahulu!');
      return;
    }
    const c = appState.customers.find(x => x.id === sel.value);
    custName = c.name;
    custId = c.id;
    // Tambah bon mitra jika tempo
    if (appState.payType === 'bon') {
      c.currentDebt += Math.round(kg * price);
    }
  }

  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5);
  const totalTagihan = Math.round(kg * price);

  const newTrx = {
    id: "TRX-" + Date.now().toString().slice(-4),
    date: now.toISOString().split('T')[0],
    time: timeStr,
    customerName: custName,
    ekor: ekor,
    kg: kg,
    cut: `${cut} (${customJml} ptg, ${customReq}${tanpaKulit ? ', Tanpa kulit' : ''})`,
    price: price,
    total: totalTagihan,
    type: appState.payType
  };

  appState.transactions.push(newTrx);

  // Masukkan otomatis ke antrean meja potong juru potong
  appState.cuttingQueue.push({
    id: 'q-' + Date.now().toString().slice(-4),
    partnerName: custName,
    ekor: ekor,
    cut: cut,
    note: `${customReq} ${tanpaKulit ? '(Tanpa kulit)' : ''} &bull; ${kg.toFixed(1)} kg`,
    status: 'antre',
    time: timeStr
  });

  saveAppState();
  renderCuttingQueue();
  renderBukuBon();
  renderRekapKas();
  showReceipt(newTrx);
}

function showReceipt(trx) {
  const modal = document.getElementById('receiptModal');
  const body = document.getElementById('receiptBody');
  const isBon = trx.type === 'bon';

  body.innerHTML = `
    <center>
      <b>LAPAK AYAM BU SITI</b><br>
      Los Daging Pasar Tradisional<br>
      Telp: 0812-3456-7890<br>
      --------------------------------<br>
    </center>
    No. Struk : ${trx.id}<br>
    Waktu     : ${trx.date} ${trx.time} WIB<br>
    Pelanggan : ${trx.customerName}<br>
    --------------------------------<br>
    Pesanan   : ${trx.ekor} Ekor &bull; ${trx.cut}<br>
    Timbangan : ${trx.kg.toFixed(2)} Kg @ ${formatRp(trx.price)}<br>
    --------------------------------<br>
    TOTAL     : ${formatRp(trx.total)}<br>
    STATUS    : <b>${isBon ? 'BON TEMPO (BELUM LUNAS)' : 'LUNAS TUNAI'}</b><br>
    --------------------------------<br>
    <center>
      *Simpan bukti timbangan karkas*<br>
      PoultryTrack System
    </center>
  `;
  modal.style.display = 'flex';
}

function closeReceiptModal() {
  document.getElementById('receiptModal').style.display = 'none';
}

/* ==========================================================================
   RENDER ANTREAN MEJA POTONG (WARM EARTHY THEME FAATIN)
   ========================================================================== */
function renderCuttingQueue() {
  const container = document.getElementById('queueContainerFaatin');
  const badgeTotal = document.getElementById('badgeTotalAntrean');
  if (!container) return;

  const totalAktif = appState.cuttingQueue.filter(q => q.status !== 'selesai').length;
  if (badgeTotal) badgeTotal.innerText = totalAktif + ' Antrean Aktif';

  if (appState.cuttingQueue.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:24px;">Tidak ada antrean potong aktif.</div>';
    return;
  }

  container.innerHTML = appState.cuttingQueue.map(q => {
    const isDone = q.status === 'selesai';
    return `
      <div style="background:${isDone ? '#F0FFF4' : '#F8FAFC'}; border:1.5px solid ${isDone ? '#C6F6D5' : '#EAEFF4'}; border-left:5px solid ${isDone ? '#2F855A' : '#6E472B'}; border-radius:12px; padding:14px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:16px; font-weight:800; color:#111A24;">${q.ekor} Ekor &bull; ${q.cut}</span>
            <span style="background:${isDone ? '#C6F6D5' : '#FDF4E7'}; color:${isDone ? '#22543D' : '#975A16'}; font-size:11px; font-weight:700; padding:2px 8px; border-radius:99px;">
              ${isDone ? 'SELESAI' : 'ANTRE'}
            </span>
          </div>
          <div style="font-size:13px; color:#4A5568; margin-top:3px;">
            Mitra: <strong style="color:#111A24;">${q.partnerName}</strong> (${q.note})
          </div>
          <div style="font-size:11px; color:#A0AEC0; margin-top:2px;">Waktu Masuk: ${q.time} WIB</div>
        </div>
        <div>
          ${!isDone ? `
            <button type="button" style="background:#6E472B; color:#FFF; border:none; padding:8px 14px; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer; box-shadow:0 2px 0 #54351F;" onclick="doneQueue('${q.id}')">
              Selesai
            </button>
          ` : `
            <button type="button" style="background:transparent; color:#A0AEC0; border:1px solid #DDE4EC; padding:6px 10px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;" onclick="deleteQueue('${q.id}')">
              Hapus
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function doneQueue(id) {
  playSound(850);
  const item = appState.cuttingQueue.find(q => q.id === id);
  if (item) item.status = 'selesai';
  saveAppState();
  renderCuttingQueue();
}

function deleteQueue(id) {
  playSound(500);
  appState.cuttingQueue = appState.cuttingQueue.filter(q => q.id !== id);
  saveAppState();
  renderCuttingQueue();
}

/* ==========================================================================
   RENDER BUKU BON & ARUS KAS
   ========================================================================== */
function renderBukuBon() {
  const container = document.getElementById('listMitraBonContainer');
  const headerTotal = document.getElementById('bonTotalHeader');
  if (!container) return;

  const totalBon = appState.customers.reduce((a, c) => a + c.currentDebt, 0);
  if (headerTotal) headerTotal.innerText = formatRp(totalBon);

  container.innerHTML = appState.customers.map(c => `
    <div style="padding:12px; background:#F8FAFC; border:1px solid #EAEFF4; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <strong style="font-size:15px; color:#111A24;">${c.name}</strong>
        <div style="font-size:12px; color:#718096; margin-top:2px;">Plafon: ${formatRp(c.plafon)} &bull; Telp: ${c.phone}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:16px; font-weight:800; color:${c.currentDebt > 0 ? '#E53E3E' : '#2F855A'};">
          ${formatRp(c.currentDebt)}
        </div>
        <a href="https://wa.me/?text=Halo%20${encodeURIComponent(c.name)},%20mengingatkan%20catatan%20bon%20lapak%20ayam%20sebesar%20${encodeURIComponent(formatRp(c.currentDebt))}." target="_blank" style="display:inline-block; margin-top:4px; font-size:11px; font-weight:700; color:#25D366; text-decoration:none;">
          Kirim WA &rarr;
        </a>
      </div>
    </div>
  `).join('');
}

function renderRekapKas() {
  const dispKas = document.getElementById('rekapKasLaciDisplay');
  const dispTunai = document.getElementById('rekapPenjualanTunai');
  const dispCicilan = document.getElementById('rekapCicilanMasuk');
  const dispModal = document.getElementById('rekapModalKeluar');

  let tunai = 5240000;
  let cicilan = 1420000;
  let modal = 3500000;

  // Akumulasi dari transaksi baru
  appState.transactions.forEach(t => {
    if (t.type === 'tunai') tunai += t.total;
  });

  const kasBersih = (tunai + cicilan) - modal;
  if (dispKas) dispKas.innerText = formatRp(kasBersih);
  if (dispTunai) dispTunai.innerText = formatRp(tunai);
  if (dispCicilan) dispCicilan.innerText = formatRp(cicilan);
  if (dispModal) dispModal.innerText = '- ' + formatRp(modal);
}

function simpanPasokanMasuk() {
  playSound(900);
  const ekor = parseInt(document.getElementById('inSupEkor').value) || 0;
  const kg = parseFloat(document.getElementById('inSupKg').value) || 0;
  const price = parseFloat(document.getElementById('inSupPrice').value) || 0;

  if (ekor <= 0 || kg <= 0) {
    alert('Mohon isi ekor dan timbangan netto pasokan dengan benar!');
    return;
  }

  appState.supplies.push({
    id: "SUP-" + Date.now().toString().slice(-3),
    date: new Date().toISOString().split('T')[0],
    supplier: "UD. Cheyloo Farm Kamal",
    ekor: ekor,
    kg: kg,
    price: price,
    totalModal: Math.round(kg * price)
  });

  saveAppState();
  alert('Manifes pasokan berhasil dicatat!');
}

/* ==========================================================================
   TAB NAVIGATION
   ========================================================================== */
function switchTab(tabId, btn) {
  playSound(550);
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));

  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.classList.add('active');
  if (btn) btn.classList.add('active');

  if (tabId === 'antrean') renderCuttingQueue();
  if (tabId === 'buku-bon') renderBukuBon();
  if (tabId === 'rekap-kas') renderRekapKas();
}

/* ==========================================================================
   REALTIME CLOCK & OPERATIONAL STATUS (SESUAI GAMBAR REFERENSI)
   ========================================================================== */
function initLiveClock() {
  const clockEl = document.getElementById('liveClockDisplay');
  const statusPill = document.getElementById('statusLapakPill');
  const statusText = document.getElementById('statusLapakText');

  function update() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');

    if (clockEl) {
      clockEl.innerText = `${hours}.${mins}.${secs} WIB`;
    }

    // Jam operasional lapak ayam pasar (03:00 - 18:00 WIB)
    const currentHour = now.getHours();
    const isOpen = currentHour >= 3 && currentHour < 18;

    if (statusPill && statusText) {
      if (isOpen) {
        statusPill.style.background = '#E6F5EE';
        statusPill.style.color = '#177A4D';
        statusPill.style.borderColor = '#C6F6D5';
        statusText.innerText = 'Lapak Buka';
      } else {
        statusPill.style.background = '#FED7D7';
        statusPill.style.color = '#C53030';
        statusPill.style.borderColor = '#FEB2B2';
        statusText.innerText = 'Lapak Tutup';
      }
    }
  }

  update();
  setInterval(update, 1000);
}

// Initial Run
window.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  updateCalculation();
  renderCuttingQueue();
  renderBukuBon();
  renderRekapKas();
});

