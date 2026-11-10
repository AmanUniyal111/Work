import { useState } from "react";
import { api } from "../services/api";

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify(form)
        });
      }

      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container narrow login-shell">
      <h2>{isRegister ? "Register" : "Login"} to CampusSync</h2>
      <p className="login-subtitle">One workspace for campus Q&A, squads, events, and alerts.</p>
      <form className="card" onSubmit={handleSubmit}>
        {isRegister && (
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        )}
        <input
          placeholder="Institutional email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        {isRegister && <p className="login-subtitle">New accounts are created with the student role by default.</p>}
        {error && <p className="error">{error}</p>}
        <button type="submit">{isRegister ? "Create account" : "Login"}</button>
      </form>
      <button className="text-link" onClick={() => setIsRegister((prev) => !prev)}>
        {isRegister ? "Already have an account? Login" : "New user? Register"}
      </button>
    </div>
  );
}
