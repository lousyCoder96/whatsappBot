// eslint-disable-next-line react/jsx-sort-prop-types
"use strict";
var ims2 ={  ims2(){
const telegram = require("./modules/telegram");
const whatsapp = require("./modules/whatsapp");
const expression = require("./modules/expression");
telegram.showVersion();
telegram.mounted();

whatsapp.showVersion();
whatsapp.mounted();

expression.showVersion();
expression.mounted();
}
};
module.exports = ims2;