const TelegramBot = require("node-telegram-bot-api");
const db = require("./db");
const  log4js = require("log4js");
log4js.configure ({
  appenders: { report: { type: "file", filename: "log.log" } },
  categories: { default: { appenders: ["report"], level: "all" } }
});
const logger = log4js.getLogger("report");

db.showVersion();

var telegram = {
  version: "1.0",
  showVersion() {
    logger.trace("Telegram Module v" + this.version);
  },
  options: {
    PNG: {
      filename: "image",
      contentType: "image/png",
    },
  },
  token: "",
  channelId: "epic3",
  callDisabled : null,
  SECRET_KEY: null,
  users: null,
  bot: null,
  webhook_error : null,
  polling_error : null,
  mounted() {
    this.bot = new TelegramBot(this.token, 
      { polling: true,
    });
    
    db.readSecretKey(this.channelId).then((data) => {
      this.SECRET_KEY = data;
      logger.info("The secret key is ", this.SECRET_KEY);
    });
    db.readUsers(this.channelId).then((data) => {
      this.users = data;
      logger.info("Current Users in DB", this.users);
      
    });
    this.webhook_error= this.bot.on('webhook_error', (err) => {
      console.log(error.code); 
      logger.error(err);
      console.log(err.code);	// => 'EPARSE'
    });
    this.polling_error = this.bot.on("polling_error", (err) =>{
      console.log(err);
      logger.error(err);
      console.log(err.code);// => 'EFATAL'
    });
    //
    // Matches "/bind [whatever]"
    this.bot.onText(/\/bind (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const content = match[1];
      var resp = this.handleBind(chatId, content);
      this.bot.sendMessage(chatId, resp);
      //var wazz = whatsapp.sendMessage(chatId,phone, msg);
    });
    // delete "/bind [whatever]"
    this.bot.onText(/\/delete (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const content = match[1];
      var resp = this.handleDelete(chatId, content);
      this.bot.sendMessage(chatId, resp);
    });
  },
  handleBind(chatId, content) {
    logger.info(content, this.SECRET_KEY);
    var resp = "OK";
    if (content === this.SECRET_KEY) {
      resp = "Successfully added! "+chatId;
      logger.info("Successfully added! "+chatId);
      db.upsertUser(this.channelId, chatId).then(() => {
        db.readUsers(this.channelId).then((data) => {
          this.users = data;
          logger.info("Updated User Added List " ,this.users);
        });
      });
    } else {
      resp = "Invalid secret key, please try again...";
    }
    return resp;
  },
  handleDelete(chatId, content) {
    logger.info(content, this.SECRET_KEY);
    var resp = "OK";
    if (content === this.SECRET_KEY) {
      resp = "Successfully deleted! "+chatId;
      logger.info("Successfully deleted! "+chatId);
      db.deleteUser(this.channelId, chatId).then(() => {
        db.readUsers(this.channelId).then((data) => {
          this.users = data;
          logger.info("Updated User Deleted List ",this.users);
        });
      });
    } else {
      resp = "Invalid secret key, please try again...";
    }
    return resp;
  },
  checkUsers(chatId){
    db.checkUser(this.channelId, chatId).then(() => {
      db.readUsers(this.channelId).then((data) => {
        this.users = data;
        logger.info("Updated List " ,this.users);
    });
  });
  },
  disableUsers(chatId) {
    db.disableUser(this.channelId, chatId).then(() => {
      db.readUsers(this.channelId).then((data) => {
        this.users = data;
        logger.info("Updated List after disabled ",this.users);
      });
    });
  //});
      
        
    },
  broadcastMessage(msg) {
    for (var n in this.users) {
      this.bot.sendMessage(this.users[n].chatId, msg);
    }
  },
  broadcastPNG(png) {
    var data = png.replace(/^data:image\/png;base64,/, "");
    
    this.users.forEach((n)=> {
      var chatId = n.chatId;
      this.bot.sendPhoto(
        n.chatId,
        Buffer.from(data, "base64"),
        {},
        this.options.PNG
      ).then((resp)=> {
        logger.info("QR successfully sent");
      }).catch((error) =>{
        if(this.webhook_error){
          console.log("This is a webhook error");
          logger.info("Webhook Error= EPARSE, Response body could not be passed");
          console.log(error.response.body);
          logger.error(error.response.body);
        }
        else if(this.polling_error){
          console.log("This is a polling error");
          logger.info("Polling Error= EFATAL, Network Error");
          console.log(error.response.body);
          logger.error(error.response.body);
        }
        else if(error.response.statusCode === 403){
          logger.error("User has blocked TelegramBot");
          logger.info("Chat Id that has blocked the bot: ", chatId); 
          console.log(error.response.body);
          logger.error(error.response.body);
          this.disableUsers(chatId);
          this.checkUsers(chatId); 
        }
        else if(error.code === "ETELGRAM"){
          logger.error("Error caught in ETELEGRAM");
          console.log(error.response.body);
          logger.error(error.response.body);
        }
        else{
          console.log(error.response.body);
          logger.error(error.response.body);
          console.log(error.code);
        }
    });
  });
  },
};

module.exports = telegram;
