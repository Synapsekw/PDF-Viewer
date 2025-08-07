import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    console.log('Logo clicked, navigating to /app');
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-inter">
      {/* Background gradient overlay with blur effect - matches app exactly */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm"></div>
      
      {/* Main content centered */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div 
          onClick={handleLogoClick}
          className="cursor-pointer transition-all duration-300 hover:scale-105"
        >
          {/* Logo - 300x300 size with white filter */}
          <img 
            src="/Spectra.png" 
            alt="Spectra Logo" 
            className="object-contain"
            style={{ 
              width: '300px', 
              height: '300px',
              filter: 'brightness(0) invert(1)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
