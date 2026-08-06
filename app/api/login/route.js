// app/api/login/route.js — ตรรกะเดียวกับ ppc-hos-10667 ทุกประการ
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import md5 from "md5";
import { db2 } from "@/lib/db";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

const MINUTE = 60_000;

export async function POST(req) {
  const ip = getClientIp(req);

  // ── ชั้นที่ 1: จำกัดตาม IP — 10 ครั้ง / 5 นาที ──
  const ipLimit = rateLimit(`login:ip:${ip}`, 10, 5 * MINUTE);
  if (!ipLimit.ok) {
    return tooManyRequests(ipLimit, "พยายาม login บ่อยเกินไป กรุณารอสักครู่");
  }

  const body = await req.json();
  const username = body.username?.trim();
  const password = body.password?.trim();

  if (!username || !password) {
    return NextResponse.json({ message: "Invalid" }, { status: 400 });
  }

  // ── ชั้นที่ 2: จำกัดตาม username — 5 ครั้ง / 15 นาที ──
  const userLimit = rateLimit(`login:user:${username.toLowerCase()}`, 5, 15 * MINUTE);
  if (!userLimit.ok) {
    return tooManyRequests(
      userLimit,
      "บัญชีนี้ถูกพยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่",
    );
  }

  const [rows] = await db2.query(
    "SELECT `user`, passweb, role FROM ppchos.users WHERE `user` = ? LIMIT 1",
    [username],
  );

  const user = rows[0];
  if (!user) {
    return NextResponse.json({ message: "Invalid" }, { status: 401 });
  }

  let isValid = false;

  if (user.passweb.startsWith("$2b$") || user.passweb.startsWith("$2a$")) {
    isValid = await bcrypt.compare(password, user.passweb);
  } else {
    // รหัสเก่าเก็บเป็น md5 → ตรวจผ่านแล้วอัปเกรดเป็น bcrypt ทันที
    isValid = md5(password).toLowerCase() === user.passweb.toLowerCase();
    if (isValid) {
      const newHash = await bcrypt.hash(password, 12);
      await db2.query("UPDATE ppchos.users SET passweb = ? WHERE `user` = ?", [
        newHash,
        username,
      ]);
    }
  }

  if (!isValid) {
    return NextResponse.json({ message: "Invalid" }, { status: 401 });
  }

  // คนที่ยังไม่ได้ตั้ง role → ถือเป็น "USER" ธรรมดา (ต้อง fallback เสมอ)
  const role = (user.role ?? "USER").toUpperCase();

  const token = jwt.sign({ username: user.user, role }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });

  const secureCookie = process.env.COOKIE_SECURE === "true";

  const res = NextResponse.json({ message: "Login success", role });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
