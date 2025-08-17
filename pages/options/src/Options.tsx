import { useState, useEffect } from 'react';
import '@src/Options.css';

import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ModelSettings } from './components/ModelSettings';

const Options = () => {
  const handleHelpClick = () => {
    window.open('https://nutslms.com/guide', '_blank');
  };

  const renderTabContent = () => {
    return <ModelSettings />;
  };

  return (
    <div className={`min-h-screen bg-[#1a2550] text-white`}>
      {/* Main Content Area */}
      <main className={`p-8 bg-[#1a2550] max-w-6xl mx-auto`}>
        <div className="mb-10 relative">
          <h2 className={`text-4xl font-bold mb-3 text-white tracking-tight leading-tight`}>Deez Nust Settings</h2>
          <p className={`text-lg text-gray-300 font-normal leading-relaxed`}>You may configure deez nust here</p>
          <button
            onClick={handleHelpClick}
            className={`absolute top-0 right-0 px-4 py-2 rounded-full border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/15 hover:border-white/30 transition-colors duration-200 ease-in-out text-sm font-medium`}>
            Help
          </button>
        </div>
        {renderTabContent()}
      </main>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <div>Loading...</div>), <div>Error Occurred</div>);
