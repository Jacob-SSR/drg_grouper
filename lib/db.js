// lib/db.js — ยกแบบจาก lib/db.ts ของ ppc-hos-10667
import mysql from "mysql2/promise";

const requiredEnv = [
  "DB_HOST", // ฐาน HOSxP (ข้อมูลผู้ป่วย)
  "DB_HOST2", // ฐานที่มี ppchos.users (บัญชีผู้ใช้)
  "DB_PORT",
  "DB_USER",
  "DB_PASS",
  "DB_NAME",
  "JWT_SECRET",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

// ── config ร่วมของทั้งสอง pool (db / db2) ──────────────────────────────────────
// แยกเฉพาะ host ออกไป ที่เหลือใช้ชุดเดียวกัน กัน config เพี้ยนระหว่าง pool
const sharedConfig = {
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  charset: "tis620", // HOSxP ใช้ tis620 — อย่าเปลี่ยน

  // ⚠️ ความปลอดภัย: ห้ามตั้งเป็น true เด็ดขาด
  //    multipleStatements: true เปิดทาง stacked-query SQL injection
  multipleStatements: false,
};

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  ...sharedConfig,
});

export const db2 = mysql.createPool({
  host: process.env.DB_HOST2,
  ...sharedConfig,
});
