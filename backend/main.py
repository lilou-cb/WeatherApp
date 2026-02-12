from fastapi import FastAPI, HTTPException
import requests
import os
from typing import Optional
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

DEFAULT_LAT = 48.5734
DEFAULT_LON = 7.7521
DEFAULT_CITY = "Strasbourg"

API_KEY = os.getenv("OPENWEATHER_API_KEY", "")


def get_coords_from_city(city_name: str, api_key: str):
    try:
        url = f"http://api.openweathermap.org/geo/1.0/direct?q={city_name}&limit=1&appid={api_key}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        if not data:
            return None, None, None

        return data[0]['lat'], data[0]['lon'], data[0]['name']
    except Exception as e:
        print(f"Erreur geocoding: {e}")
        return None, None, None


@app.get("/dashboard-data")
def get_dashboard_data(lat: Optional[float] = None, lon: Optional[float] = None, city: Optional[str] = None):

    current_lat = lat
    current_lon = lon
    location_name = "Ma position"

    if city:
        found_lat, found_lon, found_name = get_coords_from_city(city, API_KEY)
        if found_lat is not None:
            current_lat = found_lat
            current_lon = found_lon
            location_name = found_name
        else:
            return {"error": "Ville introuvable"}

    # 2. Si aucune coordonnée n'est fournie (ni par paramètre, ni par ville), on prend le défaut
    if current_lat is None or current_lon is None:
        current_lat = DEFAULT_LAT
        current_lon = DEFAULT_LON
        location_name = DEFAULT_CITY

    # 3. Récupération des données
    pollution_data = fetch_pollution_data(current_lat, current_lon, API_KEY)
    weather_data = fetch_weather_data(current_lat, current_lon, API_KEY)
    forecast_data = fetch_forecast_data(current_lat, current_lon, API_KEY)
    uv_data = fetch_uv_data(current_lat, current_lon)
    pollen_data = fetch_pollen_data(current_lat, current_lon)

    if pollution_data and weather_data:
        return {
            "location": location_name,
            "pollution": pollution_data,
            "weather": weather_data,
            "forecast": forecast_data,
            "uv": uv_data,
            "pollen": pollen_data
        }
    else:
        return {"error": "Impossible de récupérer les données météo."}

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'app WeatherApp Strasbourg !"}


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
        print(f"Erreur pollution : {e}")
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
        print(f"Erreur météo : {e}")
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
        print(f"Erreur prévisions : {e}")
        return []

def fetch_uv_data(lat, lon):
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=uv_index,uv_index_clear_sky"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        current = data.get('current', {})
        uv_index = current.get('uv_index', 0)
        return {
            "index": uv_index,
            "level": get_uv_level(uv_index),
            "clear_sky": current.get('uv_index_clear_sky', 0)
        }
    except Exception as e:
        print(f"Erreur UV : {e}")
        return None

def fetch_pollen_data(lat, lon):
    try:
        url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=birch_pollen,grass_pollen,olive_pollen,alder_pollen,ragweed_pollen,mugwort_pollen"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        current = data.get('current', {})
        pollen = {
            "bouleau": current.get('birch_pollen', 0),
            "graminées": current.get('grass_pollen', 0),
            "olivier": current.get('olive_pollen', 0),
            "aulne": current.get('alder_pollen', 0),
            "ambroisie": current.get('ragweed_pollen', 0),
            "armoise": current.get('mugwort_pollen', 0),
        }
        return pollen
    except Exception as e:
        print(f"Erreur pollen : {e}")
        return None

def get_uv_level(uv):
    if uv <= 2: return "Faible"
    elif uv <= 5: return "Modéré"
    elif uv <= 7: return "Élevé"
    elif uv <= 10: return "Très élevé"
    else: return "Extrême"

def get_status_label(aqi):
    labels = {1: "Excellent", 2: "Bon", 3: "Moyen", 4: "Mauvais", 5: "Très Mauvais"}
    return labels.get(aqi, "Inconnu")

def get_sport_recommendation(aqi):
    if aqi <= 2: return "Conditions idéales pour du sport en extérieur !! :)"
    elif aqi == 3: return "Conditions acceptables, mais évitez l'effort intense. :/"
    else: return "Restez à l'intérieur, air pollué. :("