import React, { useState, useEffect } from 'react';

const padZero = (num) => num.toString().padStart(2, '0');

const PrayerDashboard = ({ prayerData, locationInfo, loading, error }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todayPrayers, setTodayPrayers] = useState(null);
    const [nextPrayer, setNextPrayer] = useState({ name: '', time: null });
    const [countdown, setCountdown] = useState('');

    // Her vakit için farklı ikonları tanımlayan nesne
    const prayerIcons = {
        "İmsak": "fas fa-moon",
        "Güneş": "fas fa-sun",
        "Öğle": "fas fa-sun",
        "İkindi": "fas fa-cloud-sun",
        "Akşam": "fas fa-cloud-moon",
        "Yatsı": "fas fa-moon"
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (prayerData && prayerData.length > 0) {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const foundToday = prayerData.find(day => day.date.startsWith(todayStr));
            setTodayPrayers(foundToday);

            if (foundToday) {
                const prayerTimes = {
                    "İmsak": foundToday.fajr,
                    "Güneş": foundToday.sun,
                    "Öğle": foundToday.dhuhr,
                    "İkindi": foundToday.asr,
                    "Akşam": foundToday.maghrib,
                    "Yatsı": foundToday.isha
                };

                let nextPrayerFound = false;
                for (const [name, timeStr] of Object.entries(prayerTimes)) {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    const prayerDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                    if (prayerDateTime > now) {
                        setNextPrayer({ name, time: prayerDateTime });
                        nextPrayerFound = true;
                        break;
                    }
                }
                
                if (!nextPrayerFound) {
                    const tomorrowStr = new Date(now.setDate(now.getDate() + 1)).toISOString().split('T')[0];
                    const tomorrowPrayers = prayerData.find(day => day.date.startsWith(tomorrowStr));
                    if (tomorrowPrayers) {
                        const [hours, minutes] = tomorrowPrayers.fajr.split(':').map(Number);
                        const nextFajrTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                        setNextPrayer({ name: "İmsak", time: nextFajrTime });
                    }
                }
            }
        }
    }, [prayerData, currentTime]);

    useEffect(() => {
        if (nextPrayer.time) {
            const totalSeconds = Math.floor((nextPrayer.time - currentTime) / 1000);
            if (totalSeconds >= 0) {
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                setCountdown(`${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`);
            }
        }
    }, [currentTime, nextPrayer]);

    if (error) return <p className="error-message">Vakitler yüklenemedi: {error}</p>;
    
    // Konum seçimi yapılmamışsa özel bir görüntü göster (loading kontrolü kaldırıldı)
    if (!locationInfo) {
        return (
            <div className="no-location-container">
                <div className="location-prompt">
                    <div className="location-icon">
                        <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <h2>Lütfen konum seçimi yapınız</h2>
                    <p>Namaz vakitlerini görüntülemek<br/>için yukarıdaki menüden ülke,<br/>şehir ve bölge seçimi yapınız.</p>
                </div>
            </div>
        );
    }
    
    if (!todayPrayers) return 

    const prayerNames = ["İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı"];
    const prayerTimes = [todayPrayers.fajr, todayPrayers.sun, todayPrayers.dhuhr, todayPrayers.asr, todayPrayers.maghrib, todayPrayers.isha];

    const formatDate = (date) => {
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
        });
    };

    return (
        <div className="prayer-dashboard">
            <div className="location-display">
                <h2><i className="fas fa-map-marker-alt"></i> {locationInfo.city}, {locationInfo.region}</h2>
                <p>{locationInfo.country}</p>
            </div>
            <div className="date-display">
                <p><i className="fas fa-calendar-alt"></i> {formatDate(currentTime)}</p>
            </div>
            
            <div className="time-panel">
                <div className="current-time">
                    {currentTime.toLocaleTimeString('tr-TR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="countdown-timer">
                    {nextPrayer.name && (
                        <>
                            <span>{nextPrayer.name} vaktine kalan süre:</span>
                            <p>{countdown}</p>
                        </>
                    )}
                </div>
            </div>

            <div className="prayer-times-grid-single">
                {prayerNames.map((name, index) => (
                    <div key={name} className={`prayer-time-card-single ${nextPrayer.name === name ? 'highlighted' : ''}`}>
                        {/* İkonlar artık dinamik olarak geliyor */}
                        <h3><i className={prayerIcons[name]}></i> {name}</h3>
                        <p>{prayerTimes[index]}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PrayerDashboard;