import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import "./config.js"
import qrcode from "qrcode-terminal"
import pino from "pino"

const logger = pino({ level: 'silent' })

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({ auth: state, logger })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    if(qr) {
      console.log("ESCANEA ESTE QR:")
      qrcode.generate(qr, { small: true })
    }
    if(connection === 'open') {
      console.log("✅ BotSrX CONECTADO")
    }
    if(connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
      if(shouldReconnect) startBot()
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if(!m.message || m.key.fromMe) return
    const text = m.message.conversation || m.message.extendedTextMessage?.text || ""
    const from = m.key.remoteJid

    if(text.toLowerCase() === "hola" || text.toLowerCase() === "bot") {
      await sock.sendMessage(from, { text: `Hola! Soy *BotSrX* 🤖\n\nEscribe *menu* para ver comandos` })
    }
    if(text.toLowerCase() === "menu") {
      await sock.sendMessage(from, { text: `*MENU BotSrX*\n\n1. hola - Saludo\n2. menu - Este menú\n3. ping - Velocidad del bot` })
    }
    if(text.toLowerCase() === "ping") {
      await sock.sendMessage(from, { text: `Pong! 🏓 ${Date.now()}ms` })
    }
  })
}

startBot()
