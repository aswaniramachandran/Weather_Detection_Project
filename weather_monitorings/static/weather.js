const API_KEY = '4096e9a26b0c7996c932bf0d359e7387'; // Replace with your actual API key
const cities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];

let maxThreshold = 35; // Default maximum threshold set to 30°C
let consecutiveExceeds = {}; // Track consecutive updates per city
let updateInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
let isCelsius = true; // Track current temperature unit
let dailySummaries = []; // To store daily weather summaries

// Function to convert Kelvin to Celsius
function convertToCelsius(kelvin) {
    return kelvin - 273.15;
}

// Function to convert Celsius to Fahrenheit
function convertToFahrenheit(celsius) {
    return (celsius * 9 / 5) + 32;
}

// Simulated email alert function
function sendEmailAlert(cityName, temperature) {
    console.log(`Sending email alert: The temperature in ${cityName} is ${temperature}°C and exceeds the threshold!`);
}

// Function to set temperature thresholds
function setThresholds() {
    const inputValue = parseFloat(document.getElementById('maxTemperature').value);
    if (!isNaN(inputValue)) {
        maxThreshold = inputValue;
        console.log(`Threshold set to ${maxThreshold}°C`);
        document.getElementById('currentThreshold').innerText = `Current Max Threshold: ${maxThreshold}°C`;
    } else {
        console.error('Invalid input for threshold value.');
    }
}

// Function to check temperature thresholds and trigger alert if breached
function checkThresholds(cityWeather) {
    const temperature = cityWeather.main.temp; 
    const cityName = cityWeather.name;

    console.log(`Checking ${cityName} - Current Temp: ${temperature}°C, Max Threshold: ${maxThreshold}°C`);

    if (temperature > maxThreshold) {
        consecutiveExceeds[cityName] = (consecutiveExceeds[cityName] || 0) + 1;

        if (consecutiveExceeds[cityName] >= 2) {
            alert(`Alert: Temperature exceeds ${maxThreshold}°C for ${consecutiveExceeds[cityName]} consecutive updates in ${cityName}. Current: ${temperature}°C`);
            sendEmailAlert(cityName, temperature); 
        }
    } else {
        consecutiveExceeds[cityName] = 0;
    }
}



// Function to create a weather card and append to the DOM
function createWeatherCard(cityWeather) {
    const weatherContainer = document.getElementById('weather-container');

    const weatherItem = document.createElement('div');
    weatherItem.className = 'weather-item';

    const tempC = Math.round(cityWeather.main.temp);
    const feelsLikeC = Math.round(cityWeather.main.feels_like);
    const cityName = cityWeather.name;
    const tempF = Math.round(convertToFahrenheit(tempC));

    weatherItem.innerHTML = `
        <h2>${cityName}</h2>
        <div class="temperature" data-temp-c="${tempC}" data-temp-f="${tempF}">
            ${isCelsius ? `${tempC}°C` : `${tempF}°F`}
        </div>
        <div class="weather-details">
            <i class="fas fa-${getWeatherIcon(cityWeather.weather[0].main)}"></i>
            <span>${cityWeather.weather[0].description}</span>
            <span>Feels like: ${feelsLikeC}°C</span>
        </div>
    `;

    weatherContainer.appendChild(weatherItem);

    // Add summary to daily summaries
    dailySummaries.push({
        city: cityName,
        temperature: tempC,
        feelsLike: feelsLikeC,
        description: cityWeather.weather[0].description,
        timestamp: new Date().toLocaleString()
    });
}

// Function to map weather conditions to icons
function getWeatherIcon(condition) {
    switch (condition.toLowerCase()) {
        case 'clear':
            return 'sun';
        case 'clouds':
            return 'cloud';
        case 'rain':
            return 'cloud-rain';
        case 'snow':
            return 'snowflake';
        case 'thunderstorm':
            return 'bolt';
        case 'haze':
            return 'smog';
        case 'smoke':
            return 'cloud-smoke';
        default:
            return 'sun-cloud';
    }
}



function checkRealTimeAlerts(cityWeather) {
    const temperature = cityWeather.main.temp; 
    const cityName = cityWeather.name;

    // Check if temperature exceeds 35°C
    if (temperature > 35) {
        alert(`Alert: The temperature in ${cityName} is currently ${temperature}°C, which exceeds 35°C!`);
    }
}

// Function to load weather data for all cities and check thresholds
async function loadWeatherData() {
    const weatherContainer = document.getElementById('weather-container');
    weatherContainer.innerHTML = ''; 

    for (const city of cities) {
        const data = await getWeatherData(city);
        if (data && data.main) {
            createWeatherCard(data);
            checkThresholds(data); // Check for general threshold alerts
            checkRealTimeAlerts(data); 
        }
    }
    displayDailySummaries();
}

async function getWeatherData(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Could not fetch weather data. Please try again later.');
    }
}



function displayDailySummaries() {
    const summaryContainer = document.getElementById('summary-container');
    summaryContainer.innerHTML = ''; 

    // Create and add the heading for the summaries
    const heading = document.createElement('h2');
    heading.textContent = 'Weather Details';
    summaryContainer.appendChild(heading); 

    dailySummaries.forEach(summary => {
        const summaryItem = document.createElement('div');
        summaryItem.className = 'summary-item';
        summaryItem.innerHTML = `
            <h3>${summary.city}</h3>
            <p>Temperature: ${summary.temperature}°C</p>
            <p>Feels Like: ${summary.feelsLike}°C</p>
            <p>Description: ${summary.description}</p>
            <p>Time: ${summary.timestamp}</p>
        `;
        summaryContainer.appendChild(summaryItem);
    });
}


// Function to fetch weather data for a specific city
async function fetchWeatherData(city) {
    const data = await getWeatherData(city);
    if (data && data.main) {
        createWeatherCard(data);
        checkThresholds(data);
    }
}

// Function to toggle temperature display
function toggleTemperature() {
    const temperatureElements = document.querySelectorAll('.temperature');
    temperatureElements.forEach(element => {
        const tempC = parseFloat(element.dataset.tempC);
        const tempF = parseFloat((tempC * 9 / 5) + 32); // Correct conversion here

        if (isCelsius) {
            element.innerHTML = `${tempF.toFixed(2)}°F`; // Switch to Fahrenheit
        } else {
            element.innerHTML = `${tempC.toFixed(2)}°C`; // Switch back to Celsius
        }
    });

    const toggleButton = document.getElementById('toggleTemperature');
    toggleButton.innerHTML = isCelsius ? 'Switch to °C' : 'Switch to °F';

    isCelsius = !isCelsius;
}

// Event listeners for buttons
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('setThresholds').addEventListener('click', setThresholds);
    document.getElementById('toggleTemperature').addEventListener('click', toggleTemperature);
    document.getElementById('reloadWeather').addEventListener('click', function() {
        location.reload(); 
    });
    setInterval(loadWeatherData, updateInterval); // Fetch weather data every 5 minutes
    loadWeatherData(); 
});
