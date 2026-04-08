import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

import SuperAdminDashboard from './pages/superadmin/Dashboard';
import AdminManagement from './pages/superadmin/AdminManagement';
import AllSites from './pages/superadmin/AllSites';
import AdminFunds from './pages/superadmin/AdminFunds';
import Reports from './pages/superadmin/Reports';

import AdminDashboard from './pages/admin/Dashboard';
import CreateSite from './pages/admin/CreateSite';
import SiteList from './pages/admin/SiteList';
import SiteDetails from './pages/admin/SiteDetails';
import MachineTypes from './pages/admin/MachineTypes';
import MachineUnits from './pages/admin/MachineUnits';
import Allmachines from './pages/admin/AllMachines';
import SupervisorManagement from './pages/admin/SupervisorManagement';
import InchargeDetails from './pages/admin/InchargeDetails';
import OperatorManagement from './pages/admin/OperatorManagement';
import GiveInstallment from './pages/admin/GiveInstallment';
import ExpensesMonitor from './pages/admin/ExpensesMonitor';
import MachineReports from './pages/admin/MachineReports';
import MovementList from './pages/admin/MovementList';
import CreateTransfer from './pages/admin/CreateTransfer';
import MyFunds from './pages/admin/MyFunds';
import Profile from './pages/Profile';

import MySites from './pages/user/MySites';
import SiteWork from './pages/user/SiteWork';
import UserDashboard from './pages/user/Dashboard';
import UserExpenses from './pages/user/Expenses';
import UserMachineReports from './pages/user/MachineReports';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/admins"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <AdminManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/sites"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <AllSites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/reports"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/funds"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <AdminFunds />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/supervisorManagement"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <SupervisorManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/supervisors/:id"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <InchargeDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/operators"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <OperatorManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-site"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <CreateSite />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sites"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <SiteList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sites/:id"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <SiteDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/machines/types"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <MachineTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/machines/units"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <MachineUnits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/machines/all"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <Allmachines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/installments"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <GiveInstallment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/expenses-monitor"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <ExpensesMonitor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/machine-reports"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <MachineReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/movements"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <MovementList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/movements/create"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                <CreateTransfer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/funds"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MyFunds />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'user']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/sites"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <MySites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/sites/:id"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <SiteWork />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/expenses"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserExpenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/machine-reports"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserMachineReports />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
