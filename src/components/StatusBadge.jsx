const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'assigned':
      case 'available':
      case 'fixed':
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'in_progress':
      case 'returned':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'machines_assigned':
      case 'supervisor_assigned':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'created':
      case 'closed':
        return 'bg-slate-100 text-slate-800 border border-slate-200';
      case 'cancelled':
      case 'damaged':
      case 'rejected':
      case 'dead':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'repair':
      case 'repairing':
      case 'reported':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const formatStatus = (s) => {
    if (!s) return 'Unknown';
    return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full shadow-sm text-center inline-block ${getStatusColor()}`}>
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;
