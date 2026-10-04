import React from 'react';
import Dashboard from '../components/Dashboard/Dashboard';

const DashboardContainer = () => {
  // La autenticación ahora se maneja en ProtectedRoute
  // No necesitamos verificación adicional aquí
  
  console.log('🏠 DashboardContainer - Renderizando dashboard');
  
  return <Dashboard />;
};

export default DashboardContainer;
