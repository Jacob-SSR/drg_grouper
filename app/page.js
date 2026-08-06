"use client";

import { useEffect, useState } from "react";

const wrap = {
  minHeight: "100vh",
  fontFamily: "'Segoe UI', Tahoma, 'TH Sarabun New', sans-serif",
  background: "linear-gradient(135deg,#0f172a,#1e3a8a 60%,#0f766e)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  color: "#fff",
};

const cardRow = { display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" };

const card = {
  background: "#fff",
  color: "#0f172a",
  borderRadius: 18,
  padding: "30px 28px",
  width: 320,
  textDecoration: "none",
  boxShadow: "0 20px 60px rgba(0,0,0,.35)",
  transition: "transform .15s",
  display: "block",
};

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role === "GUEST") {
          location.href = "/login";
          return;
        }
        setUser(d.user);
      })
      .catch(() => {});
  }, []);

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    location.href = "/login";
  }

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 30, marginBottom: 6 }}>🏥 PPC Coding Tools</h1>
      <p style={{ opacity: 0.85, marginBottom: 8 }}>
        เครื่องมือ Coding / เคลม — ข้อมูลจริงจาก HOSxP
      </p>
      <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 28 }}>
        {user ? `👤 ${user.name} (${user.role})` : "…"}
        {user && (
          <button
            onClick={logout}
            style={{
              marginLeft: 12,
              background: "rgba(255,255,255,.15)",
              border: "1px solid rgba(255,255,255,.4)",
              color: "#fff",
              borderRadius: 8,
              padding: "4px 12px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            ออกจากระบบ
          </button>
        )}
      </p>

      <div style={cardRow}>
        <a href="/tools/drg" style={card}>
          <div style={{ fontSize: 40 }}>🧮</div>
          <h2 style={{ fontSize: 19, margin: "10px 0 6px" }}>DRG Grouper จำลอง</h2>
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
            ประมาณการ MDC · DRG · RW · CC/MCC พร้อมแจ้งเตือน DENY CODE —
            กรอก AN ดึงข้อมูลจริงจาก HOSxP มาเติมฟอร์มอัตโนมัติ
          </p>
        </a>
        <a href="/tools/deny" style={card}>
          <div style={{ fontSize: 40 }}>🔍</div>
          <h2 style={{ fontSize: 19, margin: "10px 0 6px" }}>Deny Code Checker</h2>
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
            ตรวจความเสี่ยง DENY CODE ก่อนส่งเบิก สปสช. —
            ดึงเคสจำหน่ายตามช่วงวันที่จาก HOSxP หรืออัปโหลด Excel
          </p>
        </a>
      </div>

      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 30 }}>
        ⚠️ ค่า RW / ผลตรวจเป็นเครื่องมือช่วยคัดกรองเท่านั้น ไม่ใช่ผลอย่างเป็นทางการ
      </p>
    </div>
  );
}
