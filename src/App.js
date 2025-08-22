import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LocationSelector from './components/LocationSelector';
import PrayerDashboard from './components/PrayerDashboard';
import HadisDisplay from './components/HadisDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

function App() {
  const [locationInfo, setLocationInfo] = useState(null);
  const [prayerData, setPrayerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');

  // TEMA İŞLEMLERİ
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.className = newTheme + '-theme';
  };

  useEffect(() => {
      document.body.className = theme + '-theme';
  }, [theme]);

  // YENİ ÖZELLİK: Sayfa ilk yüklendiğinde kayıtlı konumu hafızadan al
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem('savedLocation');
      if (savedLocation) {
        setLocationInfo(JSON.parse(savedLocation));
      }
    } catch (error) {
      console.error("Kaydedilmiş konum okunurken hata oluştu:", error);
      // Hata durumunda bozuk veriyi temizle
      localStorage.removeItem('savedLocation');
    }
  }, []);

  // Konum bilgisi değiştiğinde namaz vakitlerini çek ve YENİ ÖZELLİK olarak konumu kaydet
  useEffect(() => {
    if (locationInfo && locationInfo.id) {
      // YENİ ÖZELLİK: Yeni seçilen konumu yerel hafızaya kaydet
      try {
        localStorage.setItem('savedLocation', JSON.stringify(locationInfo));
      } catch (error) {
        console.error("Konum kaydedilirken hata oluştu:", error);
      }
      
      // Mevcut namaz vakti çekme mantığı
      setLoading(true);
      setError(null);
      setPrayerData([]);
      axios.get(`/api/diyanet/prayertimes?location_id=${locationInfo.id}`)
        .then(response => {
          setPrayerData(response.data);
        })
        .catch(err => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setPrayerData([]);
    }
  }, [locationInfo]);

  return (
    <div className="App">
      <header className="app-header">
        <h1 className="logo">Namaz Vakitleri</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? '☀️👉🌑' : '🌑👉☀️'}
        </button>
      </header>
      
      <main>
        <LocationSelector onLocationSelect={setLocationInfo} />
        
        {/* Spinner'ı bağımsız olarak göster */}
        {loading && (
          <div className="loading-overlay">
            <LoadingSpinner />
          </div>
        )}
        
        {/* Konum seçimi yapılmamışsa farklı düzen göster */}
        {!locationInfo ? (
          <div className="no-location-layout">
            <PrayerDashboard 
              prayerData={prayerData} 
              locationInfo={locationInfo}
              loading={loading} 
              error={error} 
            />
            <HadisDisplay />
          </div>
        ) : (
          <div className="main-content-panels">
            <PrayerDashboard 
              prayerData={prayerData} 
              locationInfo={locationInfo}
              loading={loading} 
              error={error} 
            />
            <div className="right-panels">
              <HadisDisplay />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;