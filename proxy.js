// proxy.js — ยกหลักการจาก proxy.ts ของ ppc-hos-10667
// ─────────────────────────────────────────────────────────────────────────────
// หลักการ: DENY BY DEFAULT
// ทุกหน้าและทุก /api/* ต้อง login เสมอ ยกเว้นที่ระบุไว้ข้างล่างนี้เท่านั้น
// → สร้าง route ใหม่ไม่ต้องมาแก้ไฟล์นี้ มันถูกล็อกให้อัตโนมัติ
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// เปิด public จริงๆ (ไม่ต้องมี token เลย)
const PUBLIC_PATHS = ["/api/login", "/api/logout", "/api/me", "/login"];

function matchesAny(pathname, list) {
  return list.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function clearTokenCookie(res) {
  res.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return res;
}

/** ปฏิเสธ: API ตอบ 401 JSON, หน้าเว็บ redirect ไป login */
function deny(request, hadBadToken) {
  const { pathname } = request.nextUrl;
  const res = pathname.startsWith("/api")
    ? NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 })
    : NextResponse.redirect(new URL("/login", request.url));
  return hadBadToken ? clearTokenCookie(res) : res;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // 1) public เสมอ
  if (matchesAny(pathname, PUBLIC_PATHS)) return NextResponse.next();

  const token = request.cookies.get("token")?.value;

  // 2) ไม่มี token → ปฏิเสธ
  if (!token) return deny(request, false);

  // 3) มี token → ตรวจ
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // token เสีย/หมดอายุ: เคลียร์ cookie แล้วส่งไป login
    return deny(request, true);
  }
}

export const config = {
  // ครอบทุก path ยกเว้น asset ภายในของ Next — ข้อยกเว้นจัดการในโค้ดข้างบน
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
