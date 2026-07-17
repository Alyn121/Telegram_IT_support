const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function parseTicketFromText(text: string) {
  const prompt = `
Bạn là một AI phân tích tin nhắn hỗ trợ IT. Nhiệm vụ của bạn là trích xuất thông tin ticket từ tin nhắn của người dùng.
Trả về KẾT QUẢ DUY NHẤT LÀ ĐỊNH DẠNG JSON, KHÔNG KÈM THEO BẤT KỲ VĂN BẢN NÀO KHÁC (không có markdown code block \`\`\`json).

Output JSON format bắt buộc:
{
  "title": string (Ngắn gọn, < 50 ký tự),
  "description": string (Giữ nguyên hoặc tóm tắt ý chính),
  "priority": "Low" | "Medium" | "High" | "Critical",
  "category": "Hardware" | "Software" | "Network" | "Account" | "Other",
  "needs_review": boolean (true nếu bạn không chắc chắn hoặc thiếu thông tin)
}

Ví dụ 1:
User: "Máy tính của em bị xanh màn hình không khởi động được"
AI: {"title":"Máy tính xanh màn hình","description":"Máy tính bị xanh màn hình không khởi động được","priority":"High","category":"Hardware","needs_review":false}

Ví dụ 2:
User: "Không vào được wifi ở tầng 3"
AI: {"title":"Mất kết nối WiFi tầng 3","description":"Không vào được wifi ở tầng 3","priority":"Medium","category":"Network","needs_review":false}

Ví dụ 3:
User: "Quên mật khẩu email công ty"
AI: {"title":"Quên mật khẩu email","description":"Quên mật khẩu email công ty","priority":"Low","category":"Account","needs_review":false}

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
