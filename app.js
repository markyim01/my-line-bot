const express = require('express');
const line = require('@line/bot-sdk');
const translate = require('google-translate-api-x');

// 1. นำ Token และ Secret ของคุณมาใส่ที่นี่เหมือนเดิม
const config = {
  channelAccessToken: 'FvODZLg74s47ZQ8XFoegsF8lMMAJdGZUoc9FfDvDIaJ/xQLc9ghOVpnWMOI0v0u5FCMO/VmNqAuiGc1aqJclLPXUUuwBeAldzV9swf4NSzkrLXDFesGWQ9QjrT0U7c2Slyvg1fMxnih7dGCElzGGXwdB04t89/1O/w1cDnyilFU=',
  channelSecret: '8d1d588eab828f59863363ed23472ec2'
};

const app = express();
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// 4. ฟังก์ชันจัดการแชท (อัปเกรดระบบแปลภาษาและปุ่ม Quick Reply)
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userText = event.message.text;
  
  // ตั้งค่าเริ่มต้น
  let targetLang = 'en'; // แปลเป็นอังกฤษ
  let textToTranslate = userText;

  // เช็คว่ามีคำสั่งระบุภาษาซ่อนมาจากการกดปุ่มหรือไม่
  if (userText.startsWith('jp ')) {
    targetLang = 'ja'; // ญี่ปุ่น
    textToTranslate = userText.replace('jp ', '');
  } else if (userText.startsWith('kr ')) {
    targetLang = 'ko'; // เกาหลี
    textToTranslate = userText.replace('kr ', '');
  } else if (userText.startsWith('cn ')) {
    targetLang = 'zh-cn'; // จีน
    textToTranslate = userText.replace('cn ', '');
  } else if (userText.startsWith('en ')) {
    targetLang = 'en'; // อังกฤษ
    textToTranslate = userText.replace('en ', '');
  }

  try {
    // ทำการแปลภาษา
    const translated = await translate(textToTranslate, { to: targetLang });
    const replyText = translated.text;

    // สร้างปุ่ม Quick Reply ให้เลือกภาษาอื่นได้
    const quickReplyButtons = {
      items: [
        {
          type: 'action',
          action: { type: 'message', label: '🇯🇵 ญี่ปุ่น', text: `jp ${textToTranslate}` }
        },
        {
          type: 'action',
          action: { type: 'message', label: '🇰🇷 เกาหลี', text: `kr ${textToTranslate}` }
        },
        {
          type: 'action',
          action: { type: 'message', label: '🇨🇳 จีน', text: `cn ${textToTranslate}` }
        },
        {
          type: 'action',
          action: { type: 'message', label: '🇬🇧 อังกฤษ', text: `en ${textToTranslate}` }
        }
      ]
    };

    // ส่งข้อความกลับไปพร้อมปุ่มกด
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: 'text',
        text: replyText,
        quickReply: quickReplyButtons
      }]
    });

  } catch (error) {
    console.error("Translation Error:", error);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: "ขออภัยครับ ระบบแปลภาษามีปัญหาชั่วคราว" }]
    });
  }
}

// 5. รันเซิร์ฟเวอร์
// 5. รันเซิร์ฟเวอร์ (แก้ไขให้รองรับ Cloud)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Chatbot Server รันอยู่ที่ port ${port}`);
});