import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import 'moment/locale/tr';
import LocationSelector from './components/LocationSelector';
import PrayerDashboard from './components/PrayerDashboard';
import HadisDisplay from './components/HadisDisplay';
import AyetDisplay from './components/AyetDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import GpsLocationButton from './components/GpsLocationButton';

// Yeni ve güncellenmiş import satırları
import './styles/variables.css';
import './styles/base.css';
import './styles/Header.css';
import './styles/LocationSelector.css';
import './styles/PrayerDashboard.css';
import './styles/HadisDisplay.css';
import './styles/AyetDisplay.css';
import './styles/LoadingSpinner.css';
import './styles/GpsLocationButton.css';

function App() {
  const [locationInfo, setLocationInfo] = useState(null);
  const [prayerData, setPrayerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [timeZone, setTimeZone] = useState(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

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
        const parsedLocation = JSON.parse(savedLocation);
        setLocationInfo(parsedLocation);
        if (parsedLocation.isGps) {
          fetchPrayerData(parsedLocation);
        }
      }
    } catch (error) {
      console.error("Kaydedilmiş konum okunurken hata oluştu:", error);
      localStorage.removeItem('savedLocation');
    }
  }, []);

  // Cihazın mobil olup olmadığını kontrol et
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Konum servislerinin mevcut olup olmadığını kontrol et
  const isLocationServiceAvailable = () => {
    return 'geolocation' in navigator;
  };

  // Konum izni durumunu kontrol et (modern tarayıcılar için)
  const checkLocationPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({name: 'geolocation'});
        return permission.state; // 'granted', 'denied', veya 'prompt'
      } catch (error) {
        console.warn("Konum izni durumu kontrol edilemedi:", error);
        return 'unknown';
      }
    }
    return 'unknown';
  };

  // Mobil cihazlar için konum durumu hatırlatma mesajı
  const getLocationReminderMessage = () => {
    const userAgent = navigator.userAgent;
    
    if (/iPhone|iPad/.test(userAgent)) {
      return "Konum erişimi reddedildi. Lütfen cihazınızın konum servislerinin açık olduğundan emin olun. (Ayarlar → Gizlilik ve Güvenlik → Konum Servisleri)";
    } else if (/Android/.test(userAgent)) {
      return "Konum erişimi reddedildi. Lütfen cihazınızın konum servislerinin açık olduğundan emin olun. (Ayarlar → Konum)";
    } else {
      return "Konum erişimi reddedildi. Lütfen cihazınızın konum servislerinin açık olduğundan emin olun.";
    }
  };

  // Geliştirilmiş GPS konum alma fonksiyonu
  const handleGpsLocation = async () => {
    setIsGpsLoading(true);
    setError(null);

    // Konum servislerinin mevcut olup olmadığını kontrol et
    if (!isLocationServiceAvailable()) {
      setError('Cihazınız konum servislerini desteklemiyor.');
      setIsGpsLoading(false);
      return;
    }

    const isMobile = isMobileDevice();

    try {
      // Konum izni durumunu kontrol et
      const permissionStatus = await checkLocationPermission();
      
      if (permissionStatus === 'denied') {
        if (isMobile) {
          setError(getLocationReminderMessage());
        } else {
          setError('Konum erişim izni reddedildi. Lütfen tarayıcı ayarlarınızdan bu siteye konum erişimi verin.');
        }
        setIsGpsLoading(false);
        return;
      }

      // Konum alma seçenekleri
      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // 15 saniye timeout
        maximumAge: 300000 // 5 dakika cache
      };

      // Konum alma promise'i
      const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
      };

      // Konumu almaya çalış
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      console.log("Konum başarıyla alındı:", { latitude, longitude });
      
      await fetchPrayerData({
        isGps: true,
        latitude,
        longitude
      });

    } catch (geoError) {
      console.error("GPS Konum hatası:", geoError);
      
      let errorMessage = '';
      
      switch(geoError.code) {
        case geoError.PERMISSION_DENIED:
          errorMessage = isMobile ? 
            getLocationReminderMessage() :
            "Konum erişim izni reddedildi. Lütfen tarayıcı ayarlarınızdan konum erişimi verin.";
          break;
        case geoError.POSITION_UNAVAILABLE:
          errorMessage = isMobile ? 
            "Konum bulunamadı. GPS'inizin açık olduğundan ve açık bir alanda olduğunuzdan emin olun." :
            "Konum bilgisi mevcut değil. Lütfen GPS'inizin açık olduğundan emin olun.";
          break;
        case geoError.TIMEOUT:
          errorMessage = "Konum alınırken zaman aşımı oluştu. Lütfen GPS'inizin açık olduğundan emin olun.";
          break;
        default:
          errorMessage = "Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.";
      }
      
      setError(errorMessage);
      setIsGpsLoading(false);
    }
  };

  // Namaz vakitlerini ve saat dilimini API'den çekme
  const fetchPrayerData = async (locationDetails) => {
    setLoading(true);
    setError(null);
    setPrayerData([]);
    setTimeZone(null);

    try {
      let prayerResponse;
      let geocodingResponse;
      let timeZoneResponse;

      if (locationDetails.isGps) {
        const { latitude, longitude } = locationDetails;
        const date = moment().format('DD-MM-YYYY');

        // Aladhan API'den vakitleri çek
        prayerResponse = await axios.get(`https://api.aladhan.com/v1/timings/${date}`, {
          params: {
            latitude: latitude,
            longitude: longitude,
            method: 13 // Diyanet İşleri Başkanlığı
          }
        });
        
        // OpenCage API ile enlem/boylamdan konum adı al
        geocodingResponse = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=8f8fc0cb7dc34aed85b1c81e0d1d10be`);
        
        if (geocodingResponse.data.results.length > 0) {
          const { components, annotations } = geocodingResponse.data.results[0];
          const newLocationInfo = {
            id: null, // GPS ile ID olmadığı için null
            country: components.country,
            city: components.city || components.town || components.village || components.county,
            region: components.state || components.province || components.suburb || components.village || '',
            isGps: true,
            latitude,
            longitude
          };
          setLocationInfo(newLocationInfo);
          localStorage.setItem('savedLocation', JSON.stringify(newLocationInfo));
        } else {
          throw new Error('Konum bilgisi bulunamadı.');
        }

        // TimezoneDB ile saat dilimini al
        timeZoneResponse = await axios.get(`https://api.timezonedb.com/v2.1/get-time-zone?key=HGCTLYKWT2QU&format=json&by=position&lat=${latitude}&lng=${longitude}`);
        if (timeZoneResponse.data.status === 'OK') {
          setTimeZone(timeZoneResponse.data.zoneName);
        } else {
          throw new Error('Saat dilimi bulunamadı.');
        }

        const timings = prayerResponse.data.data.timings;
        // Aladhan API verilerini Diyanet API formatına dönüştür
        const transformedData = [{
          date: moment().format('YYYY-MM-DD'),
          fajr: timings.Fajr.split(' ')[0],
          sun: timings.Sunrise.split(' ')[0],
          dhuhr: timings.Dhuhr.split(' ')[0],
          asr: timings.Asr.split(' ')[0],
          maghrib: timings.Maghrib.split(' ')[0],
          isha: timings.Isha.split(' ')[0]
        }];
        setPrayerData(transformedData);
        
      } else {
        // Mevcut Diyanet API ile veri çekme
        prayerResponse = await axios.get(`/api/diyanet/prayertimes?location_id=${locationDetails.id}`);
        setPrayerData(prayerResponse.data);

        // OpenCage API ile enlem/boylam bul
        const geocodingResponse = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${locationDetails.city},${locationDetails.country}&key=8f8fc0cb7dc34aed85b1c81e0d1d10be`);
          
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
      }

    } catch (err) {
      setError(err.message || 'Veriler yüklenirken bir hata oluştu.');
      console.error("Veri yüklenirken hata oluştu:", err);
      setTimeZone('Europe/Istanbul'); // Hata durumunda varsayılan değer
    } finally {
      setLoading(false);
      setIsGpsLoading(false);
    }
  };

  // Konum bilgisi değiştiğinde namaz vakitlerini çek
  useEffect(() => {
    if (locationInfo && !locationInfo.isGps) {
      try {
        localStorage.setItem('savedLocation', JSON.stringify(locationInfo));
      } catch (error) {
        console.error("Konum kaydedilirken hata oluştu:", error);
      }
      fetchPrayerData(locationInfo);
    }
  }, [locationInfo]);

  // Error message component
  const ErrorMessage = () => {
    if (!error) return null;
    
    return (
      <div className="error-message-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle" style={{marginRight: '8px'}}></i>
          {error}
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1 className="logo">Namaz Vakitleri</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? '☀️👉🌙' : '🌙👉☀️'}
        </button>
      </header>

      <main>
        <LocationSelector onLocationSelect={setLocationInfo} />
        
        <ErrorMessage />
        
        {loading && (
          <div className="loading-overlay">
            <LoadingSpinner />
          </div>
        )}
        
        {locationInfo ? (
          <div className="main-content-panels">
            <div className="left-panel">
              <GpsLocationButton onClick={handleGpsLocation} loading={isGpsLoading} />
              <PrayerDashboard 
                prayerData={prayerData} 
                locationInfo={locationInfo}
                loading={loading} 
                error={null}
                timeZone={timeZone}
              />
            </div>
            <div className="right-panels">
              <AyetDisplay />
              <HadisDisplay />
            </div>
          </div>
        ) : (
          <div className="main-content-panels no-location-layout">
            <div className="left-panel">
              <GpsLocationButton onClick={handleGpsLocation} loading={isGpsLoading} />
              <PrayerDashboard 
                prayerData={prayerData} 
                locationInfo={locationInfo}
                loading={loading} 
                error={null}
                timeZone={timeZone}
              />
            </div>
            <div className="right-panels">
              <AyetDisplay />
              <HadisDisplay />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;