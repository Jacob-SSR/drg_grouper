import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db2 } from "@/lib/db";

// role มาตรฐานทั้งระบบใช้ "ตัวพิมพ์ใหญ่" เสมอ (USER, IT, ADMIN, GUEST)
const GUEST = {
  user: { username: "Guest", role: "GUEST", name: "Guest" },
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json(GUEST);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ดึง role และ name จาก DB (เป็นแหล่งความจริง — เผื่อ role เปลี่ยนหลัง login)
    const [rows] = await db2.query(
      "SELECT `user`, name, role FROM ppchos.users WHERE `user` = ? LIMIT 1",
      [decoded.username],
    );

    const user = rows[0];

    return NextResponse.json({
      user: {
        username: decoded.username,
        role: (user?.role ?? "USER").toUpperCase(),
        name: user?.name ?? decoded.username,
      },
    });
  } catch {
    return NextResponse.json(GUEST);
  }
}
