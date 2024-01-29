const sql = require("mssql");
const  log4js = require("log4js");
log4js.configure ({
  appenders: { report: { type: "file", filename: "log.log" } },
  categories: { default: { appenders: ["report"], level: "all" } }
});
const logger = log4js.getLogger("error");
var db = {
  version: "1.0",
  showVersion() {
    logger.trace("SQL Module v" + this.version);
  },
  config: {
    user: "sa",
    password: "pass@word1",
    server: "172.12.5.200",
    database: "ims1",
  },

  readSecretKey(channelId) {
    return new Promise((resolve, reject) => {
      sql
        .connect(this.config)
        .then((pool) => {
          return pool
            .request()
            .input("channelId", sql.VarChar(50), channelId)
            .query("select * from channels where channelId = @channelId");
        })
        .then((result) => {
          //sql.close();
          if (result.recordset.length > 0) {
            resolve(result.recordset[0].secretKey);
          } else {
            // error handling
            reject();
          }
        })
        .catch((err) => {
          logger.error("Cannot read secret key");
          sql.close();
          reject(err);
        });
    });
  },
  readUsers(channelId) {
    return new Promise((resolve, reject) => {
      sql
        .connect(this.config)
        .then((pool) => {
          return pool
            .request()
            .input("channelId", sql.VarChar(50), channelId)
            .query("select * from users where channelId = @channelId");
        })
        .then((result) => {
          //sql.close();
          resolve(result.recordset);
        })
        .catch((err) => {
          logger.error("Cannot read user");
          sql.close();
          reject(err);
        });
    });
  },
  upsertUser(channelId, chatId) {
    return new Promise((resolve, reject) => {
      sql
        .connect(this.config)
        .then((pool) => {
          return pool
            .request()
            .input("channelId", sql.VarChar(50), channelId)
            .input("chatId", sql.VarChar(50), chatId)
            .execute("UpsertUser");
        })
        .then((result) => {
          //sql.close();
          resolve();
        })
        .catch((err) => {
          logger.error("Cannot insert user");
          sql.close();
          reject();
        });
    });
  },
  deleteUser(channelId, chatId) {
    return new Promise((resolve, reject) => {
      sql
        .connect(this.config)
        .then((pool) => {
          return pool
            .request()
            .input("channelId", sql.VarChar(50), channelId)
            .input("chatId", sql.VarChar(255), chatId)
            .execute("DeleteUser");
        })
        .then((result) => {
          //sql.close();
          resolve();
        })
        .catch((err) => {
          logger.error("Cannot delete user");
          sql.close();
          reject();
        });
    });
  },
  disableUser(channelId, chatId) {
    return new Promise((resolve, reject) => {
      sql
        .connect(this.config)
        .then((pool) => {
          return pool
            .request()
            .input("channelId", sql.VarChar(50), channelId)
            .input("chatId", sql.VarChar(255), chatId)
            .execute("DisableUser");
        })
        .then((result) => {
          //sql.close();
          resolve();
        })
        .catch((err) => {
          logger.error("Cannot Disable");
          sql.close();
          reject();
        });
    });
  },
  checkUser(channelId, chatId) {
    return new Promise((resolve, reject) => {
      sql
        .connect(this.config)
        .then((pool) => {
          return pool
            .request()
            .input("channelId", sql.VarChar(50), channelId)
            .input("chatId", sql.VarChar(255), chatId)
            .execute("CheckUsers");
        })
        .then((result) => {
          resolve();
        })
        .catch((err) => {
          logger.error("Cannot Check");
          sql.close();
          reject();
        });
    });
  },
};

module.exports = db;
