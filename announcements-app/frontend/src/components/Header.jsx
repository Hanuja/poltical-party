import React from 'react';
import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// Mock user data – replace with real auth context in production
const mockUser = {
  name: 'Super Admin',
  role: 'Super Admin',
};

export default function Header() {
  const { t } = useTranslation();

  const handleSignOut = () => {
    // Placeholder: clear token / user session
    localStorage.removeItem('authToken');
    alert('Signed out');
    // In a real app you would redirect to login page
  };

  const handleRemoveSuperAdmin = () => {
    if (window.confirm('Are you sure you want to remove Super Admin?')) {
      // Placeholder – call backend delete endpoint here
      alert('Super Admin removed (mock)');
    }
  };

  return (
    <header className="bg-maroon-900 text-white py-4">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4 gap-2">
        {/* Branding & welcome */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-2xl font-bold">
            RISE Governance Hub
          </Link>
          <span className="text-sm opacity-80">Welcome back, {mockUser.name}</span>
        </div>

        {/* Navigation and actions */}
        <nav className="flex items-center space-x-4 mt-2 md:mt-0">
          <Link to="/admin" className="hover:underline">
            {t('admin.announcements')}
          </Link>

          {/* Remove Super Admin button – visible only for Super Admin */}
          {mockUser.role === 'Super Admin' && (
            <button
              onClick={handleRemoveSuperAdmin}
              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
            >
              Remove Super Admin
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
          >
            Sign Out
          </button>

          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
