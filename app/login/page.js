"use client";

import { useState } from "react";

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg,#0f172a,#1e3a8a 60%,#0f766e)",
    fontFamily: "'Segoe UI', Tahoma, 'TH Sarabun New', sans-serif",
    padding: 16,
  },
  card: {
    background: "#fff",
    borderRadius: 18,
    boxShadow: "0 20px 60px rgba(0,0,0,.35)",
    padding: "38px 34px",
    width: "100%",
    maxWidth: 400,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "2px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 15,
    outline: "none",
    marginBottom: 16,
  },
  btn: {
    width: "100%",
    padding: 13,
    border: "none",
    borderRadius: 10,
    background: "#2563eb",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
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
          ? data.error || "พยายามบ่อยเกินไป กรุณารอสักครู่"
          : "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
      );
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <form style={styles.card} onSubmit={submit}>
        <div style={{ textAlign: "center", fontSize: 44, marginBottom: 8 }}>🏥</div>
        <h1 style={{ textAlign: "center", fontSize: 20, color: "#0f172a", margin: "0 0 4px" }}>
          PPC Coding Tools
        </h1>
        <div style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginBottom: 26 }}>
          DRG Grouper + Deny Code Checker — เข้าสู่ระบบด้วยบัญชีโรงพยาบาล
        </div>
        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              borderRadius: 8,
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
        <button style={styles.btn} disabled={busy} type="submit">
          {busy ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
        </button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 18 }}>
          ใช้บัญชีเดียวกับระบบรายงานของโรงพยาบาล (ppchos)
        </div>
      </form>
    </div>
  );
}
