import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function GoogleOAuthCallback() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    // Expecting backend to redirect to this frontend route with token in query
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      login(token);
      // remove token from URL for cleanliness
      navigate("/dashboard", { replace: true });
      return;
    }

    // If token not present, attempt to read JSON body if backend returned JSON directly.
    // Note: this will only work if backend served JSON at same origin and this route was requested directly.
    (async () => {
      try {
        const res = await fetch(window.location.href, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.token) {
            login(data.token);
            navigate("/dashboard", { replace: true });
            return;
          }
        }
      } catch (e) {
        console.warn('OAuth callback handling failed', e);
      }
      // fallback: go to login
      navigate("/login", { replace: true });
    })();
  }, [login, navigate]);

  return <p style={{ padding: 24 }}>Signing you in…</p>;
}
