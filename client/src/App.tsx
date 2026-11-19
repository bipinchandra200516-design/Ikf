import React, { useState, useEffect } from 'react';
import { 
  DealershipSettings, PublicVehicle, CategoryCounts, VehicleCategory 
} from './types';
import { 
  fetchPublicSettings, fetchCategoryCounts, fetchPublicVehicles 
} from './services/api';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategorySection } from './components/CategorySection';
import { LatestArrivals } from './components/LatestArrivals';
import { WhyChooseAndHowItWorks, Footer } from './components/Footer';
import { InventoryPage } from './components/InventoryPage';
import { VehicleDetailPage } from './components/VehicleDetailPage';
import { EnquiryModal } from './components/EnquiryModal';
import { AdminPortal } from './components/AdminPortal';

export function App() {
  // Navigation view: 'home' | 'inventory' | 'vehicle_detail' | 'admin'
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [filterSearch, setFilterSearch] = useState<string | undefined>(undefined);

  // Global settings & data
  const [settings, setSettings] = useState<DealershipSettings>({
    brand_name: 'AutoHub',
    tagline: 'AutoHub — Multi-Category Vehicle Marketplace',
    phone: '1800-309-3090',
    whatsapp_number: '919705305477',
    email: 'contact@autohub.com',
    address: 'AutoHub Pan-India Yard & Branch Network',
    default_price_label: 'Price',
    public_show_registration: true,
    public_show_yard_name: true,
    hero_headline: 'Certified Pre-Owned & Commercial Vehicle Inventory',
    hero_subtext: 'Direct yard purchases and transparent bidding powered by AutoHub Marketplace.'
  });

  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({
    'Own Car': 0,
    'Taxi Car': 0,
    'SCV': 0,
    'LCV': 0,
    'HCV': 0,
    'Tractor': 0,
    'CE': 0
  });

  const [latestVehicles, setLatestVehicles] = useState<PublicVehicle[]>([]);

  // Enquiry modal state
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquiryVehicle, setEnquiryVehicle] = useState<PublicVehicle | null>(null);

  // Load initial settings, dynamic counts from DB, and latest vehicles
  const refreshPublicData = () => {
    fetchPublicSettings()
      .then((s) => setSettings(s))
      .catch((err) => console.error('Failed to load settings:', err));

    fetchCategoryCounts()
      .then((counts) => setCategoryCounts(counts))
      .catch((err) => console.error('Failed to load category counts:', err));

    fetchPublicVehicles({ sort: 'recent', limit: 6 })
      .then((res) => setLatestVehicles(res.vehicles))
      .catch((err) => console.error('Failed to load latest vehicles:', err));
  };

  useEffect(() => {
    refreshPublicData();

    // Check window URL path on mount
    const path = window.location.pathname;
    const hash = window.location.hash;

    if (hash === '#admin') {
      setCurrentView('admin');
    } else if (path.startsWith('/vehicles/')) {
      const id = path.replace('/vehicles/', '');
      if (id) {
        setSelectedVehicleId(id);
        setCurrentView('vehicle_detail');
      }
    }

    // Handle browser popstate
    const handlePopState = () => {
      const p = window.location.pathname;
      const h = window.location.hash;
      if (h === '#admin') {
        setCurrentView('admin');
      } else if (p.startsWith('/vehicles/')) {
        setSelectedVehicleId(p.replace('/vehicles/', ''));
        setCurrentView('vehicle_detail');
      } else if (p === '/inventory') {
        setCurrentView('inventory');
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation handlers
  const handleNavigate = (view: string, cat?: string) => {
    if (view === 'admin') {
      window.location.hash = 'admin';
      setCurrentView('admin');
      return;
    }

    if (window.location.hash === '#admin') {
      window.history.pushState(null, '', '/');
    }

    if (view === 'inventory') {
      setFilterCategory(cat || 'all');
      setFilterSearch(undefined);
      window.history.pushState(null, '', '/inventory');
    } else if (view === 'home') {
      window.history.pushState(null, '', '/');
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: VehicleCategory) => {
    setFilterCategory(cat);
    setFilterSearch(undefined);
    setCurrentView('inventory');
    window.history.pushState(null, '', '/inventory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeroSearch = (query: string, cat?: string) => {
    setFilterSearch(query);
    setFilterCategory(cat || 'all');
    setCurrentView('inventory');
    window.history.pushState(null, '', '/inventory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewVehicleDetails = (vehicle: PublicVehicle) => {
    setSelectedVehicleId(vehicle.id);
    setCurrentView('vehicle_detail');
    window.history.pushState(null, '', `/vehicles/${vehicle.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEnquiryModal = (vehicle?: PublicVehicle) => {
    setEnquiryVehicle(vehicle || null);
    setEnquiryModalOpen(true);
  };

  // If in Admin Portal view
  if (currentView === 'admin') {
    return (
      <AdminPortal
        onBackToSite={() => {
          window.history.pushState(null, '', '/');
          setCurrentView('home');
          refreshPublicData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Header Navigation */}
      <Navbar
        settings={settings}
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {currentView === 'home' && (
          <>
            {/* Hero with search & category pills */}
            <Hero
              settings={settings}
              onSearch={handleHeroSearch}
              onBrowse={() => handleNavigate('inventory')}
            />

            {/* 6 Category Cards Section with live DB counts */}
            <CategorySection
              counts={categoryCounts}
              onSelectCategory={handleSelectCategory}
            />

            {/* Latest Arrivals from real DB */}
            <LatestArrivals
              vehicles={latestVehicles}
              settings={settings}
              onViewDetails={handleViewVehicleDetails}
              onEnquire={handleOpenEnquiryModal}
              onBrowseAll={() => handleNavigate('inventory')}
            />

            {/* Why Choose & How It Works Sections */}
            <WhyChooseAndHowItWorks
              settings={settings}
              onBrowse={() => handleNavigate('inventory')}
              onOpenEnquiry={() => handleOpenEnquiryModal()}
            />
          </>
        )}

        {currentView === 'inventory' && (
          <InventoryPage
            initialCategory={filterCategory}
            initialSearch={filterSearch}
            settings={settings}
            onViewDetails={handleViewVehicleDetails}
            onEnquire={handleOpenEnquiryModal}
          />
        )}

        {currentView === 'vehicle_detail' && selectedVehicleId && (
          <VehicleDetailPage
            vehicleId={selectedVehicleId}
            settings={settings}
            onBack={() => {
              setCurrentView('inventory');
              window.history.pushState(null, '', '/inventory');
            }}
            onSelectVehicle={handleViewVehicleDetails}
            onEnquire={handleOpenEnquiryModal}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onNavigate={handleNavigate}
        onOpenEnquiry={() => handleOpenEnquiryModal()}
      />

      {/* Customer Enquiry Modal */}
      <EnquiryModal
        vehicle={enquiryVehicle}
        settings={settings}
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
      />
    </div>
  );
}

export default App;
