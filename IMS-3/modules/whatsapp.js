const qrcode = require("qrcode");
const fs = require("fs");
const { Client,MessageMedia } = require("whatsapp-web.js");
const db = require("./db");
const telegram = require("./telegram");
const  log4js = require("log4js");
log4js.configure ({
  appenders: { report: { type: "file", filename: "log.log" } },
  categories: { default: { appenders: ["report"], level: "all" }  }
});
const logger = log4js.getLogger("report");
var whatsapp = {
  version: "1.0",
  showVersion() {
    logger.trace("Whatsapp Module v" + this.version);
  },
  SESSION_FILE_PATH: null,
  bot: null,
  WA_STATUS: "UNKNOWN",
  WA_CODE: false,
  WA_QR: null,
  WA_READY: false,
  session: null,
  media :null,
  config: {
    headless: false,
    executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    qrTimeoutMs: 40000,
    qrRefreshIntervalMs: 45000,
    authTimeoutMs: 10000,
  },

  mounted() {
    this.SESSION_FILE_PATH = process.cwd() + "/IMS-3/data/session.json";
    this.media = process.cwd() + "/IMS-3/uploads/";
    this.readSession();
    this.bot = new Client({
      session: this.session,
      puppeteer: {
        headless: this.config.headless,
        executablePath: this.config.executablePath,
      },
      authTimeoutMs: this.config.authTimeoutMs,
      qrTimeoutMs: this.config.qrTimeoutMs,
      qrRefreshIntervalMs : this.config.qrRefreshIntervalMs,
    });
    this.bot.on("authenticated", (session) => {
      this.session = session;
      fs.writeFile(this.SESSION_FILE_PATH, JSON.stringify(session), function (
        err
      ) {
        if (err) {
          logger.error(err);
        }
      });
    });

    this.bot.on("auth_failure", (msg) => {
      // Fired if session restore was unsuccessfull
      logger.error("AUTHENTICATION FAILURE", msg);
      this.destroyed();
      this.mounted();
    });

    this.bot.on("qr", (qr) => {
      this.WA_QR = qr;
      qrcode
        .toDataURL(qr, {
          margin: 4,
          width: 180,
        })
        .then((png) => {
          telegram.broadcastPNG(png);
        });
      this.WA_CODE = true;
    });

    this.bot.on("ready", () => {
      logger.info("Whatsapp is ready!");
      this.WA_READY = true;
      this.bot
        .getState()
        .then((state) => {
          this.WA_STATUS = state;
        })
        .catch((err) => {
          logger.error(err);
          this.WA_STATUS = "ERROR";
        });
      telegram.broadcastMessage("Whatsapp is ready!");
    });
    this.bot.on('message_create', async message => {
      var chat = await message.getChat();
      chat.sendSeen();
      chat.sendStateTyping();
    });
    this.bot.on("change_state", (state) => {
      logger.info(state);
      if (state === "UNPAIRED") {
        logger.info("Restart Session");
        this.destroyed();
        this.mounted();
      }
      if (state === "CONFLICT") {
        logger.info("Conflicted");
        this.destroyed();
        this.mounted();
      }
      if (state === "UNLAUNCHED") {
        logger.info("Trying to relaunch");
        this.mounted();
      }
      this.WA_STATUS = state;
    });
    this.bot.initialize();
  },
  destroyed() {
    this.WA_READY = false;
    this.bot.destroy();
    this.session = null;

    if (fs.existsSync(this.SESSION_FILE_PATH)) {
      fs.unlink(this.SESSION_FILE_PATH, function (err) {
        if (err) throw err;
        logger.info("WA Session deleted!");
      });
    }
  },
  sendMessage(phone, msg) {
    this.chatId = phone + "@c.us"; 
    this.bot
      .sendMessage(this.chatId, msg,{linkPreview:true})
      .then((res) => {
        logger.info(res, "Messaged Sent on Whatsapp");
      })
      .catch((res) => {
        logger.error(res, "Error sending Whatsapp message");
        this.destroyed();
        this.mounted();
      });
  },
  sendImage(phone,picture,msg){
    this.chatId = phone + "@c.us"; 
    var image= MessageMedia.fromFilePath(this.media+ picture);
    this.bot
      .sendMessage(this.chatId,image,{caption: msg, linkPreview:true})
      .then((res) => {
        logger.info(res, "Picture with Caption Sent on Whatsapp");
      })
      .catch((res) => {
        logger.error(res, "Error sending picture Whatsapp message");
        this.destroyed();
        this.mounted();
      });
  },
  readSession(){
    logger.info("Session read from ", this.SESSION_FILE_PATH);
    if (fs.existsSync(this.SESSION_FILE_PATH)) {
      this.session = require(this.SESSION_FILE_PATH);
      logger.info(this.session);
    }
  },
};

module.exports = whatsapp;
