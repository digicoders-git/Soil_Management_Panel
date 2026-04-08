import { useAuth } from '../context/AuthContext';

const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="h-20 glass border-b border-gray-200 sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden mr-4"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        <div className="hidden sm:flex items-center bg-gray-100 rounded-xl px-4 py-2 w-64 md:w-80 group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all border border-transparent focus-within:border-indigo-500/30">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search sites, machines..."
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-6">


        <div className="h-10 w-px bg-gray-200 hidden sm:block mx-2"></div>

        <div className="flex items-center">
          <div className="text-right mr-3 hidden md:block">
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
