// eslint-disable-next-line react/jsx-sort-prop-types
"use strict";
var ims1={ ims1(){
const telegram = require("./modules/telegram");
const whatsapp = require("./modules/whatsapp");
const expression = require("./modules/expression");
telegram.showVersion();
telegram.mounted();

whatsapp.showVersion();
whatsapp.mounted();

expression.showVersion();
expression.mounted();
},
};
module.exports = ims1;
