// LocalStorage Keys
const STORAGE_KEYS = {
  STATE: 'timeup_active_state',
  HISTORY: 'timeup_history',
  SETTINGS: 'timeup_settings'
};

// Application Default Settings
let settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {
  userName: 'محمد',
  workStart: '08:30',
  workHours: 8
};

// Application Active State
let activeState = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATE)) || {
  isCheckedIn: false,
  checkInTime: null
};

// History Log Array
let historyData = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  loadUserSettings();
  renderAppState();
  renderHistoryTables();
  calculateMonthlyStats();
  
  // Refresh active timer every second if user is checked in
  setInterval(updateActiveTimer, 1000);
});

// Live Clock & Date Update
function initLiveClock() {
  const updateClock = () => {
    const now = new Date();
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    const dayName = days[now.getDay()];
    const dateStr = `${dayName}، ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    document.getElementById('currentDate').innerText = `اليوم: ${dateStr}`;
    document.getElementById('currentTime').innerText = timeStr;
  };
  
  updateClock();
  setInterval(updateClock, 1000);
}

// Mobile Menu Toggle
function toggleMobileMenu() {
  const drawer = document.getElementById('mobileDrawer');
  drawer.classList.toggle('open');
}

// SPA Tab Switching
function switchTab(tabId, el) {
  document.querySelectorAll('.tab-page').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-links li, .mobile-nav-links li').forEach(item => item.classList.remove('active'));
  
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.classList.add('active');
  
  if (el) el.classList.add('active');
}

// User Settings Management
function loadUserSettings() {
  document.getElementById('userName').innerText = settings.userName;
  document.getElementById('settingUserName').value = settings.userName;
  document.getElementById('settingWorkStart').value = settings.workStart;
  document.getElementById('settingWorkHours').value = settings.workHours;
}

function saveSettings() {
  settings.userName = document.getElementById('settingUserName').value.trim() || 'محمد';
  settings.workStart = document.getElementById('settingWorkStart').value || '08:30';
  settings.workHours = parseInt(document.getElementById('settingWorkHours').value) || 8;
  
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  document.getElementById('userName').innerText = settings.userName;
  alert('تم حفظ الإعدادات بنجاح!');
}

// Check-in / Check-out Button Action
function handleClockAction() {
  const now = new Date();
  
  if (!activeState.isCheckedIn) {
    // Check-In Logic
    activeState.isCheckedIn = true;
    activeState.checkInTime = now.toISOString();
    
    localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(activeState));
    renderAppState();
  } else {
    // Check-Out Logic
    const checkInDate = new Date(activeState.checkInTime);
    const checkOutDate = now;
    
    const diffMs = checkOutDate - checkInDate;
    const durationMinutes = Math.floor(diffMs / (1000 * 60));
    
    // Calculate Delay & Overtime
    const delayMinutes = calculateDelay(checkInDate);
    const standardWorkMinutes = settings.workHours * 60;
    const overtimeMinutes = durationMinutes > standardWorkMinutes ? durationMinutes - standardWorkMinutes : 0;
    
    // Create History Record
    const newRecord = {
      id: Date.now(),
      dateStr: checkInDate.toLocaleDateString('ar-EG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
      rawDate: checkInDate.toISOString(),
      checkInTime: checkInDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      checkOutTime: checkOutDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: durationMinutes,
      overtimeMinutes: overtimeMinutes,
      delayMinutes: delayMinutes,
      status: overtimeMinutes > 0 ? 'ساعات إضافية' : (delayMinutes > 0 ? 'تأخير' : 'مكتمل')
    };
    
    historyData.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historyData));
    
    // Reset Active State
    activeState.isCheckedIn = false;
    activeState.checkInTime = null;
    localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(activeState));
    
    renderAppState();
    renderHistoryTables();
    calculateMonthlyStats();
  }
}

// Calculate Delay Minutes
function calculateDelay(checkInDate) {
  const [startHour, startMin] = settings.workStart.split(':').map(Number);
  const targetTime = new Date(checkInDate);
  targetTime.setHours(startHour, startMin, 0, 0);
  
  if (checkInDate > targetTime) {
    return Math.floor((checkInDate - targetTime) / (1000 * 60));
  }
  return 0;
}

// Render Main Interface State
function renderAppState() {
  const clockBtn = document.getElementById('clockBtn');
  const clockIcon = document.getElementById('clockIcon');
  const clockBtnText = document.getElementById('clockBtnText');
  const clockBtnSubtext = document.getElementById('clockBtnSubtext');
  const statusBadge = document.getElementById('statusBadge');
  const displayCheckIn = document.getElementById('displayCheckIn');
  const displayCheckOut = document.getElementById('displayCheckOut');
  
  if (activeState.isCheckedIn) {
    const checkInDate = new Date(activeState.checkInTime);
    
    clockBtn.className = 'clock-btn check-out';
    clockIcon.className = 'fa-solid fa-right-from-bracket';
    clockBtnText.innerText = 'توقف العمل';
    clockBtnSubtext.innerText = '(تسجيل الخروج)';
    
    statusBadge.className = 'status-badge online';
    statusBadge.innerHTML = '<i class="fa-solid fa-circle"></i> أنت مسجل حضور حالياً';
    
    displayCheckIn.innerText = checkInDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    displayCheckOut.innerText = '--:--';
  } else {
    clockBtn.className = 'clock-btn check-in';
    clockIcon.className = 'fa-solid fa-right-to-bracket';
    clockBtnText.innerText = 'تسجيل الدخول';
    clockBtnSubtext.innerText = 'اضغط لبدء العمل';
    
    statusBadge.className = 'status-badge offline';
    statusBadge.innerHTML = '<i class="fa-solid fa-circle"></i> غير مسجل (خارج العمل)';
    
    if (historyData.length > 0) {
      displayCheckIn.innerText = historyData[0].checkInTime;
      displayCheckOut.innerText = historyData[0].checkOutTime;
    } else {
      displayCheckIn.innerText = '--:--';
      displayCheckOut.innerText = '--:--';
    }
  }
  
  updateActiveTimer();
}

// Update Active Timer & Statistics
function updateActiveTimer() {
  const todayTotalHoursEl = document.getElementById('todayTotalHours');
  const activeTimerText = document.getElementById('activeTimerText');
  
  if (activeState.isCheckedIn && activeState.checkInTime) {
    const checkInDate = new Date(activeState.checkInTime);
    const now = new Date();
    const diffMs = now - checkInDate;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    todayTotalHoursEl.innerText = `${hours} ساعات، ${minutes} دقيقة`;
    activeTimerText.innerText = `جاري الحساب المباشر: ${hours}س : ${minutes}د : ${seconds}ث`;
  } else {
    if (historyData.length > 0) {
      const latest = historyData[0];
      const h = Math.floor(latest.durationMinutes / 60);
      const m = latest.durationMinutes % 60;
      todayTotalHoursEl.innerText = `${h} ساعات، ${m} دقيقة`;
    } else {
      todayTotalHoursEl.innerText = '0 ساعات، 0 دقيقة';
    }
    activeTimerText.innerText = 'العداد متوقف';
  }
}

// Render History Tables
function renderHistoryTables() {
  const recentBody = document.getElementById('recentHistoryBody');
  const fullBody = document.getElementById('fullHistoryBody');
  
  const generateRowHTML = (item, index, isFull = false) => {
    const h = Math.floor(item.durationMinutes / 60);
    const m = item.durationMinutes % 60;
    
    let badgeClass = 'badge-normal';
    if (item.overtimeMinutes > 0) badgeClass = 'badge-overtime';
    else if (item.delayMinutes > 0) badgeClass = 'badge-delay';
    
    return `
      <tr>
        ${isFull ? `<td>${index + 1}</td>` : ''}
        <td><strong>${item.dateStr}</strong></td>
        <td>${item.checkInTime}</td>
        <td>${item.checkOutTime}</td>
        <td>${h}س ${m}د</td>
        <td style="color:#10b981;">${item.overtimeMinutes > 0 ? Math.floor(item.overtimeMinutes / 60) + 'س ' + (item.overtimeMinutes % 60) + 'د' : '-'}</td>
        <td style="color:#f59e0b;">${item.delayMinutes > 0 ? item.delayMinutes + ' دقيقة' : '-'}</td>
        <td><span class="badge-tag ${badgeClass}">${item.status}</span></td>
        ${isFull ? `<td><button class="delete-row-btn" onclick="deleteHistoryRecord(${item.id})"><i class="fa-solid fa-trash"></i></button></td>` : ''}
      </tr>
    `;
  };
  
  if (historyData.length === 0) {
    const emptyMsg = `<tr><td colspan="8" style="text-align:center; padding: 20px; color: #94a3b8;">لا توجد سجلات مسجلة حتى الآن</td></tr>`;
    recentBody.innerHTML = emptyMsg;
    fullBody.innerHTML = emptyMsg;
    return;
  }
  
  recentBody.innerHTML = historyData.slice(0, 5).map((item, idx) => generateRowHTML(item, idx, false)).join('');
  fullBody.innerHTML = historyData.map((item, idx) => generateRowHTML(item, idx, true)).join('');
}

// Calculate Monthly & Weekly Summaries
function calculateMonthlyStats() {
  let totalMinutes = 0;
  let totalOvertimeMinutes = 0;
  let totalDelayMinutes = 0;
  
  historyData.forEach(item => {
    totalMinutes += item.durationMinutes;
    totalOvertimeMinutes += item.overtimeMinutes;
    totalDelayMinutes += item.delayMinutes;
  });
  
  const totalHours = (totalMinutes / 60).toFixed(1);
  const overtimeHours = (totalOvertimeMinutes / 60).toFixed(1);
  
  document.getElementById('monthlyOvertime').innerText = `${overtimeHours} ساعة`;
  document.getElementById('monthlyDelay').innerText = `${totalDelayMinutes} دقيقة`;
  document.getElementById('weeklyTotal').innerText = `${totalHours} ساعة`;
  document.getElementById('monthlyTotalText').innerText = `إجمالي الشهر: ${totalHours} ساعة`;
  
  // Reports Tab Values
  document.getElementById('repWorkDays').innerText = `${historyData.length} يوم`;
  document.getElementById('repTotalHours').innerText = `${totalHours} ساعة`;
  document.getElementById('repTotalOvertime').innerText = `${overtimeHours} ساعة`;
  document.getElementById('repTotalDelay').innerText = `${totalDelayMinutes} دقيقة`;
}

// Delete Single Record
function deleteHistoryRecord(id) {
  if (confirm('هل أنت تأكد من حذف هذا السجل؟')) {
    historyData = historyData.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historyData));
    renderHistoryTables();
    calculateMonthlyStats();
    renderAppState();
  }
}

// Clear All History
function clearAllHistory() {
  if (confirm('هل أنت متأكد من مسح جميع السجلات؟ لا يمكن التراجع عن هذه الخطوة.')) {
    historyData = [];
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    renderHistoryTables();
    calculateMonthlyStats();
    renderAppState();
  }
}