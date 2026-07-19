import { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import useAuthStore from "../../store/authStore";


export default function Signup() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fname: "", lname: "", email: "", password: "", confirmPassword: "" });
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (Object.values(form).some(v => !v.trim())) return toast.error("All fields are required.");
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match.");
    try {
      setLoading(true);
      await register({ fname: form.fname, lname: form.lname, email: form.email, password: form.password });
      toast.success("Account created successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };
  const field = (Icon, name, label, type = "text") => (
    <div><label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex items-center border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
        <Icon className="text-slate-400" size={20} />
        <input className="ml-3 w-full outline-none bg-transparent" name={name} type={type} value={form[name]} onChange={change} />
      </div></div>);
  return <>
    <Toaster position="top-right" />
    <div className="min-h-screen flex bg-slate-100">
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.18),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,.12),transparent_30%)]" />
          <div className="relative z-10 flex flex-col justify-center px-16 text-white">
            <div className="flex items-center gap-3 mb-8" data-aos='fade-down'>
              <GraduationCap size={52}/>
              <h1 className="text-5xl font-bold">SRAMS</h1>
            </div>
            <h2 className="text-3xl font-semibold mb-4" data-aos='fade-left'>Student Records & Academic Management System</h2>
            <p className="text-blue-100 leading-8" data-aos='fade-up'>
             Create your account to manage academic records securely.
            </p>
          </div>
        </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-[450px] max-w-lg bg-white/80 backdrop-blur rounded-3xl shadow-2xl p-8" data-aos='fade-right'>
          <div className="text-center mb-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-4">
                <GraduationCap size={32}/>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Create Account</h2>
            </div>
          <form onSubmit={submit} className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              {field(User, "fname", "First Name")}
              {field(User, "lname", "Last Name")}
            </div>
            {field(Mail, "email", "Email", "email")}
            <div><label className="block text-sm font-medium mb-2">Password</label><div className="flex items-center border rounded-xl px-4 py-3"><Lock size={20} className="text-slate-400" /><input className="ml-3 w-full outline-none" type={show ? "text" : "password"} name="password" value={form.password} onChange={change} /><button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff size={20} /> : <Eye size={20} />}</button></div></div>
            <div><label className="block text-sm font-medium mb-2">Confirm Password</label><div className="flex items-center border rounded-xl px-4 py-3"><Lock size={20} className="text-slate-400" /><input className="ml-3 w-full outline-none" type={show ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={change} /></div></div>
             <button disabled={loading}
                className="w-full flex items-center gap-2 bg-blue-600 justify-center hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl py-3 font-semibold transition">
                {loading ? (<><Loader2 className="size-5 animate-spin" /> Registering..</>) : "Register"}
              </button>
              </form>
          <p className="text-center mt-6">Already have an account? <button onClick={() => navigate("/login")} className="text-blue-600 font-semibold">Sign In</button></p>
        </div></div></div></>;
}