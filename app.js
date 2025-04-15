document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initApp();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load data from local storage
    loadData();
    
    // Update the dashboard
    updateDashboard();
    
    // Add export button
    addExportButton();
    
    // Enhance form layout for better usability
    enhanceFormLayout();
    
    // Add window resize handler
    window.addEventListener('resize', function() {
        // Check for table scrollability on resize
        if (window.innerWidth <= 576) {
            document.querySelectorAll('.data-table').forEach(table => {
                if (table.scrollWidth > table.clientWidth) {
                    table.classList.add('has-scroll');
                } else {
                    table.classList.remove('has-scroll');
                }
            });
        }
    });
});

// App variables
let feedingData = {
    pumping: [],
    bottle: [],
    direct: []
};

let currentView = {
    // page: 'dashboard',
    // entryType: 'pump',
    // reportType: 'daily',
    // reportDate: new Date()
    page: 'add-entry',  // Changed from 'dashboard' to 'add-entry'
    entryType: 'pump',
    reportType: 'daily',
    reportDate: new Date()
};

// Chart references
let timelineChart = null;
let milkChart = null;
let feedingPatternChart = null;

// Initialize the app
function initApp() {
    // Set all date inputs to today's date
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.value = today;
        input.max = today;
    });
    
    // Set default duration for bottle feeding
    document.getElementById('bottle-duration').value = "05:00"; // Default 5 minutes
    
    // Initialize charts
    initializeCharts();

    // Set Add Entry as the default active page
    setActivePage('add-entry');
}

// Set up event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setActivePage(this.dataset.page);
        });
    });
    
    // Entry type buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setActiveEntryType(this.dataset.type);
        });
    });
    
    // Report type buttons
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setActiveReportType(this.dataset.report);
        });
    });
    
    // Date navigation
    document.getElementById('prev-date').addEventListener('click', function() {
        navigateDate(-1);
    });
    
    document.getElementById('next-date').addEventListener('click', function() {
        navigateDate(1);
    });
    
    // Form submissions
    document.getElementById('pump-form').addEventListener('submit', handlePumpFormSubmit);
    document.getElementById('bottle-form').addEventListener('submit', handleBottleFormSubmit);
    document.getElementById('direct-form').addEventListener('submit', handleDirectFormSubmit);
    
    // Setup tab navigation
    setupTabNavigation();
}

// Setup tab navigation
function setupTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            const tabContainer = this.closest('.page').querySelector('.tab-content').parentElement;
            
            // Update active button
            this.closest('.tab-nav').querySelectorAll('.tab-btn').forEach(b => {
                b.classList.toggle('active', b === this);
            });
            
            // Show active tab content
            tabContainer.querySelectorAll('.tab-content').forEach(content => {
                content.classList.toggle('active', content.id === tabId);
            });
        });
    });
}

// Set active page
function setActivePage(page) {
    // Update current view
    currentView.page = page;
    
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
    
    // Show active page
    document.querySelectorAll('.page').forEach(pageEl => {
        pageEl.classList.toggle('active', pageEl.id === page);
    });
    
    // Update reports if on the reports page
    if (page === 'reports') {
        updateReports();
    }
}

// Set active entry type
function setActiveEntryType(type) {
    // Update current view
    currentView.entryType = type;
    
    // Update active button
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    
    // Show active form
    document.querySelectorAll('.entry-form').forEach(form => {
        form.classList.toggle('active', form.id === `${type}-form`);
    });
}

// Set active report type
function setActiveReportType(type) {
    // Update current view
    currentView.reportType = type;
    
    // Update active button
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.report === type);
    });
    
    // Update the reports
    updateReports();
}

// Navigate date for reports
function navigateDate(direction) {
    const date = currentView.reportDate;
    
    switch (currentView.reportType) {
        case 'daily':
            date.setDate(date.getDate() + direction);
            break;
        case 'weekly':
            date.setDate(date.getDate() + (direction * 7));
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + direction);
            break;
    }
    
    // Ensure we don't go into the future
    if (date > new Date()) {
        date.setTime(new Date().getTime());
    }
    
    // Update current date display
    updateCurrentDateDisplay();
    
    // Update reports
    updateReports();
}

// Update current date display
function updateCurrentDateDisplay() {
    const dateEl = document.getElementById('current-date');
    const date = currentView.reportDate;
    const today = new Date();
    
    // Check if the date is today
    if (date.toDateString() === today.toDateString()) {
        dateEl.textContent = 'Today';
        return;
    }
    
    // Format date based on report type
    switch (currentView.reportType) {
        case 'daily':
            dateEl.textContent = date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            break;
        case 'weekly':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            dateEl.textContent = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            break;
        case 'monthly':
            dateEl.textContent = date.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });
            break;
    }
}

// Format minutes as HH:MM
function formatDuration(minutes) {
    if (!minutes && minutes !== 0) return '';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Initialize charts
function initializeCharts() {
    // Today's timeline chart
    const timelineCtx = document.getElementById('today-timeline').getContext('2d');
    timelineChart = new Chart(timelineCtx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => i),
            datasets: [
                {
                    label: 'Pumping',
                    backgroundColor: 'rgba(92, 124, 250, 0.6)',
                    data: []
                },
                {
                    label: 'Bottle Feeding',
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                    data: []
                },
                {
                    label: 'Nursing',
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 10
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 9
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 9
                        }
                    }
                }
            }
        }
    });
    
    // Milk production vs. consumption chart
    const milkCtx = document.getElementById('milk-chart').getContext('2d');
    milkChart = new Chart(milkCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Produced (oz)',
                    backgroundColor: 'rgba(92, 124, 250, 0.6)',
                    data: []
                },
                {
                    label: 'Consumed (oz)',
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 10
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 9
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 9
                        }
                    }
                }
            }
        }
    });
    
    // Feeding patterns chart
    const patternCtx = document.getElementById('feeding-pattern-chart').getContext('2d');
    feedingPatternChart = new Chart(patternCtx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => i),
            datasets: [
                {
                    label: 'Feedings',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    data: [],
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 10
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 9
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 9
                        }
                    }
                }
            }
        }
    });
}

// Handle pump form submission
function handlePumpFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const date = document.getElementById('pump-date').value;
    const startTime = document.getElementById('pump-start').value;
    const endTime = document.getElementById('pump-end').value;
    const amount = parseFloat(document.getElementById('pump-amount').value);
    const notes = document.getElementById('pump-notes').value;
    
    // Create start and end datetime objects
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    
    // Calculate duration in minutes
    const durationMinutes = Math.round((endDateTime - startDateTime) / (1000 * 60));
    
    // Validate times
    if (endDateTime <= startDateTime) {
        // alert('End time must be after start time');
        showToast('End time must be after start time', 'error');
        return;
    }
    
    // Add to pumping data
    feedingData.pumping.push({
        date: date,
        startTime: startTime,
        endTime: endTime,
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        duration: durationMinutes,
        amount: amount,
        notes: notes,
        timestamp: new Date().getTime()
    });
    
    // Save data and update UI
    saveData();
    updateDashboard();
    
    // Reset form
    e.target.reset();
    document.getElementById('pump-date').value = new Date().toISOString().split('T')[0];
    
    // Show confirmation
    showToast('Pumping session saved!');
}

function validateDuration(durationStr) {
    // Check if format matches mm:ss (1-2 digits for minutes, 2 digits for seconds)
    const regex = /^([0-9]{1,2}):([0-9]{2})$/;
    const match = durationStr.match(regex);
    
    if (!match) {
        return false;
    }
    
    // Check if seconds are less than 60
    const seconds = parseInt(match[2]);
    if (seconds >= 60) {
        return false;
    }
    
    return true;
}

// Handle bottle form submission
function handleBottleFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const date = document.getElementById('bottle-date').value;
    const time = document.getElementById('bottle-time').value;
    const amount = parseFloat(document.getElementById('bottle-amount').value);
    const type = document.querySelector('input[name="bottle-type"]:checked').value;
    const notes = document.getElementById('bottle-notes').value;
    const durationStr = document.getElementById('bottle-duration').value;

    if (!validateDuration(durationStr)) {
        // Show error message
        showToast('Please enter a valid duration in the format mm:ss (e.g., 05:00 for 5 minutes).\nSeconds must be less than 60.', 'error');
        
        // Focus on the duration field
        document.getElementById('bottle-duration').focus();
        return;
    }
    
    // Parse duration from mm:ss format to minutes
    let duration = 0;
    if (durationStr) {
        const [minutes, seconds] = durationStr.split(':').map(Number);
        duration = minutes + (seconds / 60);
    }
    
    // Create datetime object
    const dateTime = new Date(`${date}T${time}`);
    
    // Add to bottle data
    feedingData.bottle.push({
        date: date,
        time: time,
        dateTime: dateTime,
        amount: amount,
        type: type,
        duration: duration,
        notes: notes,
        timestamp: new Date().getTime()
    });
    
    // Save data and update UI
    saveData();
    updateDashboard();
    
    // Reset form
    e.target.reset();
    document.getElementById('bottle-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('bottle-type-breast').checked = true;
    document.getElementById('bottle-duration').value = "05:00"; // Default 5 minutes
    
    // Show confirmation
    showToast('Bottle feeding saved!');
}

// Handle direct form submission
function handleDirectFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const date = document.getElementById('direct-date').value;
    const startTime = document.getElementById('direct-start').value;
    const endTime = document.getElementById('direct-end').value;
    const breast = document.querySelector('input[name="breast"]:checked').value;
    const notes = document.getElementById('direct-notes').value;
    
    // Create start and end datetime objects
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    
    // Calculate duration in minutes
    const durationMinutes = Math.round((endDateTime - startDateTime) / (1000 * 60));
    
    // Validate times
    if (endDateTime <= startDateTime) {
        showToast('End time must be after start time', 'error');
        return;
    }
    
    // Add to direct feeding data
    feedingData.direct.push({
        date: date,
        startTime: startTime,
        endTime: endTime,
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        duration: durationMinutes,
        breast: breast,
        notes: notes,
        timestamp: new Date().getTime()
    });
    
    // Save data and update UI
    saveData();
    updateDashboard();
    
    // Reset form
    e.target.reset();
    document.getElementById('direct-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('breast-left').checked = true;
    
    // Show confirmation
    showToast('Nursing feeding saved!');
}

// Save data to local storage
function saveData() {
    localStorage.setItem('feedingData', JSON.stringify(feedingData));
}

// Load data from local storage
function loadData() {
    const savedData = localStorage.getItem('feedingData');
    if (savedData) {
        feedingData = JSON.parse(savedData);
        
        // Convert string dates back to Date objects
        feedingData.pumping.forEach(item => {
            item.startDateTime = new Date(item.startDateTime);
            item.endDateTime = new Date(item.endDateTime);
        });
        
        feedingData.bottle.forEach(item => {
            item.dateTime = new Date(item.dateTime);
        });
        
        feedingData.direct.forEach(item => {
            item.startDateTime = new Date(item.startDateTime);
            item.endDateTime = new Date(item.endDateTime);
        });
    }
}

// Update dashboard with current data
function updateDashboard() {
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Filter today's data
    const todayPumping = feedingData.pumping.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= today && itemDate < tomorrow;
    });
    
    const todayBottle = feedingData.bottle.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= today && itemDate < tomorrow;
    });
    
    const todayDirect = feedingData.direct.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= today && itemDate < tomorrow;
    });
    
    // Calculate total milk produced today
    const milkProduced = todayPumping.reduce((total, item) => total + item.amount, 0);
    document.getElementById('milk-produced').textContent = milkProduced.toFixed(1);
    
    // Calculate total milk consumed today (from bottles)
    const milkConsumed = todayBottle
        .filter(item => item.type === 'breast')
        .reduce((total, item) => total + item.amount, 0);
    document.getElementById('milk-consumed').textContent = milkConsumed.toFixed(1);
    
    // Count direct feedings
    document.getElementById('direct-feedings').textContent = todayDirect.length;
    
    // Update recent activities
    updateRecentActivities();
    
    // Update timeline chart
    updateTimelineChart(todayPumping, todayBottle, todayDirect);
    
    // Update feeding summary
    updateFeedingSummary(todayPumping, todayBottle, todayDirect);
    
    // Update today's feeding log table
    updateTodayFeedingLog(todayPumping, todayBottle, todayDirect);
}

// Update feeding summary
function updateFeedingSummary(pumping, bottle, direct) {
    // Pumping summary
    const pumpingCount = pumping.length;
    const pumpingTotalDuration = pumping.reduce((sum, item) => sum + item.duration, 0);
    const pumpingAvgDuration = pumpingCount > 0 ? Math.round(pumpingTotalDuration / pumpingCount) : 0;
    
    document.querySelector('#summary-pumping td:nth-child(2)').textContent = pumpingCount;
    document.querySelector('#summary-pumping td:nth-child(3)').textContent = formatDuration(pumpingTotalDuration);
    document.querySelector('#summary-pumping td:nth-child(4)').textContent = formatDuration(pumpingAvgDuration);
    
    // Bottle summary (using actual duration data)
    const bottleCount = bottle.length;
    const bottleTotalDuration = bottle.reduce((sum, item) => sum + (item.duration || 5), 0);
    const bottleAvgDuration = bottleCount > 0 ? bottleTotalDuration / bottleCount : 0;
    
    document.querySelector('#summary-bottle td:nth-child(2)').textContent = bottleCount;
    document.querySelector('#summary-bottle td:nth-child(3)').textContent = formatDuration(bottleTotalDuration);
    document.querySelector('#summary-bottle td:nth-child(4)').textContent = formatDuration(bottleAvgDuration);
    
    // Direct feeding summary
    const directCount = direct.length;
    const directTotalDuration = direct.reduce((sum, item) => sum + item.duration, 0);
    const directAvgDuration = directCount > 0 ? Math.round(directTotalDuration / directCount) : 0;
    
    document.querySelector('#summary-direct td:nth-child(2)').textContent = directCount;
    document.querySelector('#summary-direct td:nth-child(3)').textContent = formatDuration(directTotalDuration);
    document.querySelector('#summary-direct td:nth-child(4)').textContent = formatDuration(directAvgDuration);
}

// Update recent activities in the dashboard
function updateRecentActivities() {
    const recentActivitiesEl = document.getElementById('recent-activities');
    
    // Combine all activities and sort by timestamp (newest first)
    let allActivities = [
        ...feedingData.pumping.map(item => ({ ...item, type: 'Pumping' })),
        ...feedingData.bottle.map(item => ({ ...item, type: 'Bottle' })),
        ...feedingData.direct.map(item => ({ ...item, type: 'Nursing' }))
    ].sort((a, b) => b.timestamp - a.timestamp);
    
    // Take only the 5 most recent
    allActivities = allActivities.slice(0, 5);
    
    if (allActivities.length === 0) {
        recentActivitiesEl.innerHTML = '<p>No recent activities</p>';
        return;
    }
    
    // Format activities
    let html = '<ul class="activity-list">';
    
    allActivities.forEach(activity => {
        let details = '';
        let duration = '';
        
        switch (activity.type) {
            case 'Pumping':
                details = `${activity.amount} oz`;
                duration = formatDuration(activity.duration);
                break;
            case 'Bottle':
                details = `${activity.amount} oz, ${activity.type === 'breast' ? 'breast milk' : 'formula'}`;
                duration = formatDuration(activity.duration || 5); // Use actual duration or default to 5 minutes
                break;
            case 'Nursing':
                details = `${activity.breast} breast`;
                duration = formatDuration(activity.duration);
                break;
        }
        
        const time = activity.time || activity.startTime;
        html += `
            <li>
                <strong>${activity.type}</strong> - 
                ${new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                at ${time} 
                <span class="activity-details">${details}, ${duration}</span>
            </li>
        `;
    });
    
    html += '</ul>';
    recentActivitiesEl.innerHTML = html;
}

// Update today's feeding log table
function updateTodayFeedingLog(pumping, bottle, direct) {
    const tableBody = document.querySelector('#today-feeding-log tbody');
    
    // Combine all activities and sort by datetime (newest first)
    let allActivities = [];
    
    // Add pumping activities
    pumping.forEach(item => {
        allActivities.push({
            type: 'Pumping',
            dateTime: item.startDateTime,
            details: `${item.amount} oz`,
            duration: item.duration,
            notes: item.notes
        });
    });
    
    // Add bottle feeding activities
    bottle.forEach(item => {
        allActivities.push({
            type: 'Bottle',
            dateTime: item.dateTime,
            details: `${item.amount} oz, ${item.type === 'breast' ? 'breast milk' : 'formula'}`,
            duration: item.duration || 5, // Use actual duration or default to 5 minutes
            notes: item.notes
        });
    });
    
    // Add direct feeding activities
    direct.forEach(item => {
        allActivities.push({
            type: 'Nursing',
            dateTime: item.startDateTime,
            details: `${item.breast} breast`,
            duration: item.duration,
            notes: item.notes
        });
    });
    
    // Sort by datetime (newest first)
    allActivities.sort((a, b) => b.dateTime - a.dateTime);
    
    // Build table HTML
    let html = '';
    
    if (allActivities.length === 0) {
        html = '<tr><td colspan="4" class="text-center">No feeding data for today</td></tr>';
    } else {
        allActivities.forEach(activity => {
            const time = activity.dateTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
            
            const formattedDuration = formatDuration(activity.duration);
            
            html += `
                <tr>
                    <td class="time-column">${time}</td>
                    <td>${activity.type}</td>
                    <td class="duration-column">${formattedDuration}</td>
                    <td>
                        ${activity.details}
                        ${activity.notes ? `<br><small>${activity.notes}</small>` : ''}
                    </td>
                </tr>
            `;
        });
    }
    
    tableBody.innerHTML = html;
}

// Update timeline chart
function updateTimelineChart(pumping, bottle, direct) {
    // Initialize hourly data arrays
    const pumpingByHour = Array(24).fill(0);
    const bottleByHour = Array(24).fill(0);
    const directByHour = Array(24).fill(0);
    
    // Aggregate pumping data by hour
    pumping.forEach(item => {
        const hour = new Date(item.startDateTime).getHours();
        pumpingByHour[hour] += item.duration;
    });
    
    // Aggregate bottle data by hour (use 10 minutes as an estimate for bottle feeding duration)
    bottle.forEach(item => {
        const hour = new Date(item.dateTime).getHours();
        bottleByHour[hour] += item.duration || 5;  // Use actual duration or default to 5 minutes
    });
    
    // Aggregate direct feeding data by hour
    direct.forEach(item => {
        const hour = new Date(item.startDateTime).getHours();
        directByHour[hour] += item.duration;
    });
    
    // Update chart data
    timelineChart.data.datasets[0].data = pumpingByHour;
    timelineChart.data.datasets[1].data = bottleByHour;
    timelineChart.data.datasets[2].data = directByHour;
    
    // Update the chart
    timelineChart.update();
}

// Update reports
function updateReports() {
    // Set the current date display
    updateCurrentDateDisplay();
    
    // Get data based on report type and date
    const reportData = getReportData();
    
    // Update milk chart
    updateMilkChart(reportData);
    
    // Update feeding pattern chart
    updateFeedingPatternChart(reportData);
    
    // Update feeding log table
    updateFeedingLog(reportData);
}

// Get data for the current report
function getReportData() {
    const reportType = currentView.reportType;
    const reportDate = currentView.reportDate;
    
    // Initialize date range
    let startDate, endDate;
    
    switch (reportType) {
        case 'daily':
            // Set to start of the selected day
            startDate = new Date(reportDate);
            startDate.setHours(0, 0, 0, 0);
            
            // Set to end of the selected day
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            break;
            
        case 'weekly':
            // Set to start of the week (Sunday)
            startDate = new Date(reportDate);
            startDate.setDate(reportDate.getDate() - reportDate.getDay());
            startDate.setHours(0, 0, 0, 0);
            
            // Set to end of the week (Saturday)
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);
            break;
            
        case 'monthly':
            // Set to start of the month
            startDate = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
            
            // Set to start of next month
            endDate = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 1);
            break;
    }
    
    // Filter data for the date range
    const filteredPumping = feedingData.pumping.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate < endDate;
    });
    
    const filteredBottle = feedingData.bottle.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate < endDate;
    });
    
    const filteredDirect = feedingData.direct.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate < endDate;
    });
    
    // Create labels for the charts based on report type
    let labels = [];
    
    switch (reportType) {
        case 'daily':
            // Hourly labels for daily view
            labels = Array.from({length: 24}, (_, i) => i);
            break;
            
        case 'weekly':
            // Day of week labels for weekly view
            labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            break;
            
        case 'monthly':
            // Day of month labels for monthly view
            const daysInMonth = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0).getDate();
            labels = Array.from({length: daysInMonth}, (_, i) => i + 1);
            break;
    }
    
    return {
        startDate,
        endDate,
        labels,
        pumping: filteredPumping,
        bottle: filteredBottle,
        direct: filteredDirect
    };
}

// Update milk production vs. consumption chart
function updateMilkChart(reportData) {
    const { labels, pumping, bottle } = reportData;
    const reportType = currentView.reportType;
    
    // Initialize data arrays
    const milkProduced = Array(labels.length).fill(0);
    const milkConsumed = Array(labels.length).fill(0);
    
    // Aggregate pumping data
    pumping.forEach(item => {
        let index = 0;
        
        switch (reportType) {
            case 'daily':
                index = new Date(item.startDateTime).getHours();
                break;
                
            case 'weekly':
                index = new Date(item.date).getDay();
                break;
                
            case 'monthly':
                index = new Date(item.date).getDate() - 1;
                break;
        }
        
        milkProduced[index] += item.amount;
    });
    
    // Aggregate bottle data (only breast milk)
    bottle.filter(item => item.type === 'breast').forEach(item => {
        let index = 0;
        
        switch (reportType) {
            case 'daily':
                index = new Date(item.dateTime).getHours();
                break;
                
            case 'weekly':
                index = new Date(item.date).getDay();
                break;
                
            case 'monthly':
                index = new Date(item.date).getDate() - 1;
                break;
        }
        
        milkConsumed[index] += item.amount;
    });
    
    // Update chart data
    milkChart.data.labels = labels;
    milkChart.data.datasets[0].data = milkProduced;
    milkChart.data.datasets[1].data = milkConsumed;
    
    // Update chart
    milkChart.update();
}

// Update feeding pattern chart
function updateFeedingPatternChart(reportData) {
    const { labels, bottle, direct } = reportData;
    const reportType = currentView.reportType;
    
    // Initialize data array for total feedings (bottle + direct)
    const totalFeedings = Array(labels.length).fill(0);
    
    // Aggregate bottle feeding data
    bottle.forEach(item => {
        let index = 0;
        
        switch (reportType) {
            case 'daily':
                index = new Date(item.dateTime).getHours();
                break;
                
            case 'weekly':
                index = new Date(item.date).getDay();
                break;
                
            case 'monthly':
                index = new Date(item.date).getDate() - 1;
                break;
        }
        
        totalFeedings[index]++;
    });
    
    // Aggregate direct feeding data
    direct.forEach(item => {
        let index = 0;
        
        switch (reportType) {
            case 'daily':
                index = new Date(item.startDateTime).getHours();
                break;
                
            case 'weekly':
                index = new Date(item.date).getDay();
                break;
                
            case 'monthly':
                index = new Date(item.date).getDate() - 1;
                break;
        }
        
        totalFeedings[index]++;
    });
    
    // Update chart data
    feedingPatternChart.data.labels = labels;
    feedingPatternChart.data.datasets[0].data = totalFeedings;
    
    // Update chart
    feedingPatternChart.update();
}

// Update feeding log table
function updateFeedingLog(reportData) {
    const { pumping, bottle, direct } = reportData;
    const tableBody = document.querySelector('#feeding-log tbody');
    
    // Combine all activities and sort by datetime (newest first)
    let allActivities = [];
    
    // Add pumping activities
    pumping.forEach(item => {
        allActivities.push({
            type: 'Pumping',
            dateTime: item.startDateTime,
            details: `${item.amount} oz`,
            duration: item.duration,
            notes: item.notes
        });
    });
    
    // Add bottle feeding activities
    bottle.forEach(item => {
        allActivities.push({
            type: 'Bottle',
            dateTime: item.dateTime,
            details: `${item.amount} oz, ${item.type === 'breast' ? 'breast milk' : 'formula'}`,
            duration: item.duration || 5, // Use actual duration or default to 5 minutes
            notes: item.notes
        });
    });
    
    // Add direct feeding activities
    direct.forEach(item => {
        allActivities.push({
            type: 'Nursing',
            dateTime: item.startDateTime,
            details: `${item.breast} breast`,
            duration: item.duration,
            notes: item.notes
        });
    });
    
    // Sort by datetime (newest first)
    allActivities.sort((a, b) => b.dateTime - a.dateTime);
    
    // Build table HTML
    let html = '';
    
    if (allActivities.length === 0) {
        html = '<tr><td colspan="4" class="text-center">No feeding data for this period</td></tr>';
    } else {
        allActivities.forEach(activity => {
            const time = activity.dateTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
            
            const date = activity.dateTime.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            const formattedDuration = formatDuration(activity.duration);
            
            html += `
                <tr>
                    <td class="time-column">${date} ${time}</td>
                    <td>${activity.type}</td>
                    <td class="duration-column">${formattedDuration}</td>
                    <td>
                        ${activity.details}
                        ${activity.notes ? `<br><small>${activity.notes}</small>` : ''}
                    </td>
                </tr>
            `;
        });
    }
    
    tableBody.innerHTML = html;
}

// Add export button to the UI
function addExportButton() {
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export Data';
    exportBtn.className = 'export-btn';
    exportBtn.addEventListener('click', exportData);
    
    // Add to reports page
    const reportsPage = document.getElementById('reports');
    reportsPage.insertBefore(exportBtn, reportsPage.firstChild);
}

// Export data as CSV
function exportData() {
    // Combine all data
    const allData = [
        ...feedingData.pumping.map(item => ({
            ...item,
            type: 'Pumping'
        })),
        ...feedingData.bottle.map(item => ({
            ...item,
            type: 'Bottle'
        })),
        ...feedingData.direct.map(item => ({
            ...item,
            type: 'Nursing'
        }))
    ];
    
    // Sort by date/time
    allData.sort((a, b) => {
        const dateA = a.startDateTime || a.dateTime;
        const dateB = b.startDateTime || b.dateTime;
        return dateA - dateB;
    });
    
    // Define CSV headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Time,Type,Amount (oz),Duration,Breast,Notes\n";
    
    // Add data rows
    allData.forEach(item => {
        const date = item.date;
        const time = item.startTime || item.time || '';
        const type = item.type;
        const amount = item.amount || '';
        const duration = item.duration ? formatDuration(item.duration) : '';
        const breast = item.breast || '';
        const notes = item.notes ? `"${item.notes.replace(/"/g, '""')}"` : '';
        
        csvContent += `${date},${time},${type},${amount},${duration},${breast},${notes}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `baby_feeding_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
}

// Enhance form layout for better usability
function enhanceFormLayout() {
    // Add grid layout container for better form organization on larger screens
    document.querySelectorAll('.entry-form').forEach(form => {
        // Group date and time fields together
        const formGroups = form.querySelectorAll('.form-group');
        
        // Create a grid container for the first four fields (typically date/time fields)
        if (formGroups.length >= 4) {
            const gridContainer = document.createElement('div');
            gridContainer.className = 'form-grid';
            
            // Move the first four form groups into the grid
            for (let i = 0; i < Math.min(4, formGroups.length); i++) {
                const group = formGroups[i];
                form.removeChild(group);
                gridContainer.appendChild(group);
            }
            
            // Insert the grid at the top of the form
            form.insertBefore(gridContainer, form.firstChild);
        }
    });
    
    // Add scroll hint to tables on mobile
    if (window.innerWidth <= 576) {
        document.querySelectorAll('.data-table').forEach(table => {
            if (table.scrollWidth > table.clientWidth) {
                table.classList.add('has-scroll');
            }
        });
    }
}

function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    let icon = '💬';
    if (type === 'error') icon = '❌';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    
    // Set title based on type
    let title = 'Information';
    if (type === 'error') title = 'Error';
    if (type === 'success') title = 'Success';
    if (type === 'warning') title = 'Warning';
    
    // Create toast content
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, duration);
    
    return toast;
}
