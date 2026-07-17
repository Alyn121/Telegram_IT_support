// Using built-in Node 18+ fetch

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error("Missing TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

let offset = 0;

// Mock function for now, will connect to API or local logic later
async function processMessage(msg: any) {
  console.log("Received message:", msg.text);
  // We will call our local API endpoint for processing to simulate webhook
  try {
    const res = await fetch('http://localhost:4000/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    console.log("Processed:", res.status);
  } catch (error) {
    console.error("Error processing message:", error);
  }
}

async function poll() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json() as any;
    
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        if (update.message) {
          await processMessage(update.message);
        }
        offset = update.update_id + 1;
      }
    }
  } catch (error) {
    console.error("Polling error:", error);
  }
  
  // Continue polling
  setTimeout(poll, 1000);
}

console.log("Starting Telegram polling...");
poll();
