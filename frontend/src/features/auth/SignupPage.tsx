import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      setSuccess("Account created! Please login.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-6">Sign Up</h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {success && <div className="mb-4 text-green-600">{success}</div>}
        <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className="mb-4 w-full px-4 py-3 border rounded" />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" type="email" className="mb-4 w-full px-4 py-3 border rounded" />
        <input name="password" value={form.password} onChange={handleChange} placeholder="Password" type="password" className="mb-6 w-full px-4 py-3 border rounded" />
        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded font-medium">Sign Up</button>
        <p className="mt-4 text-sm text-gray-500 text-center">Already have an account? <button type="button" className="text-blue-600" onClick={() => navigate("/login")}>Login</button></p>
      </form>
    </div>
  );
}
