import { useAuth } from '../context/AuthContext';

const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 sm:h-20 glass border-b border-gray-200 sticky top-0 z-10 px-3 sm:px-8 flex items-center justify-between">
      <div className="flex items-center min-w-0">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden mr-2 flex-shrink-0"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-6 flex-shrink-0">
        <div className="h-8 w-px bg-gray-200 hidden sm:block mx-2"></div>
        <div className="flex items-center">
          <div className="text-right mr-2 hidden md:block">
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
