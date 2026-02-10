import { useState,useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
          const res = await fetch(
            "https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      login(data.token);
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">
          Login to continue managing your finances
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <button type="submit">Login</button>
        </form>

        <div style={{ marginTop: 12 }}>
          <button
              onClick={() => (window.location.href = "https://fj-be-r2-harshil-aggarwal-iit-kharagpur.onrender.com/api/auth/google")}
            style={{ marginTop: 8, padding: '10px 14px', width: '100%', background: '#4285F4', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Sign in with Google
          </button>
        </div>

        <p className="auth-footer">
          Don’t have an account?
          <Link to="/register"> Create Account</Link>
        </p>
      </div>
    </div>
  );
}
