# IT Support Ticket Tool Architecture & Bugs Log

## Known Bugs / Gotchas (tránh lặp lại)

| Bug | Nguyên nhân | Fix |
|---|---|---|
| API 401/403 không rõ lý do | Khoảng trắng quanh `=` trong `.env.local` | Xóa khoảng trắng, verify bằng `JSON.stringify(process.env.X)` |
| Model không tồn tại | Dùng `gemini-3-flash` (không có thật) | Dùng đúng `gemini-2.5-flash` |
| Dashboard flicker / memory leak sau vài phút | Thiếu `removeChannel()` cleanup | Luôn `return () => supabase.removeChannel(channel)` trong `useEffect` |
| Ticket bị duplicate khi Telegram retry | Xử lý > 5s trước khi return 200, không có unique constraint | Return 200 ngay (fire-and-forget) + `telegram_message_id UNIQUE` |
| Realtime không fire | Chưa bật Realtime cho bảng trong Supabase Dashboard | Table Editor → tickets → Enable Realtime |
| Secret bị lộ | Commit nhầm `.env.local` hoặc dùng `NEXT_PUBLIC_` cho service role key | `.gitignore` chứa `.env.local`; chỉ dùng `NEXT_PUBLIC_` cho key an toàn phía client |
