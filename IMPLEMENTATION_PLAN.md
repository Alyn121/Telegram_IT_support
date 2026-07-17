# IT Support Ticket Tool v0.1 — Implementation Plan

> **Mục tiêu:** Build MVP tool quản lý IT support ticket cho team 5-10 người, nhận ticket qua 2 kênh (Portal web + Telegram), AI tự phân loại, Dashboard Kanban realtime, deploy lên Vercel.
>
> **Đối tượng đọc file này:** Coding agent (Claude Code / Antigravity / Cursor). Thực hiện tuần tự theo từng Layer, KHÔNG bỏ qua checkpoint tests. Sau mỗi Layer, dừng lại và báo cáo kết quả trước khi qua Layer tiếp theo.

---

## 0. Tech Stack (cố định — không đổi)

| Vai trò | Công nghệ |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript strict |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + Realtime) |
| AI/LLM | Gemini 2.5 Flash — gọi qua `fetch()` thuần, **KHÔNG dùng SDK** |
| Messaging | Telegram Bot API (webhook + polling) |
| Deploy | Vercel |
| ORM | Không dùng Prisma — query trực tiếp qua Supabase client |

---

## 1. Cấu trúc thư mục bắt buộc

```
src/
  app/
    page.tsx                    # Portal - submit ticket
    dashboard/page.tsx          # Dashboard Kanban
    api/
      tickets/route.ts          # GET (list) + POST (create)
      tickets/[id]/route.ts     # PATCH (update status)
      telegram/route.ts         # Telegram webhook
  lib/
    supabase.ts                 # Supabase client
    gemini.ts                   # Gemini API helper
scripts/
  poll.ts                       # Telegram polling (dev mode)
  set-webhook.sh                # Set Telegram webhook URL
supabase/
  schema.sql
.env.local.example
.env.local                      # KHÔNG commit
.gitignore
architecture.md                 # Log các bug đã gặp + cách fix
```

---

## 2. Database Schema (chạy trong Supabase SQL Editor)

```sql
CREATE TABLE tickets (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('Low','Medium','High','Critical')),
  category TEXT,
  status TEXT CHECK (status IN ('New','In Progress','Resolved','Escalated')) DEFAULT 'New',
  source TEXT CHECK (source IN ('portal','telegram')) NOT NULL,
  reporter_name TEXT,
  telegram_message_id BIGINT UNIQUE,
  original_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Sau khi chạy schema:** vào Supabase Dashboard → Table Editor → `tickets` → **Enable Realtime**. Bước này hay bị bỏ quên — nếu quên, các subscription ở Layer 3 sẽ không fire.

---

## 3. Environment Variables

`.env.local` (thật, không commit):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
```

`.env.local.example` (commit file này):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
```

`.gitignore` phải chứa:
```
.env.local
node_modules/
.next/
```

**⚠️ Lỗi thực tế hay gặp:** khoảng trắng quanh dấu `=` trong `.env.local` → API trả 401/403 không rõ nguyên nhân. Verify bằng:
```ts
console.log(JSON.stringify(process.env.GEMINI_API_KEY))
```
Kết quả đúng: `"AIza..."` (không có khoảng trắng ở đầu/cuối).

`SUPABASE_SERVICE_ROLE_KEY` chỉ dùng phía server (API routes), không bao giờ expose ra client — không có prefix `NEXT_PUBLIC_`.

---

## 4. Layer-by-Layer Execution Plan

### LAYER 0 — Discovery (không code)
- [ ] Xác nhận scope MVP: 5 user stories tối đa, dạng "Là [role], tôi muốn [action] để [outcome]"
- [ ] Xác nhận Definition of Done:
  1. User submit ticket qua Portal web → ticket xuất hiện trên Dashboard
  2. User nhắn Telegram → AI parse → ticket xuất hiện với priority + category đúng
  3. Agent đổi trạng thái ticket → cập nhật realtime trên tất cả tab đang mở
  4. App deploy lên Vercel, ai có link đều truy cập được
- [ ] Ghi các quyết định trên vào `SCOPE.md`

### LAYER 1 — UI First
- [ ] Tạo mockup HTML/Tailwind tĩnh (không logic) cho:
  - **Portal**: form title, description, priority (dropdown Low/Medium/High/Critical), reporter_name, nút Submit, thông báo thành công
  - **Dashboard**: Kanban 3 cột (New / In Progress / Resolved), mỗi card hiện title, category badge, priority badge (màu theo mức độ), thời gian, source icon
- [ ] Review checklist trước khi code thật:
  - Portal form đủ field? (title, description, priority, reporter_name)
  - Dashboard có filter/sort theo priority hoặc trạng thái?
  - Mỗi card đủ info để agent quyết định? (category, priority, source, created_at)
  - Source hiển thị rõ? (🌐 portal / 📱 telegram)
  - MVP v0.1 → chỉ cần desktop, mobile để sau

### LAYER 2 — Project Setup
```bash
npx create-next-app@latest ticket-tool --typescript --tailwind --app
cd ticket-tool
npm install @supabase/supabase-js
```
- [ ] Tạo cấu trúc folder đúng như mục 1
- [ ] Chạy schema SQL trong Supabase, bật Realtime
- [ ] Tạo `.env.local`, `.env.local.example`, `.gitignore`
- [ ] Verify env vars không có khoảng trắng thừa

### LAYER 3 — UI + Supabase (version chạy được đầu tiên)

**`src/lib/supabase.ts`** — export client dùng service role key ở server, anon key ở client.

**`src/app/api/tickets/route.ts`**:
```ts
import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tickets').insert([{ ...body, status: 'New' }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

**`src/app/page.tsx`** (Portal):
- POST `/api/tickets` với body `{ title, description, priority, reporter_name, source: 'portal' }`
- States: loading (disable button khi submit), success ("Ticket #ID đã được ghi nhận"), error (hiện message từ API)
- React `useState` + `fetch()` thuần, không dùng form library

**`src/app/dashboard/page.tsx`** (Dashboard Kanban):
- GET `/api/tickets` → nhóm theo `status` thành 3 cột
- Nút "Move to In Progress" / "Resolve" trên card (KHÔNG cần drag & drop ở v0.1)
- Realtime subscription:
```ts
useEffect(() => {
  const channel = supabase.channel('tickets')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' },
      (payload) => setTickets(prev => [payload.new as Ticket, ...prev])
    ).subscribe()
  return () => { supabase.removeChannel(channel) } // BẮT BUỘC — thiếu dòng này gây memory leak/flicker
}, [])
```

**Checkpoint tests — PHẢI pass cả 5 trước khi qua Layer 4:**
1. [ ] Submit Portal form → ticket xuất hiện trên Dashboard trong vòng 2 giây
2. [ ] Mở Dashboard 2 tab → submit ở 1 tab → tab kia tự cập nhật
3. [ ] Submit priority = Critical → badge màu đỏ trên card
4. [ ] Submit thiếu title → form validation chặn, KHÔNG gọi API
5. [ ] Refresh Dashboard → ticket vẫn còn, không mất

**Deploy Vercel ngay sau khi 5 test pass (không đợi Layer 4):**
```bash
git init
git add src/ package.json tailwind.config.ts tsconfig.json .env.local.example .gitignore
git commit -m "feat: v0.1 core CRUD + dashboard"
git remote add origin https://github.com/<user>/ticket-tool
git push -u origin main
```
Vercel: Import GitHub repo → paste từng ENV var từ `.env.local` → Deploy (2-3 phút) → lấy URL `https://ticket-tool-xxx.vercel.app`

### LAYER 4 — Telegram + LLM

**`src/lib/gemini.ts`** — hàm `parseTicketFromText(text: string)`:
- Endpoint: `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent`
- Auth header: `Authorization: Bearer ${process.env.GEMINI_API_KEY}`
- Dùng `fetch()` thuần, KHÔNG dùng Google AI SDK
- Prompt few-shot với 3 ví dụ tiếng Việt (bắt buộc — zero-shot parse sai 40-50%, few-shot đạt 80%+):
  - `"Máy tính của em bị xanh màn hình..."` → `{"title":"Máy tính xanh màn hình...","priority":"High","category":"Hardware"}`
  - `"Không vào được wifi ở tầng 3"` → `{"title":"Mất kết nối WiFi tầng 3","priority":"Medium","category":"Network"}`
  - `"Quên mật khẩu email công ty"` → `{"title":"Quên mật khẩu email","priority":"Low","category":"Account"}`
- Output JSON bắt buộc: `{ title, description, priority, category, needs_review }`
- Priority: `Low | Medium | High | Critical`
- Category: `Hardware | Software | Network | Account | Other`
- Nếu parse JSON thất bại → return `needs_review: true`, KHÔNG throw error

**`src/app/api/telegram/route.ts`** — webhook handler:
```ts
// QUAN TRỌNG: Return 200 NGAY, xử lý sau (fire-and-forget)
export async function POST(req) {
  const update = await req.json()
  const msg = update.message
  if (!msg?.text) return Response.json({ ok: true })
  processMessage(msg).catch(console.error) // KHÔNG await
  return Response.json({ ok: true }) // 200 trước khi hết 5s timeout của Telegram
}

async function processMessage(msg) {
  const parsed = await parseTicketFromText(msg.text)
  await createTicket({
    ...parsed,
    source: 'telegram',
    telegram_message_id: msg.message_id, // UNIQUE constraint → idempotency, chống duplicate khi Telegram retry
    original_text: msg.text,
  })
}
```

**`scripts/poll.ts`** — polling mode để test local, không cần ngrok:
```ts
let offset = 0
async function poll() {
  const res = await fetch(
    `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=30`
  )
  const data = await res.json()
  for (const update of data.result) {
    await processMessage(update.message)
    offset = update.update_id + 1
  }
  poll()
}
poll()
```
Thêm vào `package.json`: `"dev:poll": "ts-node scripts/poll.ts"`

- [ ] Tạo bot qua @BotFather → lấy `TELEGRAM_BOT_TOKEN`
- [ ] Set webhook trỏ về Vercel URL: `./scripts/set-webhook.sh https://ticket-tool-xxx.vercel.app`
- [ ] Test: nhắn Telegram → ticket xuất hiện trên Dashboard trong vài giây
- [ ] Test idempotency: gửi lại đúng message → KHÔNG tạo ticket duplicate (nhờ `telegram_message_id UNIQUE`)

### LAYER 5 — Debug & Polish
- [ ] Thêm structured log xuyên suốt pipeline: `received → filtered → parsed → saved → notified`
- [ ] Cố tình tạo 1 lỗi (vd: đổi model name thành `gemini-3-flash` — không tồn tại) → thực hành debug: copy full error → paste vào AI kèm context (hành động đang làm + file liên quan) → review fix → test lại
- [ ] (Optional nếu còn thời gian) optimistic update cho nút "Move to In Progress"/"Resolve": update UI trước, DB sau, revert + toast error nếu DB fail
- [ ] Ghi lại các bug đã gặp + cách fix vào `architecture.md`

---

## 5. Known Bugs / Gotchas (tránh lặp lại)

| Bug | Nguyên nhân | Fix |
|---|---|---|
| API 401/403 không rõ lý do | Khoảng trắng quanh `=` trong `.env.local` | Xóa khoảng trắng, verify bằng `JSON.stringify(process.env.X)` |
| Model không tồn tại | Dùng `gemini-3-flash` (không có thật) | Dùng đúng `gemini-2.5-flash` |
| Dashboard flicker / memory leak sau vài phút | Thiếu `removeChannel()` cleanup | Luôn `return () => supabase.removeChannel(channel)` trong `useEffect` |
| Ticket bị duplicate khi Telegram retry | Xử lý > 5s trước khi return 200, không có unique constraint | Return 200 ngay (fire-and-forget) + `telegram_message_id UNIQUE` |
| Realtime không fire | Chưa bật Realtime cho bảng trong Supabase Dashboard | Table Editor → tickets → Enable Realtime |
| Secret bị lộ | Commit nhầm `.env.local` hoặc dùng `NEXT_PUBLIC_` cho service role key | `.gitignore` chứa `.env.local`; chỉ dùng `NEXT_PUBLIC_` cho key an toàn phía client |

---

## 6. Definition of Done (toàn bộ project)

- [ ] Portal + Telegram đều tạo được ticket thành công
- [ ] Dashboard realtime hoạt động, đồng bộ giữa nhiều tab
- [ ] App đã deploy Vercel, truy cập được qua public URL
- [ ] `.env.local` không bị commit lên Git
- [ ] Không có ticket duplicate khi Telegram gửi lại message
- [ ] Tất cả 5 checkpoint tests ở Layer 3 pass
- [ ] `architecture.md` đã ghi lại các bug gặp phải trong quá trình build

---

## 7. Nguyên tắc làm việc cho coding agent

1. **Không nhảy cóc Layer.** Mỗi Layer phải hoàn thành checkpoint trước khi qua Layer tiếp theo.
2. **Deploy sớm (sau Layer 3), không đợi làm xong hết mới deploy.**
3. **Return 200 trước, xử lý sau** với mọi webhook — tránh timeout/retry/duplicate.
4. **Idempotency qua DB constraint**, không tự viết logic check duplicate phức tạp.
5. **Source field (`portal`/`telegram`) là nền tảng** — dùng chung 1 pipeline `processMessage()`/`createTicket()` cho cả 2 kênh, tránh viết logic riêng biệt cho từng kênh (adapter pattern).
6. Khi gặp lỗi: log đầy đủ, xác định đang stuck ở bước nào trong pipeline `received → filtered → parsed → saved → notified`, rồi mới fix.
