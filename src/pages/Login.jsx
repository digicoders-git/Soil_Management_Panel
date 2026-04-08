import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({ mobile: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(formData.mobile, formData.password);
      const role = data.user.role;

      if (role === "superadmin") {
        navigate("/superadmin/dashboard");
      } else if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-50 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="max-w-md w-full glass bg-white/80 rounded-[2rem] shadow-2xl shadow-indigo-100 p-10 z-10 border border-white relative">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-200">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.288a2 2 0 01-1.945 0l-.628-.288a2 2 0 00-1.945 0l-.628.288a2 2 0 01-1.945 0l-.628-.288a2 2 0 00-1.286-.172l-2.387.477a2 2 0 00-1.022.547l-.96.96a2 2 0 000 2.828l.96.96a2 2 0 001.022.547l2.387.477a2 2 0 001.286-.172l.628-.288a2 2 0 011.945 0l.628.288a2 2 0 001.945 0l.628-.288a2 2 0 011.945 0l.628.288a6 6 0 003.86.517l2.387-.477a2 2 0 001.022-.547l.96-.96a2 2 0 000-2.828l-.96-.96z" /></svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">SoilPro <span className="text-indigo-600">Hub</span></h1>
          <p className="text-slate-500 mt-3 font-medium">Site Resource Management System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold flex items-center">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              Mobile Number
            </label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              required
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 placeholder-slate-400 font-medium"
              placeholder="10-digit mobile number"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 placeholder-slate-400 font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 font-bold transition-all shadow-xl shadow-indigo-200 flex items-center justify-center group"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {loading ? "Authenticating..." : "Member Login"}
            {!loading && <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
          </button>
        </form>

        <p className="mt-10 text-center text-slate-400 text-sm font-medium">
          Protected System. Authorized access only.
        </p>
      </div>
    </div>
  );
};

export default Login;
