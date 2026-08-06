// เสิร์ฟหน้า ประเมิน RW โหมดแพทย์ (vanilla HTML+JS ตัวเต็ม) จาก assets/
// ผ่าน route handler เพื่อให้ proxy.js ล็อกด้วย auth ได้
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const html = await readFile(
    path.join(process.cwd(), "assets", "doctor_rw_estimator.html"),
    "utf8",
  );
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
