const fs = require("fs");
const path = require("path");

const clFile = path.resolve(__dirname, "controller-language.js");
const clSource = fs.readFileSync(clFile).toString();

const clSourceFixed = clSource.replace(/\(this\);[ \r\n]+$/g, "(typeof window !== 'undefined' ? window : global);\n");

fs.writeFileSync(clFile, clSourceFixed, "utf8");