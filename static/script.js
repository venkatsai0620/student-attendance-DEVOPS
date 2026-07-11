/**
 * Student Attendance System - Main JavaScript
 * Features: Real-time clock, attendance tracking, animations, data persistence
 */

// ============================================
// 1. GLOBAL STATE MANAGEMENT
// ============================================

const AttendanceApp = {
    attendanceData: {},
    selectedStudents: new Set(),
    currentDate: new Date().toISOString().split('T')[0],

    config: {
        autoSave: true,
        animationDuration: 300,
        maxRecords: 50
    },

    elements: {}
};

// ============================================
// 2. INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    AttendanceApp.init();
});

AttendanceApp.init = function () {
    this.cacheElements();
    this.startClock();
    this.loadState();
    this.setupEventListeners();
    this.updateStats();
    this.updateProgressBars();

    this.showNotification('Welcome! Mark attendance for students.', 'info');

    console.log('📚 Attendance System initialized successfully!');
};

// ============================================
// 3. DOM ELEMENT CACHING
// ============================================

AttendanceApp.cacheElements = function () {

    this.elements = {

        clock: document.getElementById('currentTime'),

        presentCount: document.getElementById('presentCount'),

        absentCount: document.getElementById('absentCount'),

        statPresent: document.getElementById('statPresent'),

        statAbsent: document.getElementById('statAbsent'),

        attendanceRate: document.getElementById('attendanceRate'),

        totalStudents: document.querySelector('.total'),

        attendanceForm: document.getElementById('attendanceForm'),

        submitBtn: document.querySelector('.btn-primary[type="submit"]'),

        resetBtn: document.querySelector('.btn-secondary:not(.header-links a)')

    };

};

// ============================================
// 4. LIVE CLOCK
// ============================================

AttendanceApp.startClock = function () {

    const updateClock = () => {

        const now = new Date();

        const timeStr = now.toLocaleTimeString('en-US', {

            hour12: true,

            hour: '2-digit',

            minute: '2-digit',

            second: '2-digit'

        });

        const dateStr = now.toLocaleDateString('en-US', {

            weekday: 'long',

            year: 'numeric',

            month: 'long',

            day: 'numeric'

        });

        if (this.elements.clock) {

            this.elements.clock.textContent = `⏰ ${timeStr} • ${dateStr}`;

        }

    };

    updateClock();

    setInterval(updateClock, 1000);

};

// ============================================
// 5. ATTENDANCE MANAGEMENT
// ============================================

AttendanceApp.setAttendance = function (studentId, status) {

    if (!studentId || !status) {

        this.showNotification('⚠️ Invalid attendance data!', 'error');

        return;

    }

    this.attendanceData[studentId] = {

        status: status,

        timestamp: new Date().toISOString(),

        time: new Date().toLocaleTimeString('en-US', {

            hour12: true,

            hour: '2-digit',

            minute: '2-digit',

            second: '2-digit'

        })

    };

    this.updateStudentUI(studentId, status);

    this.updateStats();

    this.updateProgressBars();

    if (this.config.autoSave) {

        this.saveState();

    }

    this.showNotification(`✅ ${status === 'present' ? 'Present' : 'Absent'} marked for ${this.getStudentName(studentId)}`, 'success');

};

AttendanceApp.getStudentName = function (studentId) {

    const rows = document.querySelectorAll('.student-row');

    for (let row of rows) {

        if (row.dataset.id === studentId) {

            const nameElement = row.querySelector('td:nth-child(3) strong');

            return nameElement ? nameElement.textContent : studentId;

        }

    }

    return studentId;

};

AttendanceApp.updateStudentUI = function (studentId, status) {

    const row = document.querySelector(`tr[data-id="${studentId}"]`);

    if (!row) return;

    const presentBtn = row.querySelector('.present-btn');

    const absentBtn = row.querySelector('.absent-btn');

    const timeCell = document.getElementById(`time_${studentId}`);

    const hiddenInput = document.getElementById(`attendance_${studentId}`);

    presentBtn.classList.remove('active', 'selected');

    absentBtn.classList.remove('active', 'selected');

    row.classList.remove('selected-present', 'selected-absent', 'row-animate');

    presentBtn.disabled = false;

    absentBtn.disabled = false;

    presentBtn.innerHTML = "✅ Present";

    absentBtn.innerHTML = "❌ Absent";

    if (status === 'present') {

        presentBtn.classList.add('active', 'selected');

        row.classList.add('selected-present', 'row-animate');

        presentBtn.innerHTML = '✅ Marked Present';

        absentBtn.disabled = true;

    }

    else {

        absentBtn.classList.add('active', 'selected');

        row.classList.add('selected-absent', 'row-animate');

        absentBtn.innerHTML = '❌ Marked Absent';

        presentBtn.disabled = true;

    }

    hiddenInput.value = status;

    if (timeCell) {

        timeCell.textContent = this.attendanceData[studentId].time;

    }

};

// ============================================
// 6. STATISTICS
// ============================================

AttendanceApp.updateStats = function () {

    const totalStudents = document.querySelectorAll('.student-row').length;

    let present = 0;

    let absent = 0;

    for (let id in this.attendanceData) {

        if (this.attendanceData[id].status === 'present')

            present++;

        else

            absent++;

    }

    if (this.elements.presentCount) {

        this.elements.presentCount.textContent = `Present: ${present}`;

        this.animateNumber(this.elements.presentCount, present);

    }

    if (this.elements.absentCount) {

        this.elements.absentCount.textContent = `Absent: ${absent}`;

        this.animateNumber(this.elements.absentCount, absent);

    }

    if (this.elements.statPresent) {

        this.elements.statPresent.textContent = present;

        this.animateNumber(this.elements.statPresent, present);

    }

    if (this.elements.statAbsent) {

        this.elements.statAbsent.textContent = absent;

        this.animateNumber(this.elements.statAbsent, absent);

    }

    if (this.elements.attendanceRate) {

        const percentage = totalStudents > 0

            ? ((present / totalStudents) * 100).toFixed(1)

            : 0;

        this.elements.attendanceRate.textContent = percentage + "%";

    }

};

AttendanceApp.animateNumber = function (element) {

    if (!element) return;

    element.style.animation = 'none';

    element.offsetHeight;

    element.style.animation = 'numberPulse .3s ease';

    setTimeout(() => {

        element.style.animation = '';

    }, 300);

};

AttendanceApp.updateProgressBars = function () {

    const total = document.querySelectorAll('.student-row').length;

    const present = Object.values(this.attendanceData).filter(d => d.status === 'present').length;

    const percentage = total ? Math.round((present / total) * 100) : 0;

    document.querySelectorAll('.attendance-progress').forEach(bar => {

        bar.style.width = percentage + "%";

        bar.textContent = percentage + "%";

    });

};

// ============================================
// 7. RESET FUNCTIONALITY
// ============================================

AttendanceApp.resetAttendance = function () {

    const confirmed = confirm("⚠️ Are you sure you want to reset all attendance selections?");

    if (!confirmed) return;

    this.attendanceData = {};

    document.querySelectorAll(".student-row").forEach(row => {

        const studentId = row.dataset.id;

        const presentBtn = row.querySelector(".present-btn");
        const absentBtn = row.querySelector(".absent-btn");

        const timeCell = document.getElementById(`time_${studentId}`);

        const hiddenInput = document.getElementById(`attendance_${studentId}`);

        presentBtn.classList.remove("active", "selected");
        absentBtn.classList.remove("active", "selected");

        presentBtn.disabled = false;
        absentBtn.disabled = false;

        presentBtn.innerHTML = "✅ Present";
        absentBtn.innerHTML = "❌ Absent";

        row.classList.remove("selected-present", "selected-absent", "row-animate");

        if (timeCell) {
            timeCell.textContent = "—";
        }

        if (hiddenInput) {
            hiddenInput.value = "";
        }

    });

    this.updateStats();

    this.updateProgressBars();

    this.clearState();

    this.showNotification("🔄 Attendance has been reset.", "warning");

};

// ============================================
// 8. FORM VALIDATION
// ============================================

AttendanceApp.validateForm = function (event) {

    const totalStudents = document.querySelectorAll(".student-row").length;

    const markedCount = Object.keys(this.attendanceData).length;

    if (markedCount === 0) {

        event.preventDefault();

        this.showNotification("⚠️ Please mark attendance first.", "error");

        return false;

    }

    if (markedCount < totalStudents) {

        const proceed = confirm(
            `Only ${markedCount} of ${totalStudents} students are marked. Continue?`
        );

        if (!proceed) {

            event.preventDefault();

            return false;

        }

    }

    if (this.elements.submitBtn) {

        this.elements.submitBtn.innerHTML = "⏳ Submitting...";

        this.elements.submitBtn.disabled = true;

    }

    return true;

};

// ============================================
// 9. NOTIFICATION SYSTEM
// ============================================

AttendanceApp.showNotification = function (message, type = "info") {

    let container = document.querySelector(".notification-container");

    if (!container) {

        container = document.createElement("div");

        container.className = "notification-container";

        container.style.cssText = `
            position:fixed;
            top:20px;
            right:20px;
            z-index:9999;
            display:flex;
            flex-direction:column;
            gap:10px;
        `;

        document.body.appendChild(container);

    }

    const colors = {

        success: "#00b894",

        error: "#e74c3c",

        warning: "#f39c12",

        info: "#3498db"

    };

    const notification = document.createElement("div");

   notification.style.cssText = `
        background:#1f2937;
        color:#ffffff;
        padding:15px 18px;
        border-left:5px solid ${colors[type]};
        border-radius:12px;
        box-shadow:0 8px 25px rgba(0,0,0,.45);
        animation:slideInRight .4s ease;
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:15px;
        min-width:320px;
        font-size:15px;
        font-weight:500;
    `;
    notification.innerHTML = `
    <span style="color:#ffffff;flex:1;">
        ${message}
    </span>

    <button
        onclick="this.parentElement.remove()"
        style="
            border:none;
            background:none;
            color:#ffffff;
            font-size:20px;
            cursor:pointer;
        ">
        ✖
    </button>
`;

    container.appendChild(notification);

    setTimeout(() => {

        notification.style.animation = "slideOutRight .4s ease";

        setTimeout(() => {

            notification.remove();

        }, 400);

    }, 4000);

};

// ============================================
// 10. LOCAL STORAGE
// ============================================

AttendanceApp.saveState = function () {

    localStorage.setItem(

        "attendance_state",

        JSON.stringify({

            attendanceData: this.attendanceData,

            date: this.currentDate

        })

    );

};

AttendanceApp.loadState = function () {

    const saved = localStorage.getItem("attendance_state");

    if (!saved) return;

    const state = JSON.parse(saved);

    if (state.date !== this.currentDate) return;

    this.attendanceData = state.attendanceData || {};

    for (let studentId in this.attendanceData) {

        this.updateStudentUI(studentId, this.attendanceData[studentId].status);

    }

    this.updateStats();

};

AttendanceApp.clearState = function () {

    localStorage.removeItem("attendance_state");

};

// ============================================
// 11. EVENT LISTENERS
// ============================================

AttendanceApp.setupEventListeners = function () {

    if (this.elements.attendanceForm) {

        this.elements.attendanceForm.addEventListener("submit", (e) => {

            this.validateForm(e);

        });

    }

    if (this.elements.resetBtn) {

        this.elements.resetBtn.addEventListener("click", () => {

            this.resetAttendance();

        });

    }

    window.addEventListener("beforeunload", () => {

        this.saveState();

    });

};

// ============================================
// 12. KEYBOARD SHORTCUTS
// ============================================

document.addEventListener("keydown", function (e) {

    if (e.ctrlKey && e.key === "r") {

        e.preventDefault();

        AttendanceApp.resetAttendance();

    }

    if (e.ctrlKey && e.key === "s") {

        e.preventDefault();

        document.getElementById("attendanceForm").requestSubmit();

    }

});

// ============================================
// 13. CSS ANIMATIONS (Dynamic)
// ============================================

const animationStyles = document.createElement("style");

animationStyles.textContent = `

@keyframes slideInRight {
    from{
        transform:translateX(100%);
        opacity:0;
    }
    to{
        transform:translateX(0);
        opacity:1;
    }
}

@keyframes slideOutRight{
    from{
        transform:translateX(0);
        opacity:1;
    }
    to{
        transform:translateX(100%);
        opacity:0;
    }
}

@keyframes numberPulse{
    0%{
        transform:scale(1);
    }
    50%{
        transform:scale(1.2);
        color:#667eea;
    }
    100%{
        transform:scale(1);
    }
}

@keyframes rowHighlight{
    from{
        background:#eef4ff;
    }
    to{
        background:transparent;
    }
}

.row-animate{
    animation:rowHighlight .6s ease;
}

.btn-attendance.selected{
    transform:scale(1.05);
}

.notification-container{
    font-family:Arial,sans-serif;
}

@media(max-width:768px){

.notification-container{

left:10px;
right:10px;
top:10px;

}

}

`;

document.head.appendChild(animationStyles);

// ============================================
// 14. GLOBAL FUNCTIONS
// ============================================

window.setAttendance = function(studentId,status){

AttendanceApp.setAttendance(studentId,status);

};

window.resetAttendance = function(){

AttendanceApp.resetAttendance();

};

window.updateStats=function(){

AttendanceApp.updateStats();

};

// ============================================
// 15. DEBUG
// ============================================

console.log("🎓 Student Attendance System Loaded Successfully!");

console.log(AttendanceApp);

// ============================================
// END OF FILE
// ============================================