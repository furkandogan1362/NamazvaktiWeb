import React, { useState, useEffect, useRef } from 'react';
import buhariData from '../tur-bukhari.json';
import ibnmajahData from '../tur-ibnmajah.json';
import malikData from '../tur-malik.json';
import muslimData from '../tur-muslim.json';
import nasaiData from '../tur-nasai.json';
import tirmidhiData from '../tur-tirmidhi.json';
import abudawudData from '../tur-abudawud.json';

const HadisDisplay = () => {
  const [hadis, setHadis] = useState(null);
  const [kaynak, setKaynak] = useState('');
  const hadisContainerRef = useRef(null);

  const rastgeleHadisSec = () => {
    // Yedi kaynaktan birini rastgele seç
    const kaynaklar = [
      { data: buhariData, name: 'Sahih-i Buhârî' },
      { data: ibnmajahData, name: 'Sünen-i İbn Mâce' },
      { data: malikData, name: 'Muvatta İmam Mâlik' },
      { data: muslimData, name: 'Sahih-i Muslim' },
      { data: nasaiData, name: 'Sünen-i Nesâî' },
      { data: tirmidhiData, name: 'Câmiu\'s-Sahih (Tirmizî)' },
      { data: abudawudData, name: 'Sünen-i Ebû Dâvûd' }
    ];
    
    let secilenHadis = null;
    let secilenKaynakName = '';
    let denemeCount = 0;
    const maxDeneme = 50; // Sonsuz döngüyü önlemek için maksimum deneme sayısı
    
    // Boş olmayan bir hadis bulana kadar dene
    while (!secilenHadis && denemeCount < maxDeneme) {
      const rastgeleKaynakIndex = Math.floor(Math.random() * kaynaklar.length);
      const secilenKaynak = kaynaklar[rastgeleKaynakIndex];
      
      const hadisler = secilenKaynak.data.hadiths;
      if (hadisler && hadisler.length > 0) {
        const rastgeleHadisIndex = Math.floor(Math.random() * hadisler.length);
        const hadis = hadisler[rastgeleHadisIndex];
        
        // Text boş değilse ve sadece boşluk karakterleri içermiyorsa kabul et
        if (hadis.text && hadis.text.trim() !== '') {
          secilenHadis = hadis;
          secilenKaynakName = secilenKaynak.name;
        }
      }
      denemeCount++;
    }
    
    if (secilenHadis) {
      setHadis(secilenHadis);
      setKaynak(secilenKaynakName);
      
      // Kaydırma çubuğunu en üste getir
      if (hadisContainerRef.current) {
        hadisContainerRef.current.scrollTop = 0;
      }
    } else {
      // Eğer 50 denemede boş olmayan hadis bulunamazsa (çok nadir durum)
      console.warn('Boş olmayan hadis bulunamadı');
    }
  };

  useEffect(() => {
    rastgeleHadisSec();
  }, []);

  return (
    <div className="hadis-container" ref={hadisContainerRef}>
      <h2>Hadis-i Şerif</h2>
      {hadis ? (
        <div>
          <p className="hadis-text">{hadis.text}</p>
          <p className="kaynak">
            Kaynak: {kaynak}, Kitap: {hadis.reference.book}, Hadis: {hadis.reference.hadith}
          </p>
        </div>
      ) : (
        <p>Hadis yükleniyor...</p>
      )}
      <div className="button-group">
        <button className="button refresh-button" onClick={rastgeleHadisSec}>
          Yenile
        </button>
      </div>
    </div>
  );
};

export default HadisDisplay;