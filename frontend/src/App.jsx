import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { Search, MapPin, CloudOff, Wind } from 'lucide-react'
import './App.css'

const API_BASE = 'http://127.0.0.1:8000'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [citySearch, setCitySearch] = useState('')
  const [errorMsg, setErrorMsg] = useState(null)

  const formatDay = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const fetchData = (params = {}) => {
    setLoading(true)
    setErrorMsg(null)
    const query = new URLSearchParams(params).toString()
    fetch(`${API_BASE}/dashboard-data?${query}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) { setErrorMsg(d.error); setData(null) }
        else { setData(d) }
        setLoading(false)
      })
      .catch(() => {
        setErrorMsg('Impossible de contacter le serveur.')
        setLoading(false)
      })
  }

  useEffect(() => { fetchData() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (citySearch.trim()) fetchData({ city: citySearch.trim() })
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Géolocalisation non supportée.")
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchData({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => { setErrorMsg('Impossible de récupérer ta position.'); setLoading(false) }
    )
  }

  const pollutionChartData = (details) => {
    if (!details) return []
    return [
      { name: 'PM2.5', value: details.pm2_5, color: '#a78bfa' },
      { name: 'PM10', value: details.pm10, color: '#60a5fa' },
      { name: 'NO₂', value: details.no2, color: '#fbbf24' },
      { name: 'O₃', value: details.o3, color: '#fb923c' },
      { name: 'SO₂', value: details.so2, color: '#34d399' },
    ]
  }

  const getUvPercent = (uv) => Math.min((uv / 11) * 100, 100)
  const getUvColor = (uv) => {
    if (uv <= 2) return '#34d399'
    if (uv <= 5) return '#fbbf24'
    if (uv <= 7) return '#fb923c'
    return '#f87171'
  }

  const getPollenLevel = (pollen) => {
    if (!pollen) return { label: '—', cls: '' }
    const max = Math.max(...Object.values(pollen))
    if (max > 50) return { label: 'Élevé', cls: 'high' }
    if (max > 10) return { label: 'Modéré', cls: 'moderate' }
    return { label: 'Faible', cls: 'low' }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label}</p>
          <p className="chart-tooltip-value" style={{ color: payload[0].color || '#60a5fa' }}>
            {payload[0].value} µg/m³
          </p>
        </div>
      )
    }
    return null
  }

  const aqiScore = data?.pollution?.aqi_score ?? 3
  const isGoodAir = aqiScore <= 2

  return (
    <div className="app-container">
      {/* Header + Search */}
      <header className="app-header">
        <div className="header-top">
          <h1 className="app-title">WeatherApp</h1>
        </div>
        <div className="search-row">
          <form className="search-form" onSubmit={handleSearch}>
            <span className="search-icon"><Search size={16} /></span>
            <input
              id="city-search-input"
              className="search-input"
              type="text"
              placeholder="Rechercher une ville..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="search-btn">Rechercher</button>
          </form>
          <button className="locate-btn" onClick={handleLocateMe} title="Me localiser" aria-label="Me localiser">
            <MapPin size={18} />
          </button>
        </div>
      </header>

      {/* States */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p className="loading-text">Chargement...</p>
        </div>
      ) : errorMsg ? (
        <div className="error-state fade-in">
          <div className="error-emoji"><CloudOff size={40} /></div>
          <p className="error-message">{errorMsg}</p>
        </div>
      ) : data ? (
        <div className="fade-in">

          {/* ====== ROW 1: Weather + Verdict ====== */}
          <section className="grid-row-2">
            {/* LEFT: Current Weather */}
            <div className="card card-weather">
              <div className="card-label">Météo actuelle</div>
              <div className="weather-hero">
                <div className="weather-icon-wrap">
                  {data.weather?.icon && (
                    <img
                      alt={data.weather.description}
                      src={`https://openweathermap.org/img/wn/${data.weather.icon}@2x.png`}
                    />
                  )}
                </div>
                <div className="weather-main">
                  <div className="weather-city">{data.location}</div>
                  <div className="weather-temp">
                    {Math.round(data.weather?.temperature)}°<span>C</span>
                  </div>
                  <div className="weather-desc">{data.weather?.description}</div>
                </div>
              </div>
              <div className="weather-meta">
                <div className="meta-item">
                  <span className="meta-label">Ressenti</span>
                  <span className="meta-value">{Math.round(data.weather?.ressentit)}°</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Min</span>
                  <span className="meta-value">{Math.round(data.weather?.minimum)}°</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Max</span>
                  <span className="meta-value">{Math.round(data.weather?.maximum)}°</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Vent</span>
                  <span className="meta-value">{data.weather?.vent} km/h</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Sport Verdict */}
            <div className={`card card-verdict ${isGoodAir ? 'verdict-good' : 'verdict-bad'}`}>
              <div className="card-label" style={{ color: 'rgba(255,255,255,0.5)' }}>Verdict Sport</div>
              <div className="verdict-content">
                <div className="verdict-light">
                  <div className={`light red ${!isGoodAir && aqiScore >= 4 ? 'active' : ''}`} />
                  <div className={`light orange ${aqiScore === 3 ? 'active' : ''}`} />
                  <div className={`light green ${isGoodAir ? 'active' : ''}`} />
                </div>
                <div className="verdict-status">{data.pollution?.status}</div>
                <div className="verdict-text">{data.pollution?.recommendation}</div>
              </div>
            </div>
          </section>

          {/* ====== ROW 2: UV + Pollen ====== */}
          <section className="grid-row-2">
            {/* UV Index */}
            <div className="card card-uv">
              <div className="card-label">Indice UV</div>
              {data.uv ? (
                <div className="uv-content">
                  <div className="uv-gauge-wrap">
                    <div className="uv-gauge-track">
                      <div
                        className="uv-gauge-fill"
                        style={{
                          width: `${getUvPercent(data.uv.index)}%`,
                          background: `linear-gradient(90deg, #34d399, ${getUvColor(data.uv.index)})`
                        }}
                      />
                    </div>
                    <div className="uv-gauge-labels">
                      <span>0</span>
                      <span>3</span>
                      <span>6</span>
                      <span>8</span>
                      <span>11+</span>
                    </div>
                  </div>
                  <div className="uv-reading">
                    <span className="uv-number" style={{ color: getUvColor(data.uv.index) }}>
                      {Math.round(data.uv.index * 10) / 10}
                    </span>
                    <span className="uv-label">{data.uv.level}</span>
                  </div>
                  <div className="uv-advice">
                    {data.uv.index <= 2 ? 'Pas de protection nécessaire'
                      : data.uv.index <= 5 ? 'Crème solaire recommandée'
                        : data.uv.index <= 7 ? 'Protection indispensable'
                          : 'Evitez l\'exposition au soleil'}
                  </div>
                </div>
              ) : (
                <p className="no-data">Données UV indisponibles</p>
              )}
            </div>

            {/* Pollen */}
            <div className="card card-pollen">
              <div className="card-label">Risque Pollen</div>
              {data.pollen ? (
                <div className="pollen-content">
                  <div className={`pollen-level-badge ${getPollenLevel(data.pollen).cls}`}>
                    <span className="pollen-flower">�</span>
                    <span className="pollen-level-text">{getPollenLevel(data.pollen).label}</span>
                  </div>
                  <div className="pollen-breakdown">
                    {Object.entries(data.pollen).map(([name, value]) => (
                      <div key={name} className="pollen-row">
                        <span className="pollen-name">{name}</span>
                        <div className="pollen-bar-track">
                          <div
                            className="pollen-bar-fill"
                            style={{
                              width: `${Math.min((value / 100) * 100, 100)}%`,
                              background: value > 50 ? '#f87171' : value > 10 ? '#fbbf24' : '#34d399'
                            }}
                          />
                        </div>
                        <span className="pollen-val">{Math.round(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="no-data">Données pollen indisponibles</p>
              )}
            </div>
          </section>

          {/* ====== ROW 3: Pollution Chart (full width) ====== */}
          <section className="grid-full">
            <div className="card card-chart">
              <div className="card-label">Polluants atmosphériques <span className="unit-label">(µg/m³)</span></div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pollutionChartData(data.pollution?.details)} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {pollutionChartData(data.pollution?.details).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* ====== ROW 4: 5-Day Forecast (horizontal scroll) ====== */}
          <section className="grid-full">
            <div className="card card-forecast">
              <div className="card-label">Prévisions 5 jours</div>
              <div className="forecast-scroll">
                {data.forecast?.map((day, i) => (
                  <div key={i} className="forecast-item">
                    <div className="forecast-day">{formatDay(day.date)}</div>
                    <img
                      className="forecast-icon"
                      src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                      alt={day.description}
                    />
                    <div className="forecast-temp">{Math.round(day.temperature)}°</div>
                    <div className="forecast-desc">{day.description}</div>
                    <div className="forecast-wind"><Wind size={12} /> {day.vent} km/h</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="app-footer">
            Données en temps réel via OpenWeatherMap & Open-Meteo • {data.location}<br />
            Développé par Lilou CHOUKROUN--BALZAN
          </footer>
        </div>
      ) : null}
    </div>
  )
}

export default App