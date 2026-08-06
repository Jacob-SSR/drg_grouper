// lib/rateLimit.js
// Rate limiter แบบ sliding window (in-memory) — port มาจาก lib/rateLimit.ts
// ของ ppc-hos-10667 (ตัดส่วน Redis ออก เพราะแอปนี้รัน instance เดียว)

/** @typedef {{ ok: boolean, remaining: number, retryAfterSec: number, limit: number }} RateLimitResult */

const store = new Map();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, bucket] of store.entries()) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
    if (bucket.timestamps.length === 0) store.delete(key);
  }
}

/**
 * ตรวจสอบ rate limit แบบ sliding window
 * @param {string} key    คีย์เฉพาะ (เช่น "login:ip:1.2.3.4")
 * @param {number} limit  จำนวน request สูงสุดในหน้าต่างเวลา
 * @param {number} windowMs ขนาดหน้าต่างเวลา (ms)
 * @returns {RateLimitResult}
 */
function rateLimit(key, limit, windowMs) {
  cleanup(windowMs);
  const now = Date.now();

  let bucket = store.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    store.set(key, bucket);
  }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    const retryAfterSec = Math.ceil((windowMs - (now - oldest)) / 1000);
    return { ok: false, remaining: 0, retryAfterSec, limit };
  }

  bucket.timestamps.push(now);
  return {
    ok: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSec: 0,
    limit,
  };
}

/** ดึง client IP จาก headers (รองรับ reverse proxy) */
function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return (
    req.headers["x-real-ip"] ||
    req.headers["cf-connecting-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/** ส่ง response 429 มาตรฐาน */
function tooManyRequests(res, result, message = "คำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่") {
  return res
    .status(429)
    .set({
      "Retry-After": String(result.retryAfterSec),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
    })
    .json({
      error: `${message} (${result.retryAfterSec} วินาที)`,
      retryAfter: result.retryAfterSec,
    });
}

module.exports = { rateLimit, getClientIp, tooManyRequests };
