import React from 'react';

const GpsLocationButton = ({ onClick, loading }) => {
  return (
    <div className="gps-button-container">
      <button 
        className={`gps-location-button ${loading ? 'loading' : ''}`}
        onClick={onClick}
        disabled={loading}
      >
        <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-map-marker-alt'}`} 
           style={{marginRight: '8px'}}></i>
        {loading ? 'Konum alınıyor...' : 'Konumdan Vakitleri Getir'}
      </button>
    </div>
  );
};

export default GpsLocationButton;