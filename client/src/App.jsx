import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import StockInPage from './pages/StockInPage';
import AdjustmentPage from './pages/AdjustmentPage';
import SalesNewPage from './pages/SalesNewPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import StockHistoryPage from './pages/StockHistoryPage';
import SuppliersPage from './pages/SuppliersPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout title="Dashboard Summary" />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            <Route element={<AppLayout title="Inventory Master Catalog" />}>
              <Route path="/inventory" element={<InventoryPage />} />
            </Route>

            <Route element={<AppLayout title="Record Stock Received" />}>
              <Route path="/inventory/stock-in" element={<StockInPage />} />
            </Route>

            <Route element={<AppLayout title="Stock Movement History" />}>
              <Route path="/inventory/history" element={<StockHistoryPage />} />
            </Route>

            <Route element={<AppLayout title="Point of Sale (POS)" />}>
              <Route path="/sales/new" element={<SalesNewPage />} />
            </Route>

            <Route element={<AppLayout title="Sales Transactions History" />}>
              <Route path="/sales/history" element={<SalesHistoryPage />} />
            </Route>

            <Route element={<AppLayout title="Bulk LPG Suppliers" />}>
              <Route path="/suppliers" element={<SuppliersPage />} />
            </Route>

            <Route element={<AppLayout title="Analytics & Reports" />}>
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
          </Route>

          {/* Admin Only Protected Routes */}
          <Route element={<ProtectedRoute adminOnly={true} />}>
            <Route element={<AppLayout title="Stock Inventory Adjustment" />}>
              <Route path="/inventory/adjustment" element={<AdjustmentPage />} />
            </Route>

            <Route element={<AppLayout title="User Account Management" />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>

          {/* Default Fallback Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
