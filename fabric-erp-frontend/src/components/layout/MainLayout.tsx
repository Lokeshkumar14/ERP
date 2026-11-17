import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface MainLayoutProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onOpenQuickAction: (action: string) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentView,
  onSelectView,
  onOpenQuickAction,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex min-h-screen bg-slate-50/60 text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={onSelectView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenQuickAction={onOpenQuickAction}
          currentSearch={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Scrollable Main Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
