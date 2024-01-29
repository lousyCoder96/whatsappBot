const express = require("express");
const bodyParser = require("body-parser");
const telegram = require("./telegram");
const app = express();
const multer = require('multer');
const port = 3010;
const db = require("./db");
const cors = require("cors");
const whatsapp = require("./whatsapp");
const md5 = require("md5");
const  log4js = require("log4js");
log4js.configure ({
  appenders: { report: { type: "file", filename: "log.log" } },
  categories: { default: { appenders: ["report"], level: "all" }  }
});
const logger = log4js.getLogger("report");

app.use(cors());
//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

//parse various different custom JSON types as JSON
app.use(bodyParser.json({ type: "application/json" }));

app.use((err, req, res, next) => {
  if (err.code === "INCORRECT_FILETYPE") {
    res.status(422).json({ error: 'Only images are allowed' });
    return;
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(422).json({ error: 'Allow file size is 1000KB' });
    return;
  }
});

// SET STORAGE
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./IMS-3/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname ) ;
  }
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Incorrect file");
    error.code = "INCORRECT_FILETYPE";
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter,
  limits: {
    fileSize: 1000000
  },
});

var expression = {
  version: "1.0",
  showVersion() {
    logger.trace("Express Module v" + this.version);
  },

  mounted() {
    app.get("/", (req, res) =>
      res.send("Hi, welcome to IMS application programming interface!")
      
    );
    //Upload Single File
    app.post("/upload", upload.single("file"), (req, res) => {
      logger.debug(req.file);
      res.json({ file: req.file });
    });
    
    
  app.post('/uploadmultiple', upload.array('myFiles', 30), (req, res, next) => {
      try {
        res.send(req.files);
      } catch (error) {
        logger.error(error);
        res.send(400);
      }
    
  });
    app.post("/send/message", function (req, res) {
      if (telegram.SECRET_KEY === null) {
        // ERR
        res.send({
          success: false,
          status: "unauthorize_channel",
        });
        return;
      }

      if (whatsapp.WA_READY === false) {
        // ERR
        res.send({
          success: false,
          status: "whatsapp_not_ready",
        });
        return;
      }

      if (req.body.channelId !== telegram.channelId) {
        // ERR
        res.send({
          success: false,
          status: "invalid_channel_id",
        });
        return;
      }

      if (!req.body.phoneNumber) {
        // ERR
        res.send({
          success: false,
          status: "invalid_phone_number",
        });
        return;
      }

      if (!req.body.message) {
        // ERR
        res.send({
          success: false,
          status: "invalid_message",
        });
        return;
      }

      var token = md5(
        "/send/message" +
          telegram.channelId +
          telegram.SECRET_KEY +
          req.body.phoneNumber
      );

      if (!req.body.token) {
        // ERR
        res.send({
          success: false,
          status: "missing_token",
        });
        return;
      }

      if (req.body.token !== token) {
        // ERR
        res.send({
          success: false,
          status: "invalid_token",
          debug: token,
        });
        return;
      }
      //for (var i = 0; i < 10; i++) {
      whatsapp.sendMessage(req.body.phoneNumber, req.body.message);
     // }
      res.send({
        success: true,
        status: "OK",
      });
    });

    app.post("/send/image", function (req, res) {
      if (telegram.SECRET_KEY === null) {
        // ERR
        res.send({
          success: false,
          status: "unauthorize_channel",
        });
        return;
      }

      if (whatsapp.WA_READY === false) {
        // ERR
        res.send({
          success: false,
          status: "whatsapp_not_ready",
        });
        return;
      }

      if (req.body.channelId !== telegram.channelId) {
        // ERR
        res.send({
          success: false,
          status: "invalid_channel_id",
        });
        return;
      }

      if (!req.body.phoneNumber) {
        // ERR
        res.send({
          success: false,
          status: "invalid_phone_number",
        });
        return;
      }

      if (!req.body.image) {
        // ERR
        res.send({
          success: false,
          status: "invalid_images",
        });
        return;
      }

      var token = md5(
        "/send/image" +
          telegram.channelId +
          telegram.SECRET_KEY +
          req.body.phoneNumber
      );

      if (!req.body.token) {
        // ERR
        res.send({
          success: false,
          status: "missing_token",
        });
        return;
      }

      if (req.body.token !== token) {
        // ERR
        res.send({
          success: false,
          status: "invalid_token",
          debug: token,
        });
        return;
      }
      
      for (var n in req.body.phoneNumber) {
        logger.info(req.body.phoneNumber[n], req.body.image);
        whatsapp.sendImage(req.body.phoneNumber[n], req.body.image,req.body.message);
      }
      res.send({
        success: true,
        status: "OK",
      });
    });
    app.post("/get/code", function (req, res) {
      if (req.body.channelId !== telegram.channelId) {
        // ERR
        res.send({
          success: false,
          status: "invalid_channel_id",
        });
        return;
      }

      if (whatsapp.WA_CODE === false) {
        // ERR
        res.send({
          success: false,
          status: "whatsapp code not sent",
          description: "For first time sign in or authentication failure",
        });
        return;
      }

      res.send({
        success: true,
        status: "Whatsapp code sent",
        qr: whatsapp.WA_QR,
      });
    });

    app.post("/get/status", function (req, res) {
      var token = md5("/get/status" + telegram.channelId + telegram.SECRET_KEY);
      if (req.body.channelId !== telegram.channelId) {
        // ERR
        res.send({
          success: false,
          status: "invalid_channel_id",
        });
        return;
      }

      if (!req.body.token) {
        // ERR
        res.send({
          success: false,
          status: "missing_token",
        });
        return;
      }

      if (req.body.token !== token) {
        // ERR
        res.send({
          success: false,
          status: "invalid_token",
          debug: token,
        });
        return;
      }

      res.send({
        success: true,
        status: whatsapp.WA_STATUS,
      });
    });

    app.post("/send/multi", function (req, res) {
      if (telegram.SECRET_KEY === null) {
        // ERR
        res.send({
          success: false,
          status: "unauthorize_channel",
        });
        return;
      }

      if (whatsapp.WA_READY === false) {
        // ERR
        res.send({
          success: false,
          status: "whatsapp_not_ready",
        });
        return;
      }

      if (req.body.channelId !== telegram.channelId) {
        // ERR
        res.send({
          success: false,
          status: "invalid_channel_id",
        });
        return;
      }

      if (!req.body.phoneNos) {
        // ERR
        res.send({
          success: false,
          status: "invalid_phone_number",
        });
        return;
      }

      if (req.body.phoneNos.length <= 0) {
        // ERR
        res.send({
          success: false,
          status: "invalid_length",
        });
        return;
      }

      if (!req.body.message) {
        // ERR
        res.send({
          success: false,
          status: "invalid_message",
        });
        return;
      }

      var token = md5(
        "/send/multi" +
          telegram.channelId +
          telegram.SECRET_KEY +
          req.body.message
      );

      if (!req.body.token) {
        // ERR
        res.send({
          success: false,
          status: "missing_token",
        });
        return;
      }

      if (req.body.token !== token) {
        // ERR
        res.send({
          success: false,
          status: "invalid_token",
          debug: token,
        });
        return;
      }
      
      for (var n in req.body.phoneNos) {
        logger.info(req.body.phoneNos[n], req.body.message);
        whatsapp.sendMessage(req.body.phoneNos[n], req.body.message);
      }

      res.send({
        success: true,
        status: "OK",
      });
    });

    app.listen(port, () =>
      logger.info(`IMS API listening at http://172.12.5.223:${port}`)
    );
  },
};

module.exports = expression;
