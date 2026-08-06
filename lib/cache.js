// lib/cache.js — cachedQuery แบบ in-memory
// port แนวคิดจาก lib/cache.ts ของ ppc-hos-10667 (ตัด Redis ออก เพราะแอปนี้
// รัน instance เดียว — ได้ผลเท่ากันโดยไม่ต้องติดตั้งอะไรเพิ่ม)
//
// พฤติกรรม:
//   - ยังสด (อายุ < ttl)            → คืนทันที ไม่แตะ DB
//   - หมดอายุแบบ soft (< ttl×4)     → คืนของเก่าไปก่อน แล้ว refresh เบื้องหลัง
//   - ไม่มีของเลย                    → query จริง โดยแชร์ promise กัน
//                                      (10 คนกดพร้อมกัน = query ครั้งเดียว)
//   - query พังแต่มีของเก่า          → แจกของเก่า ดีกว่าโยน 500 ใส่ทุกคน

const STALE_GRACE = 4; // hard TTL = ttl * 4
const MAX_KEYS = 500; // กันหน่วยความจำบวมจาก key ที่ไม่ซ้ำกันมาก ๆ

const store = new Map(); // key -> { v, softExp, hardExp }
const inflight = new Map(); // key -> Promise (กันยิงซ้ำระหว่าง refresh)

function evictIfNeeded() {
  if (store.size <= MAX_KEYS) return;
  // ตัดตัวเก่าสุดออกทีละครึ่ง (Map iterate ตามลำดับ insert)
  let toDrop = Math.floor(store.size / 2);
  for (const key of store.keys()) {
    if (toDrop-- <= 0) break;
    store.delete(key);
  }
}

async function refresh(key, fn, ttl) {
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    try {
      const v = await fn();
      const now = Date.now();
      store.delete(key); // ลบก่อน set ให้ key ขยับไปท้ายคิว eviction
      store.set(key, {
        v,
        softExp: now + ttl * 1000,
        hardExp: now + ttl * STALE_GRACE * 1000,
      });
      evictIfNeeded();
      return v;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

/**
 * @param {(string|number)[]} keyParts เช่น ["cases", start, end]
 * @param {() => Promise<any>} fn      query จริง
 * @param {number} ttl                 อายุ cache (วินาที)
 */
export async function cachedQuery(keyParts, fn, ttl = 300) {
  const key = keyParts.join(":");
  const now = Date.now();
  const hit = store.get(key);

  if (hit && now < hit.softExp) return hit.v; // สด → จบเลย

  if (hit && now < hit.hardExp) {
    // soft-expired → แจกของเก่าทันที + refresh เบื้องหลัง (ไม่รอ)
    refresh(key, fn, ttl).catch(() => {});
    return hit.v;
  }

  // ไม่มีของ (หรือเก่าเกิน hard TTL) → query จริง แชร์ promise กัน
  try {
    return await refresh(key, fn, ttl);
  } catch (err) {
    if (hit) return hit.v; // query พังแต่ยังมีของเก่าเกิน hard TTL นิดหน่อย → แจกไปก่อน
    throw err;
  }
}
