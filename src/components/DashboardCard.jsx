const DashboardCard = ({ title, value, icon, color = 'blue', onClick }) => {
  const gradientClasses = {
    blue: 'card-gradient-blue shadow-blue-500/20',
    green: 'card-gradient-green shadow-emerald-500/20',
    yellow: 'card-gradient-orange shadow-orange-500/20',
    red: 'card-gradient-orange shadow-red-500/20',
    purple: 'card-gradient-purple shadow-purple-500/20',
    indigo: 'card-gradient-blue shadow-indigo-500/20',
  };

  const lightColorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-orange-50 text-orange-600',
    red: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div onClick={onClick} className={`bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group ${onClick ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1 group-hover:text-gray-500 transition-colors uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline">
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{value}</h3>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span className="flex items-center text-emerald-500 font-medium bg-emerald-50 px-2 py-1 rounded-lg">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
              12%
            </span>
            <span className="text-gray-400 ml-2">from last month</span>
          </div>
        </div>
        <div className={`p-4 rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${gradientClasses[color]}`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
