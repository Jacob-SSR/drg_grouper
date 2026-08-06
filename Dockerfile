# syntax=docker/dockerfile:1
# แนวเดียวกับ Dockerfile ของ ppc-hos-10667 แต่เรียบกว่า:
#   - ไม่มี native module (ใช้ bcryptjs ล้วน JS) → ไม่ต้องลง python/make/g++
#   - ฟอนต์ Prompt โหลดผ่าน <link> ตอน runtime → build ไม่ต้องต่อเน็ตหา Google Fonts
#
# วิธี build/run:  ดู docker-compose.yml (ต้องมีไฟล์ .env.production ก่อน)

FROM node:22-slim AS base
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder ----------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next build อ่าน env จาก .env.production ในโฟลเดอร์นี้
# (lib/db.js เช็คว่า DB_* / JWT_SECRET ครบตอน import — ไม่มีไฟล์นี้ build จะล้ม)
RUN npm run build

# ---------- runner (production) ----------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# รันด้วย user ที่ไม่ใช่ root
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# เอาเฉพาะผลลัพธ์ standalone — secret ใน .env.production ไม่ติดมา image นี้
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# หน้าเครื่องมือทั้งสองถูกอ่านจาก assets/ ตอน runtime (app/tools/*/route.js)
# standalone ไม่รู้จักไฟล์พวกนี้เอง ต้อง copy ตามไปด้วย
COPY --from=builder --chown=nextjs:nodejs /app/assets ./assets

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
