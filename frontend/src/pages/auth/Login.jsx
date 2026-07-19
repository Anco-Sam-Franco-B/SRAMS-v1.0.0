import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, GraduationCap, Loader2, Hash, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import useAuthStore from "../../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithPin } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [portal, setPortal] = useState("staff"); // "staff" or "student"
  const [form, setForm] = useState({ email: "", password: "" });
  const [studentForm, setStudentForm] = useState({ admission_no: "", pin: "" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentForm((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (portal === "staff") {
        if (!form.email.trim() || !form.password.trim()) {
          setLoading(false);
          return toast.error("Email and password are required.");
        }
        const data = await login(form.email, form.password);
        toast.success("Login successful");
        const role = data.user?.role;
        if (role === "Administrator") navigate("/admin");
        else if (role === "Teacher") navigate("/teacher");
        else navigate("/admin");
      } else {
        if (!studentForm.admission_no.trim() || !studentForm.pin.trim()) {
          setLoading(false);
          return toast.error("Admission number and PIN are required.");
        }
        await loginWithPin(studentForm.admission_no, studentForm.pin);
        toast.success("Login successful");
        navigate("/student");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen flex bg-slate-950">
        {/* Left Panel */}
        <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.18),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,.12),transparent_30%)]" />
          <div className="relative z-10 flex flex-col justify-center px-16 text-white">
            <div className="flex items-center gap-3 mb-8">
              <GraduationCap size={52} />
              <h1 className="text-5xl font-bold">SRAMS</h1>
            </div>
            <h2 className="text-3xl font-semibold mb-4">
              Student Records & Academic Management System
            </h2>
            <p className="text-blue-100 leading-8">
              Manage students, attendance, assessments, reports and academics from
              one modern platform.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-100 to-slate-200">
          <div className="w-full max-w-md rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-4">
                <GraduationCap size={32} />
              </div>
              <h2 className="text-3xl font-bold text-slate-800">Welcome Back</h2>
              <p className="text-slate-500 mt-2">Sign in to continue</p>
            </div>

            {/* Portal Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => setPortal("staff")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                  portal === "staff"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <User size={16} />
                Admin / Teacher
              </button>
              <button
                type="button"
                onClick={() => setPortal("student")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                  portal === "student"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <GraduationCap size={16} />
                Student
              </button>
            </div>

            <form onSubmit={submit} className="space-y-5">
              {portal === "staff" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <div className="flex items-center border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                      <Mail className="text-slate-400" size={20} />
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={onChange}
                        placeholder="you@example.com"
                        className="ml-3 w-full bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <div className="flex items-center border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                      <Lock className="text-slate-400" size={20} />
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={onChange}
                        placeholder="••••••••"
                        className="ml-3 w-full bg-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Admission Number
                    </label>
                    <div className="flex items-center border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                      <Hash className="text-slate-400" size={20} />
                      <input
                        name="admission_no"
                        type="text"
                        value={studentForm.admission_no}
                        onChange={onStudentChange}
                        placeholder="ADM-2026-0001"
                        className="ml-3 w-full bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">PIN</label>
                    <div className="flex items-center border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                      <Lock className="text-slate-400" size={20} />
                      <input
                        name="pin"
                        type={showPin ? "text" : "password"}
                        value={studentForm.pin}
                        onChange={onStudentChange}
                        placeholder="••••"
                        maxLength={6}
                        className="ml-3 w-full bg-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                disabled={loading}
                className="w-full flex items-center gap-2 bg-blue-600 justify-center hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl py-3 font-semibold transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" /> Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {portal === "staff" && (
              <p className="mt-8 text-center text-slate-600">
                Don't have an account?
                <button
                  onClick={() => navigate("/register")}
                  className="ml-2 text-blue-600 font-semibold hover:underline"
                >
                  Register
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
