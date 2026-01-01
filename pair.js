const express = require("express");
const fs = require("fs");
const router = express.Router();
const pino = require("pino");
const QRCode = require("qrcode");
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers, jidNormalizedUser } = require("@whiskeysockets/baileys");
const { upload } = require("./mega");

function removeFile(filePath) {
  if (fs.existsSync(filePath)) fs.rmSync(filePath, { recursive: true, force: true });
}

router.get("/", async (req, res) => {
  const num = req.query.number;
  if (!num) return res.json({ code: "NO NUMBER PROVIDED" });

  async function RobinPair() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");

    try {
      const sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
      });

      sock.ev.on("creds.update", saveCreds);

      let reconnecting = false;

      sock.ev.on("connection.update", async ({ connection, qr, lastDisconnect }) => {

        if (qr && !res.headersSent) {
          const qrDataURL = await QRCode.toDataURL(qr);
          return res.send(`
            <h3>Scan QR with WhatsApp</h3>
            <img src="${qrDataURL}" />
          `);
        }

        if (connection === "open") {
          console.log("✅ WhatsApp connected!");
          const auth_path = "./session/";
          const user_jid = jidNormalizedUser(sock.user.id);

          try {
            const randomMegaId = () => Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 10000);
            const mega_url = await upload(fs.createReadStream(auth_path + "creds.json"), `${randomMegaId()}.json`);
            const string_session = mega_url.replace("https://mega.nz/file/", "");
            const sidMessage = `*Gesa WA BOT*\n\nSession CODE: ${string_session}\n\n🛑 DO NOT SHARE THIS CODE! 🛑`;
            await sock.sendMessage(user_jid, { text: sidMessage });
            removeFile(auth_path);
          } catch (e) { console.error("Mega/session upload error:", e); }
        }

        else if (connection === "close" && lastDisconnect && lastDisconnect.error?.output?.statusCode !== 401) {
          if (!reconnecting) {
            reconnecting = true;
            console.log("Reconnecting in 10s...");
            await delay(10000);
            reconnecting = false;
            RobinPair().catch(console.error);
          }
        }

      });
    } catch (err) {
      console.error("Service error:", err);
      removeFile("./session");
      if (!res.headersSent) res.send("Service Unavailable");
    }
  }

  await RobinPair();
});

module.exports = router;
