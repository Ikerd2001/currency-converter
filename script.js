let chart;
const apiKey = "cur_live_bBemwZ0uQskoVA3QXTsPn8lDK6vhdH6wXIPEkaZQ";
let conversionHistory = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load any saved program history from localStorage
    loadHistory();
    fetchHistoricalData();
    
    // allow user to use enter instead of pressing the conver button
    document.getElementById("amount").addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            convertCurrency();
        }
    });
});

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    // Save light or dark mode preference to localStorage
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
}

// Check for saved dark mode preference
if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
}

// Switches from and to currencies
function switchCurrencies() {
    const fromCurrency = document.getElementById("fromCurrency");
    const toCurrency = document.getElementById("toCurrency");
    const temp = fromCurrency.value;
    
    // Set values
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    
    // Update chart and data
    currencyChanged();
}

// Handle currency change
function currencyChanged() {
    // Clear the result
    document.getElementById("result").textContent = "0";
    
    // Update the chart
    fetchHistoricalData();
}

// Update trend range
function updateTrendRange() {
    fetchHistoricalData();
}

async function convertCurrency() {
    const fromCurrency = document.getElementById("fromCurrency").value;
    const toCurrency = document.getElementById("toCurrency").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const errorElement = document.getElementById("error");
    const loader = document.getElementById("loader");
    
    // Input validation
    if (isNaN(amount)) {
        showError("Please enter a valid amount");
        return;
    }
    if (amount <= 0) {
        showError("Amount must be greater than zero");
        return;
    }
    
    hideError();
    loader.style.display = "block";
    
    try {
        const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${apiKey}&base_currency=${fromCurrency}&currencies=${toCurrency}`);
        const data = await response.json();
        
        if (data.data && data.data[toCurrency]) {
            const rate = data.data[toCurrency].value;
            const result = amount * rate;
            document.getElementById("result").textContent = result.toFixed(2) + " " + toCurrency;
            document.getElementById("currentRate").textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
            
            // Add to history
            addToHistory(fromCurrency, toCurrency, amount, result);
        } else {
            throw new Error("Failed to fetch exchange rates");
        }
    } catch (error) {
        console.error("Error:", error);
        showError("An error occurred while fetching data. Please try again later.");
    } finally {
        loader.style.display = "none";
    }
}

async function fetchHistoricalData() {
    const fromCurrency = document.getElementById("fromCurrency").value;
    const toCurrency = document.getElementById("toCurrency").value;
    const days = parseInt(document.getElementById("trendRange").value);
    const loader = document.getElementById("loader");
    
    loader.style.display = "block";
    
    try {
        // Simulation using current rates for demonstration
        const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${apiKey}&base_currency=${fromCurrency}&currencies=${toCurrency}`);
        const data = await response.json();
        
        if (data.data && data.data[toCurrency]) {
            // Simulate historical data for demonstration
            const currentRate = data.data[toCurrency].value;
            const labels = generateDateLabels(days);
            const values = generateSimulatedRates(currentRate, days);
            
            updateChart(labels, values, `${fromCurrency} to ${toCurrency} Exchange Rate`);
            updatePercentageChange(values);
        } else {
            throw new Error("Failed to fetch exchange rates");
        }
    } catch (error) {
        console.error("Error:", error);
        showError("Could not load historical trends. Showing sample data.");
        
        // Fallback with sample data
        const labels = generateDateLabels(days);
        const values = generateSimulatedRates(0.2, days);
        updateChart(labels, values, "Sample Exchange Rate Data");
        updatePercentageChange(values);
    } finally {
        loader.style.display = "none";
    }
}

function updatePercentageChange(values) {
    if (values.length >= 2) {
        const firstValue = values[0];
        const lastValue = values[values.length - 1];
        const change = ((lastValue - firstValue) / firstValue) * 100;
        
        const percentageElement = document.getElementById("percentageChange");
        if (change > 0) {
            percentageElement.textContent = `+${change.toFixed(2)}%`;
            percentageElement.style.color = "#4CAF50";
        } else if (change < 0) {
            percentageElement.textContent = `${change.toFixed(2)}%`;
            percentageElement.style.color = "#e74c3c";
        } else {
            percentageElement.textContent = "0.00%";
            percentageElement.style.color = "#888";
        }
    }
}

function generateDateLabels(days) {
    const labels = [];
    for (let i = days-1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString());
    }
    return labels;
}

//Not gonna lie not sure what this does
function generateSimulatedRates(baseRate, count) {
    const rates = [];
    let currentRate = baseRate;
    
    for (let i = 0; i < count; i++) {
        // Add more realistic random variation with some trend
        const trendBias = Math.random() > 0.5 ? 0.001 : -0.001; // Slight trend direction
        const variation = (Math.random() * 0.03) - 0.015 + trendBias; // ±1.5% with slight trend
        
        currentRate = currentRate * (1 + variation);
        rates.push(currentRate);
    }
    return rates;
}

function updateChart(labels, values, label) {
    const ctx = document.getElementById("currencyChart").getContext("2d");
    
    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = values;
        chart.data.datasets[0].label = label;
        chart.update();
    } else {
        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: values,
                    borderColor: "#4CAF50",
                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `Rate: ${parseFloat(context.raw).toFixed(4)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(4);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
}

function addToHistory(fromCurrency, toCurrency, amount, result) {
    const now = new Date();
    const historyItem = {
        date: now.toLocaleString(),
        fromCurrency,
        toCurrency,
        amount,
        result
    };
    
    // Adds to the beginning of the array
    conversionHistory.unshift(historyItem);
    
    // Keeps only the last 10 requests
    if (conversionHistory.length > 10) {
        conversionHistory.pop();
    }
    
    // Saves history to localStorage
    saveHistory();
    
  
    updateHistoryList();
}

function updateHistoryList() {
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";
    
    if (conversionHistory.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "No conversion history yet";
        historyList.appendChild(emptyItem);
        return;
    }
    
    conversionHistory.forEach(item => {
        const listItem = document.createElement("li");
        listItem.textContent = `${item.date}: ${item.amount.toFixed(2)} ${item.fromCurrency} = ${item.result.toFixed(2)} ${item.toCurrency}`;
        historyList.appendChild(listItem);
    });
}

function saveHistory() {
    localStorage.setItem("conversionHistory", JSON.stringify(conversionHistory));
}

function loadHistory() {
    const savedHistory = localStorage.getItem("conversionHistory");
    if (savedHistory) {
        conversionHistory = JSON.parse(savedHistory);
        updateHistoryList();
    }
}

function exportToCSV() {
    if (conversionHistory.length === 0) {
        showError("No conversion history to export");
        return;
    }
    
    // Creates CSV content
    let csvContent = "Date,From Currency,To Currency,Amount,Result\n";
    
    conversionHistory.forEach(item => {
        csvContent += `"${item.date}",${item.fromCurrency},${item.toCurrency},${item.amount.toFixed(2)},${item.result.toFixed(2)}\n`;
    });
    
    // Creates the download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `currency_conversion_history_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showError(message) {
    const errorElement = document.getElementById("error");
    errorElement.textContent = message;
    errorElement.classList.add("show");
    
    // Hide the error after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    const errorElement = document.getElementById("error");
    errorElement.textContent = "";
    errorElement.classList.remove("show");
}