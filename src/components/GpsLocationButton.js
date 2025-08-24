import React from 'react';

const GpsLocationButton = ({ onClick, loading }) => {
  return (
    <div className="gps-button-container">
      <button 
        className={`button refresh-button`}
        onClick={onClick}
        disabled={loading}
      >
        {loading ? 'Konum alınıyor...' : 'Konumdan Vakitleri Getir'}
      </button>
    </div>
  );
};

export default GpsLocationButton;