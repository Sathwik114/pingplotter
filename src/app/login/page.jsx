"use client";

import { useState, useRef, useEffect } from "react";

/* Floating 3D network symbols. z = depth (px) used for parallax + translateZ */
const SYMBOLS = [
  { id: "wifi", top: "8%", left: "8%", size: 110, z: 140, sm: true },
  { id: "cloud", top: "4%", left: "42%", size: 96, z: 60 },
  { id: "server", top: "10%", right: "9%", size: 90, z: 170, sm: true },
  { id: "globe", top: "44%", left: "4%", size: 92, z: 90 },
  { id: "shield", top: "42%", right: "4%", size: 92, z: 110 },
  { id: "laptop", bottom: "9%", left: "8%", size: 110, z: 160, sm: true },
  { id: "router", bottom: "8%", right: "8%", size: 120, z: 130, sm: true },
  { id: "database", bottom: "3%", left: "42%", size: 80, z: 70 },
];

const PATHS = {
  wifi: (
    <>
      <path d="M12 38a54 54 0 0 1 76 0" />
      <path d="M24 52a37 37 0 0 1 52 0" />
      <path d="M36 66a20 20 0 0 1 28 0" />
      <circle cx="50" cy="80" r="5" fill="currentColor" stroke="none" />
    </>
  ),
  cloud: <path d="M28 72h46a16 16 0 0 0 2-31.8A24 24 0 0 0 30 42a15 15 0 0 0-2 30z" />,
  server: (
    <>
      <rect x="14" y="10" width="72" height="24" rx="5" />
      <rect x="14" y="38" width="72" height="24" rx="5" />
      <rect x="14" y="66" width="72" height="24" rx="5" />
      <path d="M44 22h28M44 50h28M44 78h28" />
    </>
  ),
  globe: (
    <>
      <circle cx="50" cy="50" r="36" />
      <ellipse cx="50" cy="50" rx="15" ry="36" />
      <path d="M14 50h72M21 30h58M21 70h58" />
    </>
  ),
  shield: (
    <>
      <path d="M50 10l30 11v25c0 21-13 35-30 43C33 81 20 67 20 46V21z" />
      <path d="M36 50l10 10 18-21" />
    </>
  ),
  laptop: (
    <>
      <rect x="18" y="20" width="64" height="44" rx="4" />
      <path d="M8 76h84l-6 9H14z" />
    </>
  ),
  router: (
    <>
      <rect x="8" y="52" width="84" height="30" rx="6" />
      <path d="M26 52V22M74 52V22" />
      <circle cx="26" cy="18" r="3.5" fill="currentColor" />
      <circle cx="74" cy="18" r="3.5" fill="currentColor" />
      <path d="M66 67h18" />
    </>
  ),
  database: (
    <>
      <ellipse cx="50" cy="22" rx="30" ry="10" />
      <path d="M20 22v56c0 6 13.5 10 30 10s30-4 30-10V22" />
      <path d="M20 50c0 6 13.5 10 30 10s30-4 30-10" />
    </>
  ),
};

/* Popup content for each result */
const POPUPS = {
  success: {
    tone: "ok",
    title: "Logged in successfully",
    text: "Welcome back. Taking you to the dashboard…",
    icon: <path d="M5 13l4 4L19 7" />,
  },
  wrong: {
    tone: "bad",
    title: "Wrong password",
    text: "The password doesn't match this username. Check it and try again.",
    icon: <path d="M6 6l12 12M18 6L6 18" />,
  },
  noid: {
    tone: "warn",
    title: "Username not found",
    text: "This ID isn't registered. Please contact IT support to get access.",
    icon: (
      <>
        <path d="M12 8v5" />
        <circle cx="12" cy="17" r="0.6" fill="currentColor" />
      </>
    ),
  },
  network: {
    tone: "warn",
    title: "Can't reach the server",
    text: "Check your connection and try again.",
    icon: (
      <>
        <path d="M12 8v5" />
        <circle cx="12" cy="17" r="0.6" fill="currentColor" />
      </>
    ),
  },
};

function WifiLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null); // key of POPUPS or null
  const [shake, setShake] = useState(false);
  const pageRef = useRef(null);
  const timer = useRef(null);

  /* Mouse / touch parallax: writes CSS vars, no re-render */
  const onMove = (e) => {
    const el = pageRef.current;
    if (!el) return;
    const p = e.touches ? e.touches[0] : e;
    const x = p.clientX / window.innerWidth - 0.5;
    const y = p.clientY / window.innerHeight - 0.5;
    el.style.setProperty("--rx", `${(-y * 14).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 18).toFixed(2)}deg`);
    el.style.setProperty("--px", x.toFixed(3));
    el.style.setProperty("--py", y.toFixed(3));
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = (key, autoCloseMs) => {
    setPopup(key);
    clearTimeout(timer.current);
    if (autoCloseMs) timer.current = setTimeout(() => setPopup(null), autoCloseMs);
    if (key === "wrong" || key === "noid") {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        show("success");
        const from = new URLSearchParams(window.location.search).get("from");
        const dest = from && from.startsWith("/") && from !== "/login" ? from : "/";
        setTimeout(() => (window.location.href = dest), 1600);
        return;
      }

      /* Backend contract: 404 (or code USER_NOT_FOUND) = no such ID,
         401 (or anything else) = wrong password */
      if (res.status === 404 || data.code === "USER_NOT_FOUND") show("noid");
      else show("wrong");
    } catch {
      show("network");
    }
    setLoading(false);
  };

  const pop = popup ? POPUPS[popup] : null;

  return (
    <main
      className="page"
      ref={pageRef}
      onMouseMove={onMove}
      onTouchMove={onMove}
    >
      {/* 3D perspective grid floor */}
      <div className="floor" aria-hidden="true" />

      {/* Rotating network rings behind the card */}
      <div className="orbit" aria-hidden="true">
        <i /><i /><i />
      </div>

      {/* Floating symbols with depth parallax */}
      {SYMBOLS.map((s, i) => (
        <div
          key={s.id}
          className={"sym" + (s.sm ? "" : " hide-sm")}
          style={{
            top: s.top, bottom: s.bottom, left: s.left, right: s.right,
            width: s.size, height: s.size, "--z": s.z, "--d": `${i * 0.7}s`,
          }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor"
            strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            {PATHS[s.id]}
          </svg>
        </div>
      ))}

      {/* 3D tilting card */}
      <div className="stage">
        <div className={"card" + (shake ? " shake" : "")}>
          <div className="avatar-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8.5" r="3.7" />
              <path d="M5 19c1.3-3.2 4-4.9 7-4.9s5.7 1.7 7 4.9" />
            </svg>
          </div>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="username" className="sr-only">Username</label>
              <span className="field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c1-4 4-6 7-6s6 2 7 6" />
                </svg>
              </span>
              <input id="username" type="text" autoComplete="username"
                autoCapitalize="none" autoCorrect="off" placeholder="Username"
                value={username} onChange={(e) => setUsername(e.target.value)}
                disabled={loading} autoFocus />
            </div>

            <div className="field">
              <label htmlFor="password" className="sr-only">Password</label>
              <span className="field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V8a4 4 0 1 1 8 0v2" />
                </svg>
              </span>
              <input id="password" type="password" autoComplete="current-password"
                placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)} disabled={loading} />
            </div>

            <div className="meta-row">IT PING PLOTTER</div>

            <button type="submit" className="submit" disabled={loading}>
              <span>{loading ? "Logging in..." : "LOGIN"}</span>
            </button>

            <p className="help">
              No ID? Contact IT support to get access.
            </p>
          </form>
        </div>
      </div>

      {/* Popup modal */}
      {pop && (
        <div className="overlay" onClick={() => popup !== "success" && setPopup(null)}>
          <div
            className={"popup " + pop.tone}
            role={pop.tone === "ok" ? "status" : "alertdialog"}
            aria-live="assertive"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pop-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" className="ring" />
                {pop.icon}
              </svg>
            </div>
            <h2>{pop.title}</h2>
            <p>{pop.text}</p>
            {popup !== "success" && (
              <button className="pop-btn" onClick={() => setPopup(null)} autoFocus>
                {popup === "noid" ? "Okay, I'll contact IT" : "Try again"}
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        * { box-sizing: border-box; }
        html, body {
          margin: 0; height: 100%;
          font-family: Arial, Helvetica, sans-serif;
          background: #060d1f;
        }
        .sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }

        .page {
          --rx: 0deg; --ry: 0deg; --px: 0; --py: 0;
          position: relative; min-height: 100vh; width: 100%; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 24px;
          perspective: 1400px;
          background:
            radial-gradient(ellipse at 12% 10%, rgba(37,99,235,.45), transparent 48%),
            radial-gradient(ellipse at 90% 92%, rgba(34,211,238,.26), transparent 46%),
            linear-gradient(135deg, #060d1f 0%, #0b1a3a 50%, #060d1f 100%);
        }

        /* Moving perspective grid floor */
        .floor {
          position: absolute; left: -50%; right: -50%; bottom: -10%; height: 65%;
          background-image:
            linear-gradient(rgba(110,200,255,.28) 1px, transparent 1px),
            linear-gradient(90deg, rgba(110,200,255,.28) 1px, transparent 1px);
          background-size: 60px 60px;
          transform: rotateX(68deg) translateX(calc(var(--px) * -60px));
          transform-origin: center bottom;
          -webkit-mask-image: linear-gradient(to top, #000 10%, transparent 90%);
          mask-image: linear-gradient(to top, #000 10%, transparent 90%);
          animation: gridMove 4s linear infinite;
          pointer-events: none;
        }
        @keyframes gridMove { to { background-position: 0 60px, 60px 0; } }

        /* Glowing rings spinning in 3D behind the card */
        .orbit {
          position: absolute; top: 50%; left: 50%; width: 620px; height: 620px;
          margin: -310px 0 0 -310px; transform-style: preserve-3d;
          transform: rotateX(calc(var(--rx) * 1.2 + 68deg)) rotateZ(calc(var(--ry) * 2));
          pointer-events: none;
        }
        .orbit i {
          position: absolute; inset: 0; border-radius: 50%;
          border: 1.5px solid rgba(110,200,255,.35);
          box-shadow: 0 0 24px rgba(34,211,238,.25), inset 0 0 24px rgba(34,211,238,.15);
          animation: spin 14s linear infinite;
        }
        .orbit i:nth-child(2) { inset: 70px; animation-duration: 20s; animation-direction: reverse; border-style: dashed; }
        .orbit i:nth-child(3) { inset: 150px; animation-duration: 9s; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .sym {
          position: absolute; pointer-events: none;
          color: rgba(110,200,255,.7);
          filter: drop-shadow(0 0 10px rgba(34,211,238,.55));
          transform:
            translate3d(calc(var(--px) * var(--z) * -0.45px), calc(var(--py) * var(--z) * -0.45px), 0)
            translateZ(calc(var(--z) * 1px));
          animation: bob 5s ease-in-out var(--d) infinite;
        }
        .sym svg { width: 100%; height: 100%; display: block; }
        @keyframes bob {
          50% { margin-top: -14px; }
        }

        /* Card stage */
        .stage {
          position: relative; z-index: 2; width: 100%; max-width: 430px;
          transform-style: preserve-3d;
          transform: rotateX(var(--rx)) rotateY(var(--ry));
          transition: transform .12s ease-out;
        }
        .card {
          position: relative; width: 100%; padding: 32px 24px 24px;
          border-radius: 20px; transform-style: preserve-3d;
          background: rgba(243,220,229,.94);
          color: #382731;
          box-shadow:
            0 40px 80px rgba(0,0,0,.5),
            0 0 60px rgba(34,211,238,.18),
            0 0 0 1px rgba(255,255,255,.7),
            inset 0 1px 0 rgba(255,255,255,.75);
          animation: enter .9s cubic-bezier(.2,.8,.2,1) both;
        }
        @supports (backdrop-filter: blur(1px)) {
          .card { background: rgba(243,220,229,.74); backdrop-filter: blur(14px); }
        }
        @keyframes enter {
          from { opacity: 0; transform: translateZ(-300px) rotateX(25deg); }
          to { opacity: 1; transform: none; }
        }
        .card.shake { animation: shake .55s both; }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-12px) rotateZ(-1deg); }
          40% { transform: translateX(10px) rotateZ(1deg); }
          60% { transform: translateX(-7px); }
          80% { transform: translateX(5px); }
        }

        /* Pieces pop out of the card in 3D */
        .avatar-wrap {
          position: absolute; left: 50%; top: -42px;
          width: 90px; height: 90px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #0a1633, #14306a);
          border: 3px solid #e9b8ca; color: #e9b8ca;
          box-shadow: 0 0 0 4px #f3dce5, 0 16px 30px rgba(0,0,0,.45), 0 0 28px rgba(34,211,238,.4);
          transform: translateX(-50%) translateZ(70px);
        }
        .avatar-wrap svg { width: 44px; height: 44px; }

        .form { position: relative; margin-top: 44px; transform-style: preserve-3d; }
        .field { position: relative; margin-bottom: 14px; transform: translateZ(28px); }
        .field-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          width: 20px; height: 20px; color: #9b6079; pointer-events: none;
        }
        .field-icon svg { width: 20px; height: 20px; display: block; }
        .field input {
          width: 100%; height: 48px; padding: 0 14px 0 46px;
          border-radius: 10px; border: 1px solid rgba(143,83,109,.22);
          background: rgba(255,250,252,.8); color: #382731;
          font-size: 17px; outline: none;
          box-shadow: inset 0 2px 5px rgba(80,40,60,.12), 0 6px 14px rgba(80,40,60,.12);
          transition: box-shadow .2s, border-color .2s;
        }
        .field input::placeholder { color: #8a6b78; opacity: 1; }
        .field input:focus {
          background: #fff; border-color: #c985a1;
          box-shadow: 0 0 0 3px rgba(201,133,161,.25), 0 10px 22px rgba(80,40,60,.18);
        }
        .field input:disabled { opacity: .7; }

        .meta-row {
          text-align: center; margin: 6px 0 18px; font-size: 15px;
          font-weight: 700; letter-spacing: .12em; color: #49333d;
          transform: translateZ(18px);
        }

        .submit {
          position: relative; width: 100%; min-height: 50px; border: none;
          border-radius: 10px; background: linear-gradient(180deg, #3a2f3c, #1f1822);
          color: #fff; font-size: 17px; font-weight: 700; letter-spacing: .08em;
          cursor: pointer; transform: translateZ(40px);
          box-shadow: 0 6px 0 #120d14, 0 14px 22px rgba(41,33,42,.4);
          transition: transform .12s, box-shadow .12s;
        }
        .submit:hover { transform: translateZ(48px) translateY(-1px); }
        .submit:active {
          transform: translateZ(40px) translateY(5px);
          box-shadow: 0 1px 0 #120d14, 0 4px 8px rgba(41,33,42,.4);
        }
        .submit:disabled { opacity: .8; cursor: wait; }
        .help {
          margin: 16px 0 0; text-align: center; font-size: 13px; color: #6b5360;
          transform: translateZ(14px);
        }

        /* Popup */
        .overlay {
          position: fixed; inset: 0; z-index: 50; display: flex;
          align-items: center; justify-content: center; padding: 24px;
          background: rgba(3,8,22,.65); backdrop-filter: blur(6px);
          animation: fade .25s both;
        }
        @keyframes fade { from { opacity: 0; } }
        .popup {
          --c: #22c55e;
          width: 100%; max-width: 380px; padding: 32px 26px 26px;
          text-align: center; border-radius: 20px; color: #e8f1ff;
          background: linear-gradient(160deg, #0f1f45, #0a1330);
          border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
          box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 50px color-mix(in srgb, var(--c) 35%, transparent);
          animation: pop .5s cubic-bezier(.2,1.2,.3,1) both;
        }
        .popup.bad { --c: #f43f5e; }
        .popup.warn { --c: #f59e0b; }
        @keyframes pop {
          from { opacity: 0; transform: perspective(700px) rotateX(-35deg) scale(.8) translateY(30px); }
        }
        .pop-icon {
          width: 76px; height: 76px; margin: 0 auto 16px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--c); background: color-mix(in srgb, var(--c) 16%, transparent);
          box-shadow: 0 0 30px color-mix(in srgb, var(--c) 45%, transparent);
        }
        .pop-icon svg { width: 44px; height: 44px; }
        .popup h2 { margin: 0 0 8px; font-size: 22px; }
        .popup p { margin: 0 0 22px; font-size: 15px; line-height: 1.5; color: #a9bcdb; max-width: 40ch; margin-inline: auto; }
        .popup.ok p { margin-bottom: 0; }
        .ring { stroke-dasharray: 63; stroke-dashoffset: 63; animation: draw .6s .1s forwards; }
        .pop-icon path { stroke-dasharray: 30; stroke-dashoffset: 30; animation: draw .45s .5s forwards; }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        .pop-btn {
          width: 100%; min-height: 46px; border: none; border-radius: 10px;
          background: var(--c); color: #07101f; font-size: 16px; font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 700px) {
          .hide-sm { display: none; }
          .sym { transform: scale(.7); }
          .orbit { width: 420px; height: 420px; margin: -210px 0 0 -210px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .floor, .orbit i, .sym, .card { animation: none !important; }
          .stage { transform: none !important; }
        }
      `}</style>
    </main>
  );
}

export default function WifiLoginPage() {
  return <WifiLoginForm />;
}