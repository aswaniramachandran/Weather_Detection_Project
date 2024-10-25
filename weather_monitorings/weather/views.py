import requests
from django.shortcuts import render
from django.utils import timezone
from .models import Weather, DailySummary
from django.db.models import Avg, Max, Min, Count
from django.utils.timezone import now
from datetime import timedelta

API_KEY = '4096e9a26b0c7996c932bf0d359e7387'  

# Function to fetch weather data from OpenWeatherMap
def get_weather_data(city):
    url = f'http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}'
    response = requests.get(url)
    
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        return {'error': 'City not found'}
    return None

# Function to calculate and save daily summary for each city
def calculate_daily_summary():
    today = now().date()
    cities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad']

    for city in cities:
        # Filter today's weather data for the city
        today_weather = Weather.objects.filter(city=city, timestamp__date=today)

        if today_weather.exists():
            avg_temperature = today_weather.aggregate(Avg('temperature'))['temperature__avg']
            max_temperature = today_weather.aggregate(Max('temperature'))['temperature__max']
            min_temperature = today_weather.aggregate(Min('temperature'))['temperature__min']

            # Find the dominant weather condition (most frequent)
            dominant_condition = today_weather.values('condition').annotate(count=Count('condition')).order_by('-count')[0]['condition']

            # Save or update the daily summary for the city
            DailySummary.objects.update_or_create(
                city=city,
                date=today,
                defaults={
                    'avg_temperature': avg_temperature,
                    'max_temperature': max_temperature,
                    'min_temperature': min_temperature,
                    'dominant_condition': dominant_condition
                }
            )

# The main index view for fetching weather, including search functionality
def index(request):
    cities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad']
    city = request.GET.get('city')  # Get the city from the search form
    weather_data = []
    error_message = None  # To store any potential error messages

    if city:
        cities = [city]  # If a city is searched, override the default list

    # Fetch weather data for each city and store it in the database
    for city in cities:
        city_weather = get_weather_data(city)
        
        if city_weather:
            if 'error' in city_weather:
                error_message = city_weather['error']  # Set error message if city not found
            else:
                # Process and convert weather data
                temperature = city_weather['main']['temp'] - 273.15  # Kelvin to Celsius
                feels_like = city_weather['main']['feels_like'] - 273.15
                condition = city_weather['weather'][0]['main']
                timestamp = timezone.now()

                # Save the weather data to the database
                Weather.objects.create(
                    city=city,
                    temperature=temperature,
                    feels_like=feels_like,
                    condition=condition,
                    timestamp=timestamp
                )

                # Prepare the weather data for display
                weather = {
                    'city': city,
                    'temperature': round(temperature, 2),
                    'feels_like': round(feels_like, 2),
                    'condition': condition
                }
                weather_data.append(weather)

    # Calculate today's daily summaries
    calculate_daily_summary()

    # Fetch all daily summaries
    daily_summaries = DailySummary.objects.all()

    # Pass the weather data, daily summaries, and error message to the template
    context = {
        'weather_data': weather_data,
        'daily_summaries': daily_summaries,
        'error_message': error_message
    }
    return render(request, 'index.html', context)
