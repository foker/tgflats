import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePageNew } from './pages/HomePageNew';
import ListingDetailPage from './pages/ListingDetailPage';

// Simple Navbar for the new design
const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-blue-600">
            TBI Properties
          </a>
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Browse
            </a>
            <a href="#saved" className="text-gray-700 hover:text-blue-600 transition-colors">
              Saved
            </a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">
              About
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

function AppNew() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePageNew />} />
        <Route path="/listing/:id" element={<ListingDetailPage />} />
      </Routes>
    </div>
  );
}

export default AppNew;