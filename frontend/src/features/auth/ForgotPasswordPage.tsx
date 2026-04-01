import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset link");
      setMessage("If this email exists, a reset link will be sent.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-6">Forgot Password</h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {message && <div className="mb-4 text-green-600">{message}</div>}
        <input name="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="mb-6 w-full px-4 py-3 border rounded" />
        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded font-medium">Send Reset Link</button>
      </form>
    </div>
  );
}
