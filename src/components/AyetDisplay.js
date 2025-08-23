import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AyetDisplay = () => {
  const [ayet, setAyet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSure, setCurrentSure] = useState(1);
  const [currentAyet, setCurrentAyet] = useState(1);
  const [sureInfo, setSureInfo] = useState({}); // Sure bilgilerini saklayacak
  const ayetContainerRef = useRef(null);

  // Sure isimlerini Türkçe'ye çeviren fonksiyon
  const sureIsmiTurkce = (sureNumarasi) => {
    const sureIsimleri = {
      1: "Fatiha", 2: "Bakara", 3: "Âl-i İmran", 4: "Nisa", 5: "Maide", 6: "Enam", 7: "Araf", 8: "Enfal", 9: "Tevbe", 10: "Yunus",
      11: "Hud", 12: "Yusuf", 13: "Rad", 14: "İbrahim", 15: "Hicr", 16: "Nahl", 17: "İsra", 18: "Kehf", 19: "Meryem", 20: "Taha",
      21: "Enbiya", 22: "Hac", 23: "Müminun", 24: "Nur", 25: "Furkan", 26: "Şuara", 27: "Neml", 28: "Kasas", 29: "Ankebut", 30: "Rum",
      31: "Lokman", 32: "Secde", 33: "Ahzab", 34: "Sebe", 35: "Fatır", 36: "Yasin", 37: "Saffat", 38: "Sad", 39: "Zümer", 40: "Mümin",
      41: "Fussilet", 42: "Şura", 43: "Zuhruf", 44: "Duhan", 45: "Casiye", 46: "Ahkaf", 47: "Muhammed", 48: "Fetih", 49: "Hucurat", 50: "Kaf",
      51: "Zariyat", 52: "Tur", 53: "Necm", 54: "Kamer", 55: "Rahman", 56: "Vakia", 57: "Hadid", 58: "Mücadele", 59: "Haşr", 60: "Mümtehine",
      61: "Saff", 62: "Cuma", 63: "Münafikun", 64: "Tegabün", 65: "Talak", 66: "Tahrim", 67: "Mülk", 68: "Kalem", 69: "Hakka", 70: "Mearic",
      71: "Nuh", 72: "Cin", 73: "Müzzemmil", 74: "Müddessir", 75: "Kıyame", 76: "İnsan", 77: "Mürselat", 78: "Nebe", 79: "Naziat", 80: "Abese",
      81: "Tekvir", 82: "İnfitar", 83: "Mutaffifin", 84: "İnşikak", 85: "Buruc", 86: "Tarık", 87: "Ala", 88: "Gaşiye", 89: "Fecr", 90: "Beled",
      91: "Şems", 92: "Leyl", 93: "Duha", 94: "İnşirah", 95: "Tin", 96: "Alak", 97: "Kadir", 98: "Beyyine", 99: "Zilzal", 100: "Adiyat",
      101: "Karia", 102: "Tekaşür", 103: "Asr", 104: "Hümeze", 105: "Fil", 106: "Kureyş", 107: "Maun", 108: "Kevser", 109: "Kafirun", 110: "Nasr",
      111: "Tebbet", 112: "İhlas", 113: "Felak", 114: "Nas"
    };
    return sureIsimleri[sureNumarasi] || `${sureNumarasi}. Sure`;
  };

  // Sure bilgilerini yükle ve sakla
  const loadSureInfo = async (sureNumber) => {
    if (sureInfo[sureNumber]) {
      return sureInfo[sureNumber];
    }

    try {
      const response = await axios.get(`https://api.alquran.cloud/v1/surah/${sureNumber}/tr.diyanet`);
      const info = {
        numberOfAyahs: response.data.data.numberOfAyahs
      };
      setSureInfo(prev => ({
        ...prev,
        [sureNumber]: info
      }));
      return info;
    } catch (error) {
      console.error(`Sure ${sureNumber} bilgisi alınırken hata:`, error);
      return { numberOfAyahs: 1 };
    }
  };

  // Belirtilen sure ve ayet numarasındaki ayeti yükle
  const loadAyet = async (sureNo, ayetNo) => {
    setLoading(true);
    setError(null);
    
    try {
      const ayetResponse = await axios.get(`https://api.alquran.cloud/v1/ayah/${sureNo}:${ayetNo}/tr.diyanet`);
      const ayetData = ayetResponse.data.data;
      
      setAyet({
        text: ayetData.text,
        sureName: sureIsmiTurkce(ayetData.surah.number),
        sureNumber: ayetData.surah.number,
        ayahNumber: ayetData.numberInSurah
      });

      setCurrentSure(sureNo);
      setCurrentAyet(ayetNo);
      
      // Kaydırma çubuğunu en üste getir
      if (ayetContainerRef.current) {
        ayetContainerRef.current.scrollTop = 0;
      }
      
    } catch (err) {
      console.error('Ayet yüklenirken hata oluştu:', err);
      setError('Ayet yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Rastgele ayet seç
  const rastgeleAyetSec = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Rastgele sure numarası (1-114 arası)
      const rastgeleSure = Math.floor(Math.random() * 114) + 1;
      
      // Önce surenin toplam ayet sayısını öğren
      const sureData = await loadSureInfo(rastgeleSure);
      const toplamAyet = sureData.numberOfAyahs;
      
      // Rastgele ayet numarası
      const rastgeleAyetNo = Math.floor(Math.random() * toplamAyet) + 1;
      
      await loadAyet(rastgeleSure, rastgeleAyetNo);
      
    } catch (err) {
      console.error('Rastgele ayet seçilirken hata oluştu:', err);
      setError('Ayet yüklenirken bir hata oluştu.');
      setLoading(false);
    }
  };

  // Bir sonraki ayete geç
  const sonrakiAyet = async () => {
    try {
      const mevcutSureInfo = await loadSureInfo(currentSure);
      
      // Eğer mevcut surenin son ayetindeyse
      if (currentAyet >= mevcutSureInfo.numberOfAyahs) {
        // Son sure (114) değilse bir sonraki sureye geç
        if (currentSure < 114) {
          await loadAyet(currentSure + 1, 1);
        }
      } else {
        // Aynı sure içinde bir sonraki ayete geç
        await loadAyet(currentSure, currentAyet + 1);
      }
    } catch (error) {
      console.error('Sonraki ayet yüklenirken hata:', error);
      setError('Sonraki ayet yüklenirken bir hata oluştu.');
    }
  };

  // Bir önceki ayete geç
  const oncekiAyet = async () => {
    try {
      // Eğer surenin ilk ayetindeyse
      if (currentAyet <= 1) {
        // İlk sure (1) değilse bir önceki sureye geç
        if (currentSure > 1) {
          const oncekiSureInfo = await loadSureInfo(currentSure - 1);
          await loadAyet(currentSure - 1, oncekiSureInfo.numberOfAyahs);
        }
      } else {
        // Aynı sure içinde bir önceki ayete geç
        await loadAyet(currentSure, currentAyet - 1);
      }
    } catch (error) {
      console.error('Önceki ayet yüklenirken hata:', error);
      setError('Önceki ayet yüklenirken bir hata oluştu.');
    }
  };

  // Buton durumlarını kontrol et
  const isFirstAyet = currentSure === 1 && currentAyet === 1;
  const isLastAyet = async () => {
    if (currentSure === 114) {
      const sureData = await loadSureInfo(114);
      return currentAyet >= sureData.numberOfAyahs;
    }
    return false;
  };

  // Son ayet kontrolü için state
  const [isLastAyetState, setIsLastAyetState] = useState(false);

  // currentSure veya currentAyet değiştiğinde son ayet kontrolü yap
  useEffect(() => {
    const checkLastAyet = async () => {
      const result = await isLastAyet();
      setIsLastAyetState(result);
    };
    checkLastAyet();
  }, [currentSure, currentAyet]);

  useEffect(() => {
    rastgeleAyetSec();
  }, []);

  return (
    <div className="ayet-container" ref={ayetContainerRef}>
      <h2>Ayet-i Kerime</h2>
      {loading ? (
        <div className="loading-spinner"></div>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : ayet ? (
        <div>
          <p className="ayet-text">{ayet.text}</p>
          <p className="kaynak">
            {ayet.sureName} Suresi, {ayet.ayahNumber}. Ayet
          </p>
        </div>
      ) : (
        <p>Ayet yükleniyor...</p>
      )}
      <div className="button-group">
        <button 
          className={`button nav-button ${isFirstAyet ? 'disabled' : ''}`}
          onClick={oncekiAyet}
          disabled={loading || isFirstAyet}
        >
          ◀ Önceki
        </button>
        <button 
          className="button refresh-button" 
          onClick={rastgeleAyetSec}
          disabled={loading}
        >
          {loading ? 'Yükleniyor...' : 'Yenile'}
        </button>
        <button 
          className={`button nav-button ${isLastAyetState ? 'disabled' : ''}`}
          onClick={sonrakiAyet}
          disabled={loading || isLastAyetState}
        >
          Sonraki ▶
        </button>
      </div>
    </div>
  );
};

export default AyetDisplay;