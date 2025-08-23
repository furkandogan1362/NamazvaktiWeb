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
  const [timeZone, setTimeZone] = useState(null);

  // TEMA İŞLEMLERİ
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.className = newTheme + '-theme';
  };

  useEffect(() => {
    document.body.className = theme + '-theme';
  }, [theme]);

  // Sayfa ilk yüklendiğinde kayıtlı konumu hafızadan al
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem('savedLocation');
      if (savedLocation) {
        setLocationInfo(JSON.parse(savedLocation));
      }
    } catch (error) {
      console.error("Kaydedilmiş konum okunurken hata oluştu:", error);
      localStorage.removeItem('savedLocation');
    }
  }, []);

  // Konum bilgisi değiştiğinde namaz vakitlerini ve saat dilimini çek
  useEffect(() => {
    if (locationInfo && locationInfo.id) {
      try {
        localStorage.setItem('savedLocation', JSON.stringify(locationInfo));
      } catch (error) {
        console.error("Konum kaydedilirken hata oluştu:", error);
      }

      setLoading(true);
      setError(null);
      setPrayerData([]);
      setTimeZone(null);

      const fetchAllData = async () => {
        try {
          // Namaz vakitlerini çek
          const prayerResponse = await axios.get(`/api/diyanet/prayertimes?location_id=${locationInfo.id}`);
          setPrayerData(prayerResponse.data);

          // YENİ VE DAHA GÜVENİLİR SAAT DİLİMİ BULMA YÖNTEMİ
          // Coğrafi konum veritabanı kullanarak saat dilimini bulma
          const geocodingResponse = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${locationInfo.city},${locationInfo.country}&key=8f8fc0cb7dc34aed85b1c81e0d1d10be`);
          
          if (geocodingResponse.data.results.length > 0) {
              const { lat, lng } = geocodingResponse.data.results[0].geometry;
              const timezoneResponse = await axios.get(`https://api.timezonedb.com/v2.1/get-time-zone?key=HGCTLYKWT2QU&format=json&by=position&lat=${lat}&lng=${lng}`);
              
              if (timezoneResponse.data && timezoneResponse.data.status === 'OK') {
                  setTimeZone(timezoneResponse.data.zoneName);
              } else {
                  console.warn("TimezoneDB'den saat dilimi alınamadı. Varsayılan kullanılacak.");
                  setTimeZone('Europe/Istanbul');
              }
          } else {
              console.warn("OpenCage'den konum bilgisi alınamadı. Varsayılan kullanılacak.");
              setTimeZone('Europe/Istanbul');
          }

        } catch (err) {
          setError(err.message);
          console.error("Veri yüklenirken hata oluştu:", err);
          setTimeZone('Europe/Istanbul'); // Hata durumunda varsayılan değer
        } finally {
          setLoading(false);
        }
      };
      
      fetchAllData();
    } else {
      setPrayerData([]);
      setTimeZone(null);
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
              timeZone={timeZone}
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
              timeZone={timeZone}
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