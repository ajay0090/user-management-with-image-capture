import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import { User } from "../types";

interface LoginPageProps {
  onLogin: (token: string, user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);

      onLogin(data.token, data.user);

      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to login. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

        *{
          box-sizing:border-box;
          margin:0;
          padding:0;
        }

        body{
          font-family:'DM Sans',sans-serif;
        }

        .login-page{
          min-height:100vh;
          display:flex;
          background:#f8fafc;
        }

        .left-panel{
          flex:1;
          background:#111827;
          color:white;
          padding:60px;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
        }

        .brand{
          display:flex;
          align-items:center;
          gap:12px;
        }

        .logo{
          width:48px;
          height:48px;
          border-radius:12px;
          background:rgba(255,255,255,0.12);
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:700;
        }

        .brand-title{
          font-size:20px;
          font-weight:600;
        }

        .hero{
          max-width:500px;
        }

        .hero h1{
          font-size:58px;
          line-height:1.1;
          margin-bottom:20px;
        }

        .hero p{
          color:#d1d5db;
          line-height:1.8;
          font-size:16px;
        }

        .stats{
          display:flex;
          gap:40px;
          flex-wrap:wrap;
        }

        .stat h3{
          font-size:28px;
        }

        .stat p{
          color:#9ca3af;
          margin-top:4px;
        }

        .right-panel{
          flex:1;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:40px;
        }

        .card{
          width:100%;
          max-width:450px;
          background:white;
          padding:40px;
          border-radius:20px;
          box-shadow:0 10px 30px rgba(0,0,0,0.08);
        }

        .card h2{
          font-size:32px;
          margin-bottom:8px;
          color:#111827;
        }

        .card-subtitle{
          color:#6b7280;
          margin-bottom:30px;
        }

        .error{
          background:#fef2f2;
          color:#dc2626;
          border:1px solid #fecaca;
          padding:12px;
          border-radius:10px;
          margin-bottom:20px;
          font-size:14px;
        }

        .field{
          margin-bottom:20px;
        }

        .field label{
          display:block;
          margin-bottom:8px;
          font-size:14px;
          font-weight:600;
          color:#374151;
        }

        .field input{
          width:100%;
          height:48px;
          padding:0 14px;
          border:1px solid #d1d5db;
          border-radius:10px;
          font-size:15px;
          transition:all .2s;
        }

        .field input:focus{
          outline:none;
          border-color:#111827;
          box-shadow:0 0 0 3px rgba(17,24,39,.08);
        }

        .login-btn{
          width:100%;
          height:50px;
          border:none;
          border-radius:10px;
          background:#111827;
          color:white;
          font-size:15px;
          font-weight:600;
          cursor:pointer;
          transition:.2s;
        }

        .login-btn:hover{
          opacity:.92;
        }

        .login-btn:disabled{
          opacity:.7;
          cursor:not-allowed;
        }

        .footer-text{
          text-align:center;
          margin-top:20px;
          color:#6b7280;
          font-size:14px;
        }

        /* Tablet */
        @media(max-width:1024px){
          .hero h1{
            font-size:44px;
          }

          .left-panel{
            padding:40px;
          }
        }

        /* Mobile */
        @media(max-width:768px){
          .login-page{
            flex-direction:column;
          }

          .left-panel{
            min-height:auto;
            padding:30px 20px;
          }

          .hero{
            margin-top:30px;
          }

          .hero h1{
            font-size:34px;
          }

          .stats{
            margin-top:30px;
            gap:20px;
          }

          .right-panel{
            padding:20px;
          }

          .card{
            padding:25px;
          }
        }

        /* Small Mobile */
        @media(max-width:480px){
          .hero h1{
            font-size:28px;
          }

          .card{
            padding:20px;
          }

          .card h2{
            font-size:26px;
          }
        }
      `}</style>

      <div className="login-page">
        <div className="left-panel">
          <div className="brand">
            <div className="logo">RS</div>
            <span className="brand-title">Robro System</span>
          </div>

          <div className="hero">
            <h1>
              Intelligent
              <br />
              Workforce
              <br />
              Management
            </h1>

            <p>
              Manage users, assign roles, capture images and monitor
              activities securely through a modern management platform.
            </p>
          </div>

          <div className="stats">
            <div className="stat">
              <h3>3</h3>
              <p>Role Levels</p>
            </div>

            <div className="stat">
              <h3>99%</h3>
              <p>Availability</p>
            </div>

            <div className="stat">
              <h3>Secure</h3>
              <p>Authentication</p>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="card">
            <h2>Welcome Back</h2>

            <p className="card-subtitle">
              Login to continue to your dashboard
            </p>

            {error && <div className="error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Email Address</label>

                <input
                  type="email"
                  value={email}
                  required
                  placeholder="john@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Password</label>

                <input
                  type="password"
                  value={password}
                  required
                  placeholder="********"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-btn"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="footer-text">
              Need access? Contact your administrator.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
