import React, { useState, useEffect } from 'react';
import moment from 'moment-timezone'; 
import 'moment/locale/tr';

const padZero = (num) => num.toString().padStart(2, '0');

const PrayerDashboard = ({ prayerData, locationInfo, loading, error, timeZone }) => {
    moment.locale('tr');

    const [currentTime, setCurrentTime] = useState(moment().tz(timeZone || 'Europe/Istanbul'));
    const [todayPrayers, setTodayPrayers] = useState(null);
    const [nextPrayer, setNextPrayer] = useState({ name: '', time: null });
    const [countdown, setCountdown] = useState('');

    const prayerIcons = {
        "İmsak": "fas fa-moon",
        "Güneş": "fas fa-sun",
        "Öğle": "fas fa-sun",
        "İkindi": "fas fa-cloud-sun",
        "Akşam": "fas fa-cloud-moon",
        "Yatsı": "fas fa-moon"
    };

    // Current time güncellemesi - timeZone değiştiğinde de güncelle
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(moment().tz(timeZone || 'Europe/Istanbul'));
        }, 1000);
        return () => clearInterval(timer);
    }, [timeZone]);

    // Prayer data değiştiğinde hesaplamaları sıfırla ve yeniden yap
    useEffect(() => {
        // Prayer data veya timeZone değiştiğinde state'leri sıfırla
        setTodayPrayers(null);
        setNextPrayer({ name: '', time: null });
        setCountdown('');

        if (prayerData && prayerData.length > 0 && timeZone) {
            const now = moment().tz(timeZone);
            const todayStr = now.format('YYYY-MM-DD');
            const foundToday = prayerData.find(day => day.date.startsWith(todayStr));
            
            if (foundToday) {
                setTodayPrayers(foundToday);

                const prayerTimes = {
                    "İmsak": foundToday.fajr,
                    "Güneş": foundToday.sun,
                    "Öğle": foundToday.dhuhr,
                    "İkindi": foundToday.asr,
                    "Akşam": foundToday.maghrib,
                    "Yatsı": foundToday.isha
                };

                // Bir sonraki namaz vaktini bul
                let nextPrayerFound = false;
                for (const [name, timeStr] of Object.entries(prayerTimes)) {
                    const prayerDateTime = moment.tz(`${todayStr}T${timeStr}`, timeZone);
                    if (prayerDateTime.isAfter(now)) {
                        setNextPrayer({ name, time: prayerDateTime });
                        nextPrayerFound = true;
                        break;
                    }
                }

                // Bugünün tüm namaz vakitleri geçtiyse yarının imsak vaktini al
                if (!nextPrayerFound) {
                    const tomorrow = now.clone().add(1, 'day');
                    const tomorrowStr = tomorrow.format('YYYY-MM-DD');
                    const tomorrowPrayers = prayerData.find(day => day.date.startsWith(tomorrowStr));
                    if (tomorrowPrayers) {
                        const nextFajrTime = moment.tz(`${tomorrowStr}T${tomorrowPrayers.fajr}`, timeZone);
                        setNextPrayer({ name: "İmsak", time: nextFajrTime });
                    } else {
                        // Yarının verisi yoksa bugünün imsak vaktini yarına taşı
                        const nextFajrTime = moment.tz(`${todayStr}T${foundToday.fajr}`, timeZone).add(1, 'day');
                        setNextPrayer({ name: "İmsak", time: nextFajrTime });
                    }
                }
            }
        }
    }, [prayerData, timeZone]); // currentTime'ı dependency'den çıkardık

    // Geri sayım hesaplaması
    useEffect(() => {
        if (nextPrayer.time && currentTime) {
            const diffSeconds = nextPrayer.time.diff(currentTime, 'seconds');
            if (diffSeconds >= 0) {
                const hours = Math.floor(diffSeconds / 3600);
                const minutes = Math.floor((diffSeconds % 3600) / 60);
                const seconds = diffSeconds % 60;
                setCountdown(`${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`);
            } else {
                setCountdown('');
            }
        } else {
            setCountdown('');
        }
    }, [currentTime, nextPrayer.time]);

    if (!locationInfo) {
        return (
            <div className="no-location-container">
                <div className="location-prompt">
                    <div className="location-icon">
                        <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <h2>Lütfen konum seçimi yapınız</h2>
                    <p>Namaz vakitlerini görüntülemek<br />için yukarıdaki menüden ülke,<br />şehir ve bölge seçimi yapınız.</p>
                </div>
            </div>
        );
    }

    if (!todayPrayers) return null;

    const prayerNames = ["İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı"];
    const prayerTimes = [todayPrayers.fajr, todayPrayers.sun, todayPrayers.dhuhr, todayPrayers.asr, todayPrayers.maghrib, todayPrayers.isha];

    const formatDate = (date) => {
        return date.format('LLLL');
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
                    {currentTime.format('HH:mm:ss')}
                </div>
                <div className="countdown-timer">
                    {nextPrayer.name && nextPrayer.time && countdown && (
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
                        <h3><i className={prayerIcons[name]}></i> {name}</h3>
                        <p>{prayerTimes[index]}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PrayerDashboard;