import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });};

  useEffect(() => {
    fetch('http://127.0.0.1:8000/dashboard-data')
      .then(response => response.json())
      .then(data => {
        console.log("Données reçues :", data);
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Erreur :", error);
        setLoading(false);
      });
  }, []);

  const preparePollutionChartData = (pollutionDetails) => {
    if (!pollutionDetails) return [];
    return [
      { name: 'PM2.5', value: pollutionDetails.pm2_5, color: "#8884d8" },
      { name: 'PM10', value: pollutionDetails.pm10, color: "#82ca9d" },
      { name: 'NO2', value: pollutionDetails.no2, color: "#ffc658" },
      { name: 'O3', value: pollutionDetails.o3, color: "#ff7300" },
      { name: 'SO2', value: pollutionDetails.so2, color: "#0088fe" },
    ];
  };


  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      {loading ? (
        <p>Chargement des données...</p>
      ) : data && !data.error ? (
        <div>
          <div style={{ 
            textAlign: "center", 
            padding: "20px", 
            background: (data.pollution?.aqi_score ?? 3) <= 2 ? "#d4edda" : "#f8d7da",
            borderRadius: "15px",
            marginBottom: "15px",
            color: 'black'
          }}>
            <h3 style={{ margin: 0, fontSize: "2.5rem" }}>{data.pollution?.status}</h3>
            <p style={{ fontSize: "1.2rem", marginTop: "10px" }}>{data.pollution?.recommendation}</p>
          </div>
<div>
  <h3>Conditions Météorologiques Actuelles :</h3>
  {data.weather?.icon && (
    <img 
      alt={data.weather.description}
      src={`https://openweathermap.org/img/wn/${data.weather.icon}@2x.png`} 
      style={{ verticalAlign: 'middle' }}
    />
  )}
  description : {data.weather?.description}<br />
  température : {data.weather?.temperature}°C<br />
  ressentit : {data.weather?.ressentit}°C<br />
  minimum : {data.weather?.minimum}°C<br />
  maximum : {data.weather?.maximum}°C<br />
  vitesse du vent : {data.weather?.vent} km/h
</div>

<h3 style={{ textAlign: "center" }}>📊 Analyse des polluants (µg/m³)</h3>
<div style={{ width: '100%', height: 300 }}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={preparePollutionChartData(data.pollution?.details)}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" name="Concentration" radius={[10, 10, 0, 0]}>
        {preparePollutionChartData(data.pollution?.details).map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>

<div style={{ width: '100%', height: 300 }}>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data.forecast}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="date" 
        tickFormatter={formatDate}
      />
      <YAxis />
      <Tooltip labelFormatter={formatDate} />
      <Line 
        type="monotone"
        dataKey="temperature"
        stroke="#ff7300"
        strokeWidth={3}
        dot={{ r: 5 }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>

          <p style={{ textAlign: "center", color: "#666", fontSize: "0.8rem", marginTop: "20px" }}>
            Données en temps réel via OpenWeatherMap • Strasbourg
          </p>

        </div>
      ) : (
        <p>Erreur lors du chargement des données. Vérifie que le backend Python tourne et la clé API.</p>
      )}
    </div>
  );
}

export default App;