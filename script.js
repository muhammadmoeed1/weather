// API Key for OpenWeatherMap
const API_KEY = '3b16f91dda30d68a39120e86904bb588';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const citySearch = document.getElementById('citySearch');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const refreshBtn = document.getElementById('refreshBtn');
const themeToggle = document.getElementById('themeToggle');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const addToFavoritesBtn = document.getElementById('addToFavoritesBtn');

// Weather display elements
const cityName = document.getElementById('cityName');
const countryFlag = document.getElementById('countryFlag');
const currentTime = document.getElementById('currentTime');
const temperature = document.getElementById('temperature');
const weatherIcon = document.getElementById('weatherIcon');
const weatherDescription = document.getElementById('weatherDescription');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const forecastCards = document.getElementById('forecastCards');
const favoriteCities = document.getElementById('favoriteCities');
const recentSearches = document.getElementById('recentSearches');

// Current city and storage
let currentCity = 'New York';
let favorites = JSON.parse(localStorage.getItem('favoriteCities')) || [];
let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }
    
    // Try to get user's location on load
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                getWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            error => {
                // If user denies location access, load default city
                getWeatherByCity(currentCity);
            }
        );
    } else {
        // Geolocation not supported, load default city
        getWeatherByCity(currentCity);
    }
    
    // Load favorites and recent searches
    renderFavorites();
    renderRecentSearches();
    
    // Set up event listeners
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', () => {
        if (citySearch.value.trim() !== '') {
            getWeatherByCity(citySearch.value.trim());
        }
    });
    
    citySearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && citySearch.value.trim() !== '') {
            getWeatherByCity(citySearch.value.trim());
        }
    });
    
    currentLocationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    getWeatherByCoords(position.coords.latitude, position.coords.longitude);
                },
                error => {
                    showError('Location access denied. Please search for a city manually.');
                }
            );
        } else {
            showError('Geolocation is not supported by your browser.');
        }
    });
    
    refreshBtn.addEventListener('click', () => {
        getWeatherByCity(currentCity);
    });
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme');
        
        // Save theme preference to localStorage
        const isDarkTheme = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
        
        // Update background based on current weather condition
        if (typeof updateBackground === 'function') {
            updateBackground(lastWeatherCondition || 'clear');
        }
    });
    
    addToFavoritesBtn.addEventListener('click', () => {
        addToFavorites(currentCity);
    });
}

// Store the last weather condition for theme updates
let lastWeatherCondition = 'clear';

// Function to fetch weather data by city name
async function getWeatherByCity(city) {
    showLoading();
    try {
        // Fetch current weather
        const currentWeatherResponse = await fetch(
            `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        
        if (!currentWeatherResponse.ok) {
            const errorData = await currentWeatherResponse.json();
            throw new Error(errorData.message || 'City not found. Please try again.');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Fetch forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Could not fetch forecast data.');
        }
        
        const forecastData = await forecastResponse.json();
        
        // Update UI with weather data
        updateWeatherUI(currentWeatherData, forecastData);
        currentCity = currentWeatherData.name;
        
        // Add to recent searches
        addToRecentSearches(currentWeatherData.name);
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Function to fetch weather data by coordinates
async function getWeatherByCoords(lat, lon) {
    showLoading();
    try {
        // Fetch current weather
        const currentWeatherResponse = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!currentWeatherResponse.ok) {
            throw new Error('Could not fetch weather data for your location.');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Fetch forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Could not fetch forecast data.');
        }
        
        const forecastData = await forecastResponse.json();
        
        // Update UI with weather data
        updateWeatherUI(currentWeatherData, forecastData);
        currentCity = currentWeatherData.name;
        
        // Add to recent searches
        addToRecentSearches(currentWeatherData.name);
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Function to update the UI with weather data
function updateWeatherUI(currentData, forecastData) {
    // Update city name and country flag
    cityName.textContent = currentData.name;
    countryFlag.textContent = getCountryFlag(currentData.sys.country);
    
    // Update current time
    const now = new Date();
    const options = { weekday: 'long', hour: '2-digit', minute: '2-digit' };
    currentTime.textContent = now.toLocaleTimeString('en-US', options);
    
    // Update temperature and weather description
    temperature.textContent = `${Math.round(currentData.main.temp)}°C`;
    weatherDescription.textContent = currentData.weather[0].description;
    
    // Update weather icon
    const iconCode = currentData.weather[0].icon;
    weatherIcon.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${currentData.weather[0].description}">`;
    
    // Update weather details
    feelsLike.textContent = `${Math.round(currentData.main.feels_like)}°C`;
    humidity.textContent = `${currentData.main.humidity}%`;
    windSpeed.textContent = `${currentData.wind.speed} m/s`;
    
    // Update forecast
    updateForecast(forecastData);
    
    // Update background based on weather condition
    lastWeatherCondition = currentData.weather[0].main;
    updateBackground(lastWeatherCondition);
}

// Function to update forecast cards
function updateForecast(forecastData) {
    // Clear previous forecast
    forecastCards.innerHTML = '';
    
    // Get unique days (next 3 days)
    const dailyForecasts = [];
    const seenDays = new Set();
    
    for (const forecast of forecastData.list) {
        const date = new Date(forecast.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        if (!seenDays.has(day) && seenDays.size < 3) {
            seenDays.add(day);
            dailyForecasts.push({
                day,
                temp: Math.round(forecast.main.temp),
                icon: forecast.weather[0].icon,
                description: forecast.weather[0].description
            });
        }
    }
    
    // Create forecast cards
    dailyForecasts.forEach(day => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <p class="forecast-day">${day.day}</p>
            <div class="forecast-icon">
                <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
            </div>
            <p class="forecast-temp">${day.temp}°C</p>
        `;
        forecastCards.appendChild(card);
    });
}

// Function to get country flag emoji
function getCountryFlag(countryCode) {
    // Convert country code to flag emoji
    return countryCode.toUpperCase().replace(/./g, char => 
        String.fromCodePoint(127397 + char.charCodeAt())
    );
}

// Function to update background based on weather condition
function updateBackground(weatherCondition) {
    const body = document.body;
    const isDarkTheme = document.body.classList.contains('dark-theme');
    
    // Set background based on weather condition and theme
    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            body.style.backgroundImage = isDarkTheme 
                ? 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' 
                : 'linear-gradient(135deg, #4a6fa5 0%, #6b8cbc 100%)';
            break;
        case 'clouds':
            body.style.backgroundImage = isDarkTheme 
                ? 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' 
                : 'linear-gradient(135deg, #5f7ea3 0%, #7e9cc2 100%)';
            break;
        case 'rain':
        case 'drizzle':
            body.style.backgroundImage = isDarkTheme 
                ? 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' 
                : 'linear-gradient(135deg, #4a6fa5 0%, #6b8cbc 100%)';
            break;
        case 'thunderstorm':
            body.style.backgroundImage = isDarkTheme 
                ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' 
                : 'linear-gradient(135deg, #2c3e50 0%, #4a6fa5 100%)';
            break;
        case 'snow':
            body.style.backgroundImage = isDarkTheme 
                ? 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' 
                : 'linear-gradient(135deg, #7b9cc0 0%, #a0b9db 100%)';
            break;
        default:
            body.style.backgroundImage = isDarkTheme 
                ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' 
                : 'linear-gradient(135deg, #4a6fa5 0%, #6b8cbc 100%)';
    }
}

// Function to add city to favorites
function addToFavorites(city) {
    if (!favorites.includes(city)) {
        favorites.push(city);
        localStorage.setItem('favoriteCities', JSON.stringify(favorites));
        renderFavorites();
        showError(`${city} added to favorites!`, 'success');
    } else {
        showError(`${city} is already in your favorites`);
    }
}

// Function to remove city from favorites
function removeFromFavorites(city) {
    favorites = favorites.filter(fav => fav !== city);
    localStorage.setItem('favoriteCities', JSON.stringify(favorites));
    renderFavorites();
}

// Function to render favorite cities
function renderFavorites() {
    favoriteCities.innerHTML = '';
    
    if (favorites.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'No favorite cities yet. Click the heart icon to add some.';
        emptyMessage.style.padding = '10px';
        emptyMessage.style.opacity = '0.7';
        emptyMessage.style.color = 'rgba(255, 255, 255, 0.7)';
        favoriteCities.appendChild(emptyMessage);
        return;
    }
    
    favorites.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.className = 'favorite-city';
        cityElement.innerHTML = `
            <p class="favorite-city-name">${city}</p>
            <p class="favorite-city-temp">--°C</p>
            <i class="fas fa-trash-alt"></i>
        `;
        
        // Add click event to load weather for this city
        cityElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('fa-trash-alt')) {
                e.stopPropagation();
                removeFromFavorites(city);
            } else {
                getWeatherByCity(city);
            }
        });
        
        favoriteCities.appendChild(cityElement);
        
        // Fetch current temperature for this favorite city
        fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`)
            .then(response => response.json())
            .then(data => {
                const tempElement = cityElement.querySelector('.favorite-city-temp');
                tempElement.textContent = `${Math.round(data.main.temp)}°C`;
            })
            .catch(error => {
                console.error('Error fetching temperature for favorite city:', error);
            });
    });
}

// Function to add city to recent searches
function addToRecentSearches(city) {
    // Remove if already exists
    recentCities = recentCities.filter(c => c !== city);
    
    // Add to beginning of array
    recentCities.unshift(city);
    
    // Keep only the last 5 searches
    if (recentCities.length > 5) {
        recentCities.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('recentCities', JSON.stringify(recentCities));
    
    // Update UI
    renderRecentSearches();
}

// Function to render recent searches
function renderRecentSearches() {
    recentSearches.innerHTML = '';
    
    if (recentCities.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'No recent searches yet. Search for a city to see it here.';
        emptyMessage.style.padding = '10px';
        emptyMessage.style.opacity = '0.7';
        emptyMessage.style.color = 'rgba(255, 255, 255, 0.7)';
        recentSearches.appendChild(emptyMessage);
        return;
    }
    
    recentCities.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.className = 'recent-city';
        cityElement.innerHTML = `
            <p class="recent-city-name">${city}</p>
            <p class="recent-city-temp">--°C</p>
        `;
        
        // Add click event to load weather for this city
        cityElement.addEventListener('click', () => {
            getWeatherByCity(city);
        });
        
        recentSearches.appendChild(cityElement);
        
        // Fetch current temperature for this recent city
        fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`)
            .then(response => response.json())
            .then(data => {
                const tempElement = cityElement.querySelector('.recent-city-temp');
                tempElement.textContent = `${Math.round(data.main.temp)}°C`;
            })
            .catch(error => {
                console.error('Error fetching temperature for recent city:', error);
            });
    });
}

// Function to show loading spinner
function showLoading() {
    loading.style.display = 'flex';
}

// Function to hide loading spinner
function hideLoading() {
    loading.style.display = 'none';
}

// Function to show error message
function showError(message, type = 'error') {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    if (type === 'success') {
        errorMessage.style.background = '#38a169';
    } else {
        errorMessage.style.background = '#e53e3e';
    }
    
    // Hide error message after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}