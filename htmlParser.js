const chalk = require("chalk").default;

exports.parse = function(string) {
    string = string.replace(/\r\n/g, "\n");
    let tagStack = [];
    let pos = 0;
    const tagRegex = /<(\/?)(\w+?)(?:\s+(.*?))?>/g;
    
    const textFuncs = {};
    textFuncs["span"] = textFuncs["li"] = function() {
        let text = "";
        for (const child of this.children) {
            text += typeof child === "string"? child : child.getText();
        }
        if (this.data.style && this.data.style.indexOf("underline") != -1)
            return chalk.underline(text);
        return text;
    };
    textFuncs["p"] = function() {
        return "    "+textFuncs["span"].apply(this)+"\n";
    };
    textFuncs["div"] = function() {
        return textFuncs["span"].apply(this)+"\n";
    };
    textFuncs["a"] = textFuncs["u"] = function() {
        return chalk.underline(textFuncs["span"].apply(this));
    };
    textFuncs["em"] = textFuncs["strong"] = textFuncs["b"] = function() {
        return chalk.bold(textFuncs["span"].apply(this));
    };
    textFuncs["ol"] = function() {
        let text = "";
        let number = this.data.start || 1;
        for (const child of this.children) {
            if (child.tagName == "li")
                text += "  "+(number++)+".  "+child.getText()+"\n";
        }
        return text;
    };
    textFuncs["none"] = function() {
        return chalk.gray(textFuncs["span"].apply(this));
    };
    
    return parseTag("span", {}).getText();
    
    function parseTag(tagName, data) {
        let children = [];
        while (true) {
            const m = tagRegex.exec(string);
            if (m == null) {
                const text = string.slice(pos);
                if (text) children.push(text);
                break;
            }
            const [,slash,tag,rest] = m;
            const data = parseRest(rest);
            const text = string.slice(pos, m.index);
            pos = m.index+m[0].length;
            
            if (text != "") children.push(text);
            if (slash) {
                if (tag != tagName) throw "Bad close tag in HTML!";
                break;
            }
            children.push(tag=="br"? "\n" :
                          tag=="img"? chalk.magentaBright("[image]") :
                          parseTag(tag, data));
        }
        return {
            tagName, data, children,
            getText: textFuncs[tagName] || function() {throw "Unknown tag name: \""+tagName+"\""}
        };
    }
    
    function parseRest(rest) {
        const rx = /([\w-]+?)="([^"]*?)"/g;
        let obj = {};
        let m;
        while (m = rx.exec(rest)) {
            obj[m[1]] = m[2];
        }
        return obj;
    }
};