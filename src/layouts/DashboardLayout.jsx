import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loading } = useAuth();

  if (loading) return <Loader />;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
