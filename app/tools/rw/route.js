// เสิร์ฟหน้า ประเมิน RW โหมดแพทย์ (vanilla HTML+JS ตัวเต็ม) จาก assets/
// ผ่าน route handler เพื่อให้ proxy.js ล็อกด้วย auth ได้
// ทาธีม "อ่านง่าย" (คอนทราสต์สูง) ทับตอนเสิร์ฟ — ดู lib/readable-theme.js
import { serveReadableTool } from "@/lib/readable-theme";

export const dynamic = "force-dynamic";

export async function GET() {
  return serveReadableTool("doctor_rw_estimator.html");
}
