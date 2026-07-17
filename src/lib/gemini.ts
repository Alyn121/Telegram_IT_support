const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function parseTicketFromText(text: string) {
  const prompt = `
Bạn là một AI phân tích tin nhắn hỗ trợ IT. Nhiệm vụ của bạn là phân loại Ý ĐỊNH (intent) của tin nhắn, và nếu là báo cáo sự cố thì trích xuất thông tin ticket.
Trả về KẾT QUẢ DUY NHẤT LÀ ĐỊNH DẠNG JSON, KHÔNG KÈM THEO BẤT KỲ VĂN BẢN NÀO KHÁC (không có markdown code block \`\`\`json).

Output JSON format bắt buộc:
{
  "intent": "create_ticket" | "check_status" | "off_topic",
  "ticket_id": number | null (chỉ điền khi intent là check_status VÀ người dùng có nhắc đến số ticket cụ thể, ví dụ "ticket 8", "#8"),
  "title": string (Ngắn gọn, < 50 ký tự, chỉ cần khi intent là create_ticket),
  "description": string (Giữ nguyên hoặc tóm tắt ý chính, chỉ cần khi intent là create_ticket),
  "priority": "Low" | "Medium" | "High" | "Critical",
  "category": "Hardware" | "Software" | "Network" | "Account" | "Other",
  "needs_review": boolean (true nếu bạn không chắc chắn hoặc thiếu thông tin),
  "is_off_topic": boolean (true nếu intent là off_topic, giữ lại để tương thích ngược)
}

"check_status" là khi người dùng hỏi về tình trạng/trạng thái ticket đã gửi trước đó (của họ hoặc một ticket cụ thể), KHÔNG phải báo cáo sự cố mới.

Ví dụ 1:
User: "Máy tính của em bị xanh màn hình không khởi động được"
AI: {"intent":"create_ticket","ticket_id":null,"title":"Máy tính xanh màn hình","description":"Máy tính bị xanh màn hình không khởi động được","priority":"High","category":"Hardware","needs_review":false,"is_off_topic":false}

Ví dụ 2:
User: "Không vào được wifi ở tầng 3"
AI: {"intent":"create_ticket","ticket_id":null,"title":"Mất kết nối WiFi tầng 3","description":"Không vào được wifi ở tầng 3","priority":"Medium","category":"Network","needs_review":false,"is_off_topic":false}

Ví dụ 3:
User: "Trời hôm nay đẹp quá nhỉ, đi cafe không?"
AI: {"intent":"off_topic","ticket_id":null,"title":"Off topic","description":"","priority":"Low","category":"Other","needs_review":false,"is_off_topic":true}

Ví dụ 4:
User: "ticket của tôi tình trạng đang như nào"
AI: {"intent":"check_status","ticket_id":null,"title":"","description":"","priority":"Low","category":"Other","needs_review":false,"is_off_topic":false}

Ví dụ 5:
User: "ticket 8 xử lý tới đâu rồi"
AI: {"intent":"check_status","ticket_id":8,"title":"","description":"","priority":"Low","category":"Other","needs_review":false,"is_off_topic":false}

Bây giờ hãy phân tích tin nhắn sau:
User: "${text}"
AI:
`;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return { needs_review: true, error: data.error?.message || 'API Error' };
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
      return { needs_review: true, error: 'Empty response from Gemini' };
    }

    try {
      // Parse the JSON string
      const cleanJsonStr = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);
      return parsed;
    } catch (e) {
      console.error('Failed to parse Gemini output as JSON', aiText);
      return { needs_review: true, error: 'Invalid JSON format' };
    }
  } catch (err) {
    console.error('Error calling Gemini:', err);
    return { needs_review: true, error: 'Network error' };
  }
}
