# IT Support Ticket Tool v0.1 — Scope & Definition of Done

## Scope MVP (5 User Stories)

1. **Là User**, tôi muốn truy cập web portal để tạo ticket báo lỗi IT (title, description, priority) để IT team nắm được vấn đề.
2. **Là User**, tôi muốn gửi tin nhắn qua Telegram cho IT Support Bot để tạo ticket tự động mà không cần vào web.
3. **Là IT Agent**, tôi muốn xem danh sách các ticket trên Dashboard dạng Kanban board (chia theo trạng thái New, In Progress, Resolved) để dễ dàng quản lý công việc.
4. **Là IT Agent**, tôi muốn chuyển trạng thái ticket (từ New sang In Progress, rồi Resolved) trên Dashboard để cập nhật tiến độ cho mọi người.
5. **Là IT Agent**, tôi muốn Dashboard cập nhật realtime (không cần F5) khi có ticket mới từ Telegram/Web hoặc khi trạng thái thay đổi để luôn thấy thông tin mới nhất.

## Definition of Done

1. User submit ticket qua Portal web → ticket xuất hiện trên Dashboard.
2. User nhắn Telegram → AI parse → ticket xuất hiện với priority + category đúng.
3. Agent đổi trạng thái ticket → cập nhật realtime trên tất cả tab đang mở.
4. App deploy lên Vercel, ai có link đều truy cập được.
