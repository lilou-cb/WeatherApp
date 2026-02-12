# WeatherHealth Dashboard - Météo & Qualité de l'Air

![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react)
![Python](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite)
![Status](https://img.shields.io/badge/Status-Functional-success)

> **Dashboard de suivi de météo et de la qualité de l'air**  
---

## Aperçu de l'interface

![Aperçu de l'interface](assets/screenshot.png)

## Fonctionnalités Clés et Données


| Module | Description Technique & Fonctionnelle |
| :--- | :--- |
| **Algorithme Sportif** | Analyse multicritère (Température + Précipitations + Qualité d'Air + Vent) pour valider ou déconseiller la pratique sportive en extérieur (Feu tricolore). |
| **Monitoring Qualité Air** | Visualisation graphique des polluants majeurs (PM2.5, PM10, NO₂, O₃) via **Recharts**. Alerte en cas de dépassement des seuils OMS. |
| **Prévention Santé** | Calcul de l'indice UV en temps réel avec conseils de protection associés (crème solaire, lunettes, évitement). |
| **Risque Allergique** | Suivi de 6 types de pollens (Graminées, Bouleau, Olivier...) grâce à l'API Open-Meteo. |

## Stack Technique

Une architecture moderne séparant le Frontend (UI) du Backend (Logique métier & Proxy API).

- **Frontend :** React 19, Vite, Recharts (Data Viz), CSS custom (Glassmorphism UI).
- **Backend :** Python (FastAPI), Uvicorn, Requests.
- **APIs Externes :**
    - *OpenWeatherMap* : Données météo courantes et pollution de l'air.
    - *Open-Meteo* : Données spécialisées (Indice UV, Pollens).

## Installation & Démarrage

### 1. Cloner le projet
```bash
git clone https://github.com/lilou-cb/WeatherApp.git
cd WeatherApp
```

### 2. Configuration (Variables d'environnement)
Créez un fichier .env dans le dossier backend/ :

```bash
OPENWEATHER_API_KEY=votre_clé_api_ici
```
Note : Obtenez une clé gratuite sur openweathermap.org.

### 3. Installation et Lancement
Terminal 1 : Backend (Python)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
Le serveur API démarre sur : http://127.0.0.1:8000

Terminal 2 : Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

L'application est accessible sur : http://localhost:5173

## Structure du Projet
```
WeatherApp/
├── backend/
│   ├── main.py              # API FastAPI (météo, pollution, UV, pollen)
│   ├── requirements.txt
│   └── .env                 # Clé API (non versionné)
├── frontend/
│   ├── index.html
│   └── src/
│       ├── main.jsx         # Point d'entrée React
│       ├── App.jsx          # Composant principal (dashboard)
│       ├── App.css          # Styles des composants
│       └── index.css        # Design system (couleurs, fonts)
├── .gitignore
└── README.md
```

## Auteure
Lilou CHOUKROUN-BALZAN Étudiante en BUT Informatique - Future Ingénieure Logiciel & Data

[Portfolio](http://lilou-cb.me/) • [GitHub](https://github.com/lilou-cb) • [LinkedIn](https://www.linkedin.com/in/lilou-choukroun-balzan/)