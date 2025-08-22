import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LocationSelector = ({ onLocationSelect }) => {
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState('');

  const [loading, setLoading] = useState({
      countries: false,
      cities: false,
      regions: false
  });

  // 1. Adım: Sayfa yüklendiğinde ülkeleri çek
  useEffect(() => {
    setLoading(prev => ({ ...prev, countries: true }));
    axios.get('/api/diyanet/countries')
      .then(response => {
        console.log("Ülkeler API Yanıtı:", response.data); 
        setCountries(response.data);
      })
      .catch(error => {
        console.error("Ülkeler yüklenirken hata oluştu:", error);
      })
      .finally(() => setLoading(prev => ({ ...prev, countries: false })));
  }, []);

  // 2. Adım: Bir ülke seçildiğinde o ülkenin şehirlerini çek
  useEffect(() => {
    if (selectedCountry) {
      setCities([]);
      setRegions([]);
      setSelectedCity('');
      setSelectedRegionId('');
      setLoading(prev => ({ ...prev, cities: true }));
      axios.get(`/api/diyanet/countries/${selectedCountry}/cities`)
        .then(response => {
          console.log("Şehirler API Yanıtı:", response.data);
          setCities(response.data);
        })
        .catch(error => console.error("Şehirler yüklenirken hata oluştu:", error))
        .finally(() => setLoading(prev => ({ ...prev, cities: false })));
    }
  }, [selectedCountry]);

  // 3. Adım: Bir şehir seçildiğinde o şehrin bölgelerini çek (GÜNCELLENDİ)
  useEffect(() => {
    if (selectedCountry && selectedCity) {
      setRegions([]);
      setSelectedRegionId('');
      setLoading(prev => ({ ...prev, regions: true }));
      axios.get(`/api/diyanet/locations?country=${selectedCountry}&city=${selectedCity}`)
        .then(response => {
          console.log("Bölgeler API Yanıtı:", response.data);
          
          // --- DEĞİŞİKLİK BURADA ---
          const processedRegions = response.data.map(region => {
            // Önce bölge adını belirle (null ise şehir adını kullan)
            const regionName = region.region || selectedCity;
            
            // Eğer bölge adı şehir adıyla aynıysa, sonuna "MERKEZ" ekle
            const displayName = regionName === selectedCity ? `${regionName} MERKEZ` : regionName;

            return {
              ...region,
              region: displayName
            };
          });
          // --- DEĞİŞİKLİK SONU ---

          setRegions(processedRegions); // İşlenmiş veriyi state'e kaydet
        })
        .catch(error => console.error("Bölgeler yüklenirken hata oluştu:", error))
        .finally(() => setLoading(prev => ({ ...prev, regions: false })));
    }
  }, [selectedCountry, selectedCity]);
  
  // 4. Adım: Bölge seçildiğinde ana bileşene (App.js) tüm konum bilgilerini gönder
  const handleRegionChange = (e) => {
      const regionId = e.target.value;
      setSelectedRegionId(regionId);
      
      if (regionId) {
          // Seçilen bölgenin tam nesnesini bul
          const selectedRegionObject = regions.find(r => r.id.toString() === regionId);
          if (selectedRegionObject) {
              // App.js'e sadece ID'yi değil, bir nesne gönderiyoruz
              onLocationSelect({
                  id: regionId,
                  country: selectedCountry,
                  city: selectedCity,
                  region: selectedRegionObject.region // Bu değer artık "SİVAS MERKEZ" gibi olacak
              });
          }
      } else {
          onLocationSelect(null); // Seçim kaldırıldığında temizle
      }
  };


  return (
    <div className="location-selector">
      {/* Ülke Seçim Kutusu */}
      <select onChange={(e) => setSelectedCountry(e.target.value)} value={selectedCountry} disabled={loading.countries}>
        <option value="">{loading.countries ? 'Yükleniyor...' : 'Ülke Seçiniz'}</option>
        {countries.map(country => (
          <option key={country} value={country}>{country}</option>
        ))}
      </select>

      {/* Şehir Seçim Kutusu */}
      <select onChange={(e) => setSelectedCity(e.target.value)} value={selectedCity} disabled={!selectedCountry || loading.cities}>
        <option value="">{loading.cities ? 'Yükleniyor...' : 'Şehir Seçiniz'}</option>
        {cities.map(city => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>

      {/* Bölge Seçim Kutusu */}
      <select onChange={handleRegionChange} value={selectedRegionId} disabled={!selectedCity || loading.regions}>
        <option value="">{loading.regions ? 'Yükleniyor...' : 'Bölge Seçiniz'}</option>
        {/* Bu bölüm artık "SİVAS MERKEZ" gibi gösterecek */}
        {regions.map(region => (
          <option key={region.id} value={region.id}>{region.region}</option>
        ))}
      </select>
    </div>
  );
};

export default LocationSelector;
