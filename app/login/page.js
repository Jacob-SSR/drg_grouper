"use client";

import { useState } from "react";

const mint = {
  bg: "linear-gradient(160deg,#f0fdfa 0%,#ecfdf5 45%,#f0f9ff 100%)",
  ink: "#134e4a",
  soft: "#5eead4",
  teal: "#0d9488",
  tealDark: "#0f766e",
  sub: "#428f87",
};

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: mint.bg,
    fontFamily: "'Prompt', sans-serif",
    padding: 16,
  },
  card: {
    background: "rgba(255,255,255,.9)",
    borderRadius: 22,
    border: "1.5px solid #ccfbf1",
    boxShadow: "0 12px 40px rgba(13,148,136,.14)",
    padding: "38px 34px",
    width: "100%",
    maxWidth: 400,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1.5px solid #99f6e4",
    borderRadius: 12,
    fontSize: 15,
    outline: "none",
    marginBottom: 16,
    fontFamily: "inherit",
    background: "#fdfefe",
    color: mint.ink,
  },
  btn: {
    width: "100%",
    padding: 13,
    border: "none",
    borderRadius: 12,
    background: mint.teal,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: mint.tealDark,
    marginBottom: 6,
  },
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        location.href = "/";
        return;
      }
      setError(
        r.status === 429
          ? data.error || "ลองบ่อยไปนิดนึง พักสักครู่แล้วลองใหม่นะ"
          : "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง ลองอีกครั้งนะ",
      );
    } catch {
      setError("ต่อเซิร์ฟเวอร์ไม่ติด ลองใหม่อีกครั้งนะ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <form style={styles.card} onSubmit={submit}>
        <div style={{ textAlign: "center", fontSize: 46, marginBottom: 6 }}>🌿</div>
        <h1
          style={{
            textAlign: "center",
            fontSize: 21,
            color: mint.ink,
            margin: "0 0 4px",
            fontWeight: 600,
          }}
        >
          ยินดีต้อนรับกลับมา 👋
        </h1>
        <div style={{ textAlign: "center", fontSize: 13.5, color: mint.sub, marginBottom: 26 }}>
          เข้าสู่ระบบก่อน แล้วไปเช็ก DRG กับ Deny Code กันเลย
        </div>
        {error && (
          <div
            style={{
              background: "#fff1f2",
              color: "#be123c",
              border: "1px solid #fecdd3",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}
        <label style={styles.label} htmlFor="username">ชื่อผู้ใช้</label>
        <input
          id="username"
          style={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          autoFocus
        />
        <label style={styles.label} htmlFor="password">รหัสผ่าน</label>
        <input
          id="password"
          type="password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button style={{ ...styles.btn, opacity: busy ? 0.6 : 1 }} disabled={busy} type="submit">
          {busy ? "แป๊บนึงนะ กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
        </button>
        <div style={{ textAlign: "center", fontSize: 12.5, color: "#7fb5ae", marginTop: 18 }}>
          ใช้บัญชีเดียวกับระบบรายงานของโรงพยาบาลได้เลย ไม่ต้องสมัครใหม่
        </div>
      </form>
    </div>
  );
}
