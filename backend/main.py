from fastapi import FastAPI
import requests
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LAT = 48.5734
LON = 7.7521

API_KEY = os.getenv("OPENWEATHER_API_KEY", "")


@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'app SafeBreathe Strasbourg !"}


@app.get("/dashboard-data")
def get_dashboard_data():
    pollution_data = fetch_pollution_data(LAT, LON, API_KEY)
    weather_data = fetch_weather_data(LAT, LON, API_KEY)
    forecast_data = fetch_forecast_data(LAT, LON, API_KEY)

    if pollution_data and weather_data:
        return {
            "pollution": pollution_data,
            "weather": weather_data,
            "forecast": forecast_data
        }
    else:
        return {"error": "Impossible de récupérer les données."}


def fetch_pollution_data(lat, lon, api_key):
    try:
        url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}"
        response = requests.get(url)

        response.raise_for_status()

        data = response.json()
        current_data = data['list'][0]
        aqi = current_data['main']['aqi']
        particules = current_data['components']

        return {
            "aqi_score": aqi,
            "status": get_status_label(aqi),
            "recommendation": get_sport_recommendation(aqi),
            "details": particules
        }

    except Exception as e:
        print(f"Erreur lors de la récupération de la pollution : {e}")
        return None


def fetch_weather_data(lat, lon, api_key):
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric&lang=fr"
        response = requests.get(url)

        response.raise_for_status()

        data = response.json()
        weather = {
            "temperature": data['main']['temp'],
            "ressentit": data['main']['feels_like'],
            "minimum": data['main']['temp_min'],
            "maximum": data['main']['temp_max'],
            "description": data['weather'][0]['description'],
            "icon": data['weather'][0]['icon'],
            "vent": data['wind']['speed'],
        }
        return weather

    except Exception as e:
        print(f"Erreur lors de la récupération de la météo : {e}")
        return None


def fetch_forecast_data(lat, lon, api_key):
    try:
        url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric&lang=fr"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()
        forecasts_list = []

        for item in data['list']:
            if "12:00:00" in item['dt_txt']:
                day_weather = {
                    "date": item['dt_txt'],
                    "temperature": item['main']['temp'],
                    "ressentit": item['main']['feels_like'],
                    "description": item['weather'][0]['description'],
                    "icon": item['weather'][0]['icon'],
                    "vent": item['wind']['speed'],
                }
                forecasts_list.append(day_weather)
        return forecasts_list

    except Exception as e:
        print(f"Erreur lors de la récupération des prévisions : {e}")
        return []


def get_status_label(aqi):
    labels = {1: "Excellent", 2: "Bon",
              3: "Moyen", 4: "Mauvais",
              5: "Très Mauvais"}
    return labels.get(aqi, "Inconnu")


def get_sport_recommendation(aqi):
    if aqi <= 2:
        return "✅ Conditions idéales pour du sport en extérieur !! :)"
    elif aqi == 3:
        return "⚠️ Conditions acceptables, mais évitez l'effort intense. :/"
    else:
        return "❌ Restez à l'intérieur, air pollué. :("
