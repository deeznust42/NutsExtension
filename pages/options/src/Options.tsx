import { useState, useEffect } from 'react';
import '@src/Options.css';
import { Button } from '@extension/ui';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ModelSettings } from './components/ModelSettings';

type TabTypes = 'models' | 'help';

const TABS: { id: TabTypes; label: string }[] = [
  { id: 'models', label: 'Models' },
  { id: 'help', label: 'Help' },
];

const Options = () => {
  const [activeTab, setActiveTab] = useState<TabTypes>('models');

  const handleTabClick = (tabId: TabTypes) => {
    if (tabId === 'help') {
      window.open('https://nutslms.com', '_blank');
    } else {
      setActiveTab(tabId);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'models':
        return <ModelSettings />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex min-h-screen min-w-[768px] bg-[#1a2550] text-gray-900`}>
      {/* Vertical Navigation Bar */}
      <nav className={`w-56 border-r border-[#22306a] bg-white/95 shadow-md flex flex-col justify-between`}>
        <div className="p-6">
          <h1 className={`mb-8 text-2xl font-extrabold tracking-tight text-center text-[#1a2550]`}>Settings</h1>
          <ul className="space-y-3">
            {TABS.map(item => (
              <li key={item.id}>
                <Button
                  onClick={() => handleTabClick(item.id)}
                  className={`flex w-full items-center space-x-2 rounded-lg px-4 py-2 text-left text-lg font-semibold transition-colors duration-150
                    ${
                      activeTab === item.id
                        ? 'bg-[#1a2550] text-white shadow'
                        : 'bg-white text-[#1a2550] hover:bg-[#2563eb] hover:text-white border border-[#e5e7eb]'
                    }`}>
                  <span>{item.label}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 flex items-center justify-center bg-[#1a2550]`}>
        <div className={`w-full max-w-2xl p-10 rounded-2xl shadow-2xl bg-white`}>
          <div className="mb-8 text-center">
            <h2 className={`text-3xl font-extrabold mb-2 text-[#1a2550]`}>Deez Nust Settings</h2>
            <p className={`text-lg text-[#22306a]`}>Configure deez</p>
          </div>
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <div>Loading...</div>), <div>Error Occurred</div>);
