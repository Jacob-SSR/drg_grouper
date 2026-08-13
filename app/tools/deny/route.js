// เสิร์ฟหน้า Deny Code Checker (vanilla HTML+JS ตัวเต็ม) จาก assets/
// ผ่าน route handler เพื่อให้ proxy.js ล็อกด้วย auth ได้
// ทาธีม "อ่านง่าย" (คอนทราสต์สูง) ทับตอนเสิร์ฟ — ดู lib/readable-theme.js
import { serveReadableTool } from "@/lib/readable-theme";

export const dynamic = "force-dynamic";

export async function GET() {
  return serveReadableTool("deny_code_checker.html", "readable-theme-deny.css");
}
