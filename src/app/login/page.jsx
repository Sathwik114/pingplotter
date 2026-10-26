"use client";

import { useState } from "react";

/* Network symbols placed around the page.
   sm: true  -> also shown on small screens */
const SYMBOLS = [
  { id: "wifi", style: { top: "7%", left: "7%", width: 110, height: 110 }, sm: true },
  { id: "cloud", style: { top: "3%", left: "40%", width: 100, height: 100 } },
  { id: "server", style: { top: "9%", right: "8%", width: 90, height: 90 }, sm: true },
  { id: "globe", style: { top: "43%", left: "3%", width: 92, height: 92 } },
  { id: "shield", style: { top: "41%", right: "3%", width: 92, height: 92 } },
  { id: "laptop", style: { bottom: "8%", left: "7%", width: 110, height: 110 }, sm: true },
  { id: "router", style: { bottom: "7%", right: "7%", width: 120, height: 120 }, sm: true },
  { id: "database", style: { bottom: "3%", left: "41%", width: 84, height: 84 } },
  { id: "antenna", style: { top: "24%", left: "19%", width: 82, height: 82 } },
  { id: "switch", style: { bottom: "25%", right: "18%", width: 96, height: 96 } },
  { id: "phone", style: { top: "25%", right: "19%", width: 70, height: 70 } },
  { id: "bars", style: { bottom: "27%", left: "18%", width: 70, height: 70 } },
];

function WifiLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter username and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Username or password is incorrect.");
        setLoading(false);
        return;
      }

      const from = new URLSearchParams(window.location.search).get("from");
      const destination =
        from && from.startsWith("/") && from !== "/login" ? from : "/";
      window.location.href = destination;
    } catch {
      setError("Can't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <main className="page">
      {/* Symbol library (drawn once, reused below) */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <symbol id="s-wifi" viewBox="0 0 100 100">
            <path d="M12 38a54 54 0 0 1 76 0" />
            <path d="M24 52a37 37 0 0 1 52 0" />
            <path d="M36 66a20 20 0 0 1 28 0" />
            <circle cx="50" cy="80" r="5" fill="currentColor" stroke="none" />
          </symbol>

          <symbol id="s-cloud" viewBox="0 0 100 100">
            <path d="M28 72h46a16 16 0 0 0 2-31.8A24 24 0 0 0 30 42a15 15 0 0 0-2 30z" />
          </symbol>

          <symbol id="s-server" viewBox="0 0 100 100">
            <rect x="14" y="10" width="72" height="24" rx="5" />
            <rect x="14" y="38" width="72" height="24" rx="5" />
            <rect x="14" y="66" width="72" height="24" rx="5" />
            <circle cx="28" cy="22" r="2.5" fill="currentColor" stroke="none" />
            <circle cx="28" cy="50" r="2.5" fill="currentColor" stroke="none" />
            <circle cx="28" cy="78" r="2.5" fill="currentColor" stroke="none" />
            <path d="M44 22h28M44 50h28M44 78h28" />
          </symbol>

          <symbol id="s-globe" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="36" />
            <ellipse cx="50" cy="50" rx="15" ry="36" />
            <path d="M14 50h72M21 30h58M21 70h58" />
          </symbol>

          <symbol id="s-shield" viewBox="0 0 100 100">
            <path d="M50 10l30 11v25c0 21-13 35-30 43C33 81 20 67 20 46V21z" />
            <path d="M36 50l10 10 18-21" />
          </symbol>

          <symbol id="s-laptop" viewBox="0 0 100 100">
            <rect x="18" y="20" width="64" height="44" rx="4" />
            <path d="M8 76h84l-6 9H14z" />
          </symbol>

          <symbol id="s-router" viewBox="0 0 100 100">
            <rect x="8" y="52" width="84" height="30" rx="6" />
            <path d="M26 52V22M74 52V22" />
            <circle cx="26" cy="18" r="3.5" fill="currentColor" />
            <circle cx="74" cy="18" r="3.5" fill="currentColor" />
            <circle cx="24" cy="67" r="3" fill="currentColor" stroke="none" />
            <circle cx="38" cy="67" r="3" fill="currentColor" stroke="none" />
            <circle cx="52" cy="67" r="3" fill="currentColor" stroke="none" />
            <path d="M66 67h18" />
          </symbol>

          <symbol id="s-database" viewBox="0 0 100 100">
            <ellipse cx="50" cy="22" rx="30" ry="10" />
            <path d="M20 22v56c0 6 13.5 10 30 10s30-4 30-10V22" />
            <path d="M20 50c0 6 13.5 10 30 10s30-4 30-10" />
          </symbol>

          <symbol id="s-antenna" viewBox="0 0 100 100">
            <circle cx="50" cy="34" r="5" fill="currentColor" />
            <path d="M50 40v50M34 90l16-50 16 50M39 70h22" />
            <path d="M36 22a20 20 0 0 0 0 24M64 22a20 20 0 0 1 0 24" />
            <path d="M26 14a32 32 0 0 0 0 40M74 14a32 32 0 0 1 0 40" />
          </symbol>

          <symbol id="s-switch" viewBox="0 0 100 100">
            <rect x="6" y="34" width="88" height="32" rx="5" />
            <rect x="16" y="46" width="9" height="9" rx="1.5" />
            <rect x="31" y="46" width="9" height="9" rx="1.5" />
            <rect x="46" y="46" width="9" height="9" rx="1.5" />
            <rect x="61" y="46" width="9" height="9" rx="1.5" />
            <circle cx="82" cy="50" r="3" fill="currentColor" stroke="none" />
          </symbol>

          <symbol id="s-phone" viewBox="0 0 100 100">
            <rect x="30" y="8" width="40" height="84" rx="8" />
            <path d="M43 80h14" />
          </symbol>

          <symbol id="s-bars" viewBox="0 0 100 100">
            <rect x="10" y="62" width="14" height="26" rx="2" fill="currentColor" stroke="none" />
            <rect x="30" y="44" width="14" height="44" rx="2" fill="currentColor" stroke="none" />
            <rect x="50" y="26" width="14" height="62" rx="2" fill="currentColor" stroke="none" />
            <rect x="70" y="8" width="14" height="80" rx="2" fill="currentColor" stroke="none" />
          </symbol>
        </defs>
      </svg>

      {/* Static network map */}
      <svg className="net" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g stroke="rgba(120,190,255,0.22)" strokeWidth="1.3" fill="none">
          <path d="M80 90L220 40M80 90L150 230M220 40L330 150M220 40L400 60M330 150L150 230M330 150L250 330M330 150L520 200M150 230L60 380M150 230L250 330M60 380L250 330M60 380L200 520M250 330L380 440M400 60L520 200M400 60L650 90M520 200L650 90M520 200L680 300M520 200L540 400M650 90L780 170M780 170L900 60M780 170L940 260M780 170L680 300M900 60L940 260M940 260L820 360M820 360L680 300M820 360L940 480M680 300L540 400M540 400L380 440M540 400L500 580M380 440L200 520M380 440L320 630M200 520L90 620M200 520L320 630M320 630L500 580M500 580L680 520M500 580L590 660M680 520L830 600M680 520L820 360M680 520L540 400M830 600L940 480M830 600L590 660M90 620L320 630" />
        </g>
        <g fill="rgba(110,200,255,0.85)">
          <circle cx="80" cy="90" r="3.5" /><circle cx="220" cy="40" r="3" /><circle cx="330" cy="150" r="3.5" />
          <circle cx="150" cy="230" r="3" /><circle cx="60" cy="380" r="3.5" /><circle cx="250" cy="330" r="3" />
          <circle cx="400" cy="60" r="3" /><circle cx="650" cy="90" r="3.5" /><circle cx="780" cy="170" r="3" />
          <circle cx="900" cy="60" r="3" /><circle cx="940" cy="260" r="3.5" /><circle cx="820" cy="360" r="3" />
          <circle cx="540" cy="400" r="3" /><circle cx="200" cy="520" r="3.5" /><circle cx="90" cy="620" r="3" />
          <circle cx="320" cy="630" r="3" /><circle cx="500" cy="580" r="3.5" /><circle cx="830" cy="600" r="3" />
          <circle cx="940" cy="480" r="3" /><circle cx="590" cy="660" r="3" />
        </g>
        <g fill="rgba(80,160,255,0.28)">
          <circle cx="520" cy="200" r="18" /><circle cx="680" cy="300" r="18" />
          <circle cx="380" cy="440" r="18" /><circle cx="680" cy="520" r="18" />
        </g>
        <g fill="#e6f4ff">
          <circle cx="520" cy="200" r="6" /><circle cx="680" cy="300" r="6" />
          <circle cx="380" cy="440" r="6" /><circle cx="680" cy="520" r="6" />
        </g>
      </svg>

      {/* Network symbols */}
      {SYMBOLS.map((s) => (
        <div
          key={s.id}
          className={"sym" + (s.sm ? "" : " hide-sm")}
          style={s.style}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <use href={"#s-" + s.id} xlinkHref={"#s-" + s.id} />
          </svg>
        </div>
      ))}

      <div className="card">
        <div className="avatar-wrap" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8.5" r="3.7" />
            <path d="M5 19c1.3-3.2 4-4.9 7-4.9s5.7 1.7 7 4.9" />
          </svg>
        </div>

        <form className="form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}

          <div className="field">
            <label htmlFor="username" className="sr-only">Username</label>
            <span className="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
                <path d="m5 7 7 5 7-5" />
              </svg>
            </span>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="password" className="sr-only">Password</label>
            <span className="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V8a4 4 0 1 1 8 0v2" />
              </svg>
            </span>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="meta-row">IT PING PLOTTER</div>

          <button type="submit" className="submit" disabled={loading}>
            {loading ? "Logging in..." : "LOGIN"}
          </button>
        </form>
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          height: 100%;
          font-family: Arial, Helvetica, sans-serif;
          background: #060d1f;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* Dark navy page with a blue and cyan glow */
        .page {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background-color: #060d1f;
          background:
            radial-gradient(ellipse at 12% 10%, rgba(37, 99, 235, 0.45), transparent 48%),
            radial-gradient(ellipse at 90% 92%, rgba(34, 211, 238, 0.24), transparent 46%),
            linear-gradient(135deg, #060d1f 0%, #0b1a3a 50%, #060d1f 100%);
        }

        .net {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .sym {
          position: absolute;
          color: rgba(110, 200, 255, 0.55);
          pointer-events: none;
        }

        .sym svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        /* Blur is progressive enhancement; the translucent color remains readable without it. */
        .card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 430px;
          padding: 32px 24px 24px;
          border-radius: 18px;
          background: #f3dce5;
          background: rgba(243, 220, 229, 0.94);
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.38),
            0 0 0 1px rgba(255, 255, 255, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.75);
          color: #382731;
        }

        @supports (backdrop-filter: blur(1px)) {
          .card {
            background: rgba(243, 220, 229, 0.72);
            backdrop-filter: blur(12px);
          }
        }

        @supports (-webkit-backdrop-filter: blur(1px)) {
          .card {
            background: rgba(243, 220, 229, 0.72);
            -webkit-backdrop-filter: blur(12px);
          }
        }

        /* Dark avatar with light-blue icon */
        .avatar-wrap {
          position: absolute;
          left: 50%;
          top: -42px;
          transform: translateX(-50%);
          width: 90px;
          height: 90px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a1633, #14306a);
          border: 3px solid #e9b8ca;
          box-shadow: 0 0 0 4px #f3dce5, 0 10px 24px rgba(0, 0, 0, 0.35);
          color: #e9b8ca;
          z-index: 1;
        }

        .avatar-wrap svg {
          width: 44px;
          height: 44px;
        }

        .form {
          position: relative;
          margin-top: 44px;
        }

        .alert {
          margin-bottom: 14px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #fff0f3;
          border: 1px solid #f5a3b5;
          color: #9b1c3c;
          font-size: 14px;
        }

        .field {
          position: relative;
          margin-bottom: 14px;
        }

        .field-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #9b6079;
          pointer-events: none;
        }

        .field-icon svg {
          width: 20px;
          height: 20px;
          display: block;
        }

        .field input {
          width: 100%;
          height: 48px;
          padding: 0 14px 0 46px;
          border-radius: 8px;
          border: 1px solid rgba(143, 83, 109, 0.22);
          background: #fff8fb;
          background: rgba(255, 250, 252, 0.74);
          color: #382731;
          font-size: 17px;
          outline: none;
        }

        .field input::placeholder {
          color: #8a6b78;
          opacity: 1;
        }

        .field input:focus {
          background: rgba(255, 255, 255, 0.94);
          border-color: #c985a1;
          box-shadow: 0 0 0 3px rgba(201, 133, 161, 0.2);
        }

        .field input:disabled {
          opacity: 0.7;
        }

        /* Centered IT PING PLOTTER */
        .meta-row {
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          margin: 6px 0 18px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #49333d;
        }

        .submit {
          width: 100%;
          min-height: 48px;
          border: none;
          border-radius: 8px;
          background: #29212a;
          color: #fff;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(41, 33, 42, 0.28);
        }

        .submit:hover {
          background: #403542;
        }

        .submit:disabled {
          opacity: 0.75;
          cursor: wait;
        }

        @media (max-width: 700px) {
          .hide-sm {
            display: none;
          }

          .sym {
            transform: scale(0.75);
          }
        }

        @media (max-width: 420px) {
          .card {
            padding-left: 20px;
            padding-right: 20px;
          }
        }
      `}</style>
    </main>
  );
}

export default function WifiLoginPage() {
  return <WifiLoginForm />;
}