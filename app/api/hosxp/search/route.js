import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim().replace(/\s+/g, " ");
  const headers = { "Cache-Control": "no-store" };
  if (q.length < 2 || q.length > 100) {
    return NextResponse.json({ error: "กรอก AN หรือชื่อผู้ป่วย 2–100 ตัวอักษร" }, { status: 400, headers });
  }
  // Use literal LIKE matching with a dedicated escape character and bound parameters.
  const literal = q.replace(/[!%_]/g, "!$&");
  const numeric = /^\d+$/.test(q);
  const name = "CONCAT(IFNULL(p.fname,''), ' ', IFNULL(p.lname,''))";
  const where = numeric ? "i.an LIKE ? ESCAPE '!'" : `(${name} LIKE ? ESCAPE '!' OR CONCAT(IFNULL(p.pname,''), ${name}) LIKE ? ESCAPE '!')`;
  const params = numeric ? [literal + "%"] : ["%" + literal + "%", "%" + literal + "%"];
  try {
    const [rows] = await db.query(
      `SELECT i.an, i.hn, CONCAT(IFNULL(p.pname,''), ${name}) AS ptname,
              DATE_FORMAT(i.regdate, '%Y-%m-%d') AS regdate,
              DATE_FORMAT(i.dchdate, '%Y-%m-%d') AS dchdate
       FROM ipt i JOIN patient p ON p.hn = i.hn
       WHERE ${where} ORDER BY i.regdate DESC, i.an DESC LIMIT 21`, params);
    return NextResponse.json({ admissions: rows.slice(0, 20), hasMore: rows.length > 20 }, { headers });
  } catch (err) {
    console.error("HOSxP admission search failed:", err.code);
    return NextResponse.json({ error: "ค้นหาไม่สำเร็จ กรุณาลองอีกครั้ง" }, { status: 500, headers });
  }
}
