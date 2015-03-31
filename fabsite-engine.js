/*
 * =========  FabSite Engine  =========
 *     © Aha! Factor Pty Ltd, 2015
 * https://github.com/ahafactor/fabsite
 * ====================================
 */

function runFabsiteLibrary(url) {

    function getChildren(node) {
        var i = 0;
        var result = [];
        for (i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType != 8 && (node.childNodes[i].nodeType != 3 || node.childNodes[i].nodeValue.trim() !== "")) {
                result.push(node.childNodes[i]);
            }
        }
        return result;
    }

    function firstExpr(node) {
        var first = 0;
        while (node.childNodes[first].nodeType == 8 || (node.childNodes[first].nodeType == 3 && node.childNodes[first].nodeValue.trim() === "")) {
            first++;
        }
        return node.childNodes[first];
    }

    function findChild(node, name) {
        var i = 0;
        for (i = 0; i < node.children.length; i++) {
            if (node.children[i].nodeName === name) {
                return node.children[i];
            }
        }
        throw "Error";
    }

    function findChildren(node, name) {
        var i = 0;
        var result = [];
        for (i = 0; i < node.children.length; i++) {
            if (node.children[i].nodeName == name) {
                result.push(node.children[i]);
            }
        }
        return result;
    }

    function single(a, name) {
        if (a.length > 1) {
            throw "More than one " + name;
        } else if (a.length === 0) {
            throw "Missing " + name;
        }
        return a[0];
    }

    var flevel = 0;

    function format(value) {
        var prop;
        var result;

        if (typeof value === "object") {
            result = "";
            if (flevel > 3) {
                return "{ ... }";
            }
            flevel++;
            for (prop in value) {
                if (result.length > 1000) {
                    result += ", ... ";
                    break;
                }
                if (result !== "") {
                    result += ", ";
                }
                result += prop + ": " + format(value[prop]);
            }
            flevel--;
            if (result === "") {
                return "";
            } else {
                return "{" + result + "}";
            }
        } else if (typeof value === "string") {
            if (value.length > 300) {
                return '"' + value.substr(0, 300) + ' ... "';
            } else {
                return '"' + value + '"';
            }
        } else {
            return value;
        }
    }

    var core = {
        appletclass: function(name) {
            return "fabsite-" + name;
        },
        nbsp: "&nbsp;",
        lt: "&lt;",
        br: "<br/>",
        math: {
            sin: function(x) {
                return Math.sin(x);
            },
            cos: function(x) {
                return Math.cos(x);
            },
            exp: function(x) {
                return Math.exp(x);
            },
            log: function(x) {
                return Math.log(x);
            },
            trunc: function(x) {
                return Math.trunc(x);
            },
            NaN: function(x) {
                return isNaN(x);
            },
            finite: function(x) {
                return isFinite(x);
            }
        },
        time: {
            msec: 1.0,
            sec: 1000.0,
            date: function(d) {
                return Number(Date(d.year, d.month, d.day, 0, 0, 0, 0));
            }
        },
        format: {
            intToStr: function(i) {
                return i.toString();
            },
            numToStr: function(x) {
                return x.toString();
            },
            formatNum: function(arg) {
                if (arg.hasOwnProperty("prec")) {
                    return arg.num.toPrecision(arg.prec);
                } else if (arg.hasOwnProperty("exp")) {
                    return arg.num.toExponential(arg.exp);
                } else {
                    return arg.num.toFixed(arg.dec);
                }
            },
            strToNum: function(s) {
                var result = parseFloat(s);
                if (isNaN(result)) {
                    throw "Error";
                }
                return result;
            },
            strToInt: function(s) {
                var result = parseInt(s);
                if (isNaN(result)) {
                    throw "Error";
                }
                return result;
            },
            dateToStr: function(x) {
                return Date(x).toString();
            },
        },
        string: {
            substr: function(args) {
                if (args.hasOwnProperty("length")) {
                    return args.str.substr(args.start, args.length);
                } else {
                    if (args.hasOwnProperty("end")) {
                        return args.str.slice(args.start, args.end);
                    } else {
                        return args.str.slice(args.start);
                    }
                }
            },
            indexOf: function(args) {
                var idx = args.str.indexOf(args.substr);
                if (idx >= 0) {
                    return idx;
                } else {
                    throw "Fail";
                }
            },
            length: function(str) {
                return str.length;
            },
            join: function(arg) {
                return arg.parts.join(arg.sep);
            },
            split: function(arg) {
                return arg.str.split(arg.sep);
            },
            repeat: function(arg) {
                var result = "";
                for (var i = 0; i < arg.times; i++) {
                    result.concat(arg.str);
                }
                return result;
            },
            charAt: function(arg) {
                return arg.str.charAt(arg.index);
            },
            trim: function(str) {
                return str.trim();
            },
            replace: function(arg) {
                return arg.str.replace(arg.substr, arg.to);
            },
            normalize: function(str) {
                var temp = str.replace(/</g, "&lt;");
                temp = temp.replace(/\"/g, "\\\"");
                return temp.replace(/\'/g, "\\\'");
            }
        },
        xml: {
            parseText: function(text) {
                var parser;
                var xmlDoc;
                if (window.DOMParser) {
                    parser = new DOMParser();
                    xmlDoc = parser.parseFromString(text, "text/xml");
                } else {
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = false;
                    xmlDoc.loadXML(text);
                }
                return xmlDoc.children[0];
            },
            getChildren: function(node) {
                return getChildren(node);
            },
            findChild: function(arg) {
                return findChild(arg.node, arg.name);
            },
            findChildren: function(arg) {
                return findChildren(arg.node, arg.name);
            },
            getName: function(node) {
                return node.nodeName;
            },
            getValue: function(node) {
                return node.nodeValue;
            },
            getAttribute: function(arg) {
                return arg.node.getAttribute(arg.name);
            }
        },
    };

    /*
        Metatype for core
    */
    var coremathtype = {
        all: [{
            prop: {
                name: "sin",
                type: {
                    func: {
                        arg: {
                            number: null
                        },
                        ret: {
                            number: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "cos",
                type: {
                    func: {
                        arg: {
                            number: null
                        },
                        ret: {
                            number: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "exp",
                type: {
                    func: {
                        arg: {
                            number: null
                        },
                        ret: {
                            number: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "log",
                type: {
                    func: {
                        arg: {
                            number: null
                        },
                        ret: {
                            number: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "trunc",
                type: {
                    func: {
                        arg: {
                            number: null
                        },
                        ret: {
                            integer: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "NaN",
                type: {
                    func: {
                        arg: {
                            number: null
                        },
                        ret: {
                            none: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "finite",
                type: {
                    func: {
                        arg: {
                            number: null
                        },
                        ret: {
                            none: null
                        }
                    }
                }
            }
        }]
    };

    var coretimetype = {
        all: [{
            prop: {
                name: "msec",
                type: {
                    interval: null
                }
            }
        }, {
            prop: {
                name: "sec",
                type: {
                    interval: null
                }
            }
        }, {
            prop: {
                name: "date",
                type: {
                    func: {
                        arg: {
                            all: [{
                                prop: {
                                    name: "year",
                                    type: {
                                        integer: null
                                    }
                                }
                            }, {
                                prop: {
                                    name: "month",
                                    type: {
                                        integer: null
                                    }
                                }
                            }, {
                                prop: {
                                    name: "day",
                                    type: {
                                        integer: null
                                    }
                                }
                            }]
                        },
                        ret: {
                            time: null
                        }
                    }
                }
            }
        }]
    };

    var coreformattype = {
        all: [{
            prop: {
                name: "intToStr",
                type: {
                    func: {
                        arg: {
                            integer: null
                        },
                        ret: {
                            string: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "numToStr",
                type: {
                    func: {
                        arg: {
                            number: null
                        },
                        ret: {
                            string: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "dateToStr",
                type: {
                    func: {
                        arg: {
                            time: null
                        },
                        ret: {
                            string: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "strToInt",
                type: {
                    func: {
                        arg: {
                            string: null
                        },
                        ret: {
                            integer: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "strToNum",
                type: {
                    func: {
                        arg: {
                            string: null
                        },
                        ret: {
                            number: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "formatNum",
                type: {
                    func: {
                        arg: {
                            all: [{
                                prop: {
                                    name: "num",
                                    type: {
                                        number: null
                                    }
                                }
                            }, {
                                any: [{
                                    prop: {
                                        name: "prec",
                                        type: {
                                            integer: null
                                        }
                                    }
                                }, {
                                    prop: {
                                        name: "exp",
                                        type: {
                                            integer: null
                                        }
                                    }
                                }, {
                                    prop: {
                                        name: "dec",
                                        type: {
                                            integer: null
                                        }
                                    }
                                }]
                            }]
                        },
                        ret: {
                            string: null
                        }
                    }
                }
            }
        }]
    };

    var corestringtype = {
        all: [{
            prop: {
                name: "substr",
                type: {
                    func: {
                        arg: {
                            all: [{
                                prop: {
                                    name: "str",
                                    type: {
                                        string: null
                                    }
                                }
                            }, {
                                prop: {
                                    name: "start",
                                    type: {
                                        integer: null
                                    }
                                }
                            }, {
                                any: [{
                                    prop: {
                                        name: "end",
                                        type: {
                                            integer: null
                                        }
                                    }
                                }, {
                                    prop: {
                                        name: "length",
                                        type: {
                                            integer: null
                                        }
                                    }
                                }, {
                                    prop: {
                                        name: "rest",
                                        type: {
                                            none: null
                                        }
                                    }
                                }]
                            }]
                        },
                        ret: {
                            string: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "join",
                type: {
                    func: {
                        arg: {
                            all: [{
                                prop: {
                                    name: "parts",
                                    type: {
                                        array: {
                                            string: null
                                        }
                                    }
                                }
                            }, {
                                prop: {
                                    name: "sep",
                                    type: {
                                        string: null
                                    }
                                }
                            }]
                        },
                        ret: {
                            string: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "split",
                type: {
                    func: {
                        arg: {
                            all: [{
                                prop: {
                                    name: "str",
                                    type: {
                                        string: null
                                    }
                                }
                            }, {
                                prop: {
                                    name: "sep",
                                    type: {
                                        string: null
                                    }
                                }
                            }]
                        },
                        ret: {
                            array: {
                                string: null
                            }
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "length",
                type: {
                    func: {
                        arg: {
                            string: null
                        },
                        ret: {
                            integer: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "trim",
                type: {
                    func: {
                        arg: {
                            string: null
                        },
                        ret: {
                            string: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "repeat",
                type: {
                    func: {
                        arg: {
                            all: [{
                                prop: {
                                    name: "str",
                                    type: {
                                        string: null
                                    }
                                }
                            }, {
                                prop: {
                                    name: "times",
                                    type: {
                                        integer: null
                                    }
                                }
                            }]
                        },
                        ret: {
                            string: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "charAt",
                type: {
                    func: {
                        arg: {
                            all: [{
                                prop: {
                                    name: "str",
                                    type: {
                                        string: null
                                    }
                                }
                            }, {
                                prop: {
                                    name: "index",
                                    type: {
                                        integer: null
                                    }
                                }
                            }]
                        },
                        ret: {
                            string: null
                        }
                    }
                }
            }
        }]
    };

    var corexmltype = {};

    var coretype = {
        all: [{
            prop: {
                name: "appletclass",
                type: {
                    func: {
                        arg: {
                            string: null
                        },
                        ret: {
                            string: null
                        }
                    }
                }
            }
        }, {
            prop: {
                name: "nbsp",
                type: {
                    string: null
                }
            }
        }, {
            prop: {
                name: "br",
                type: {
                    string: null
                }
            }
        }, {
            prop: {
                name: "math",
                type: coremathtype
            }
        }, {
            prop: {
                name: "time",
                type: coretimetype
            }
        }, {
            prop: {
                name: "format",
                type: coreformattype
            }
        }, {
            prop: {
                name: "string",
                type: corestringtype
            }
        }, {
            prop: {
                name: "xml",
                type: corexmltype
            }

        }]
    };

    var resume;
    var pending = 0;

    /* 
        Run-time expression processing
     */

    function ExprEngine(actions) {

        function evalFormula(formula, context, output) {

            var scanner = /\s*(-?\d*\.\d+)|(-?\d+)|(\w+)|(\".*\")|('.*')|(`..`)|(#)|(@)|(\+)|(-)|(\*)|(\/)|(\.)|(\()|(\))|(\[)|(\])|(\{)|(\})|(:)|(,)|(<=?)|(\/?=)|(>=?)/g;
            var token = scanner.exec(formula);
            var result;
            var level = 0;

            function parseFormula() {
                if (parseSubexp()) {
                    if (parseSize()) {}
                    if (parseMult() || parseDiv()) {}
                    if (parsePlus() || parseMinus()) {}
                    if (parseRelation() || parseEqual()) {}
                    return true;
                } else if (parseString()) {
                    return true;
                } else if (parseNumber()) {
                    if (parseMult() || parseDiv()) {}
                    if (parsePlus() || parseMinus()) {}
                    if (parseRelation() || parseEqual()) {}
                    return true;
                } else if (parseObject()) {
                    return true;
                } else if (parseVar()) {
                    while (parseApply() || parseIndex() || parseDot() || parseAt()) {}
                    if (parseSize()) {}
                    if (parseMult() || parseDiv()) {}
                    if (parsePlus() || parseMinus()) {}
                    if (parseRelation() || parseEqual()) {}
                    return true;
                } else {
                    return false;
                }
            }

            function parseSubexp() {
                if (token !== null && token[0] === "(") {
                    level++;
                    token = scanner.exec(formula);
                    if (parseFormula()) {
                        if (token === null || token[0] !== ")") {
                            throw "Fail";
                        }
                        token = scanner.exec(formula);
                    } else {
                        throw "Fail";
                    }
                    level--;
                    return true;
                } else {
                    return false;
                }
            }

            function parseObject() {
                if (token !== null && token[0] === "{") {
                    var obj = {};
                    var prop;
                    level++;
                    token = scanner.exec(formula);
                    if (parseProp()) {
                        if (token === null || token[0] !== ":") {
                            throw "Fail";
                        }
                        prop = result;
                        token = scanner.exec(formula);
                        if (token !== null && (token[0] === "," || token[0] === "}")) {
                            obj[prop] = null;
                        } else if (parseFormula()) {
                            obj[prop] = result;
                        } else {
                            throw "Fail";
                        }
                        while (token !== null && token[0] === ",") {
                            token = scanner.exec(formula);
                            if (parseProp()) {
                                if (token === null || token[0] !== ":") {
                                    throw "Fail";
                                }
                                prop = result;
                                token = scanner.exec(formula);
                                if (token !== null && (token[0] === "," || token[0] === "}")) {
                                    obj[prop] = null;
                                } else if (parseFormula()) {
                                    obj[prop] = result;
                                } else {
                                    throw "Fail";
                                }
                            } else {
                                throw "Fail";
                            }
                        }
                    }
                    if (token === null || token[0] !== "}") {
                        throw "Fail";
                    }
                    token = scanner.exec(formula);
                    level--;
                    result = obj;
                    return true;
                } else {
                    return false;
                }
            }

            function parseApply() {
                var prev;
                var args = [];
                if (token !== null && token[0] === "(") {
                    level++;
                    prev = result;
                    token = scanner.exec(formula);
                    if (token !== null && token[0] !== ")") {
                        if (parseFormula()) {
                            args[args.length] = result;
                            //token = scanner.exec(formula);
                            while (token !== null && token[0] === ",") {
                                token = scanner.exec(formula);
                                if (parseFormula()) {
                                    args[args.length] = result;
                                    //token = scanner.exec(formula);
                                } else {
                                    throw "Fail";
                                }
                            }
                        } else {
                            throw "Fail";
                        }
                    }
                    if (args.length === 0) {
                        result = prev();
                    } else if (args.length == 1) {
                        result = prev(args[0]);
                    } else {
                        throw "Fail";
                    }
                    if (token === null || token[0] !== ")") {
                        throw "Fail";
                    }
                    token = scanner.exec(formula);
                    level--;
                    return true;
                } else {
                    return false;
                }
            }

            function parseSize() {
                var prev;
                var args = [];
                if (token !== null && token[0] === "#") {
                    prev = result;
                    result = prev.length;
                    token = scanner.exec(formula);
                    return true;
                } else {
                    return false;
                }
            }

            function parseIndex() {
                var prev;
                var args = [];
                if (token !== null && token[0] === "[") {
                    level++;
                    prev = result;
                    token = scanner.exec(formula);
                    if (parseFormula()) {
                        result = prev[result];
                    } else {
                        throw "Fail";
                    }
                    if (token === null || token[0] !== "]") {
                        throw "Fail";
                    }
                    token = scanner.exec(formula);
                    level--;
                    return true;
                } else {
                    return false;
                }
            }

            function parseDot() {
                var prev;
                if (token !== null && token[0] === ".") {
                    prev = result;
                    token = scanner.exec(formula);
                    if (parseProp()) {
                        if (prev.hasOwnProperty(result)) {
                            result = prev[result];
                        } else {
                            throw "Fail";
                        }
                    } else {
                        throw "Fail";
                    }
                    return true;
                } else {
                    return false;
                }
            }

            function parseAt() {
                var prev;
                if (token !== null && token[0] === "@") {
                    prev = result;
                    token = scanner.exec(formula);
                    if (parseFormula() && prev.hasOwnProperty(result)) {
                        result = prev[result];
                    } else {
                        throw "Fail";
                    }
                    return true;
                } else {
                    return false;
                }
            }

            function parsePlus() {
                var prev;
                if (token !== null && token[0] === "+") {
                    prev = result;
                    token = scanner.exec(formula);
                    if (parseFormula()) {
                        result += prev;
                    } else {
                        throw "Fail";
                    }
                    return true;
                } else {
                    return false;
                }
            }

            function parseMinus() {
                var prev;
                if (token !== null && token[0] === "-") {
                    prev = result;
                    token = scanner.exec(formula);
                    if (parseFormula()) {
                        result = prev - result;
                    } else {
                        throw "Fail";
                    }
                    return true;
                } else {
                    return false;
                }
            }

            function parseMult() {
                var prev;
                if (token !== null && token[0] === "*") {
                    prev = result;
                    token = scanner.exec(formula);
                    if (parseFormula()) {
                        result *= prev;
                    } else {
                        throw "Fail";
                    }
                    return true;
                } else {
                    return false;
                }
            }

            function parseDiv() {
                var prev;
                if (token !== null && token[0] === "/") {
                    prev = result;
                    token = scanner.exec(formula);
                    if (parseFormula()) {
                        result = prev / result;
                    } else {
                        throw "Fail";
                    }
                    return true;
                } else {
                    return false;
                }
            }

            function parseRelation() {
                var prev;
                var rel;

                if (token !== null && token[0] === token[5]) {
                    prev = result;
                    rel = token[0];
                    token = scanner.exec(formula);
                    if (parseFormula()) {
                        switch (rel) {
                            case "'le'":
                                result = prev <= result;
                                break;
                            case "'lt'":
                                result = prev < result;
                                break;
                            case "'eq'":
                                result = prev == result;
                                break;
                            case "'ne'":
                                result = prev != result;
                                break;
                            case "'gt'":
                                result = prev > result;
                                break;
                            case "'ge'":
                                result = prev >= result;
                                break;
                            default:
                                throw "Invalid relation: " + token[0];
                        }
                    } else {
                        throw "Parse error";
                    }
                    return true;
                } else {
                    return false;
                }
            }

            function parseLess() {
                var prev;
                if (token !== null && token[0] === "<") {
                    prev = result;
                    token = scanner.exec(formula);
                    if (parseFormula()) {
                        result = prev < result;
                    } else {
                        throw "Fail";
                    }
                    return true;
                } else {
                    return false;
                }
            }

            function parseMore() {
                var prev;
                if (token !== null && token[0] === ">") {
                    prev = result;
                    token = scanner.exec(formula);
                    if (parseFormula()) {
                        result = prev > result;
                    } else {
                        throw "Fail";
                    }
                    return true;
                } else {
                    return false;
                }
            }

            function parseEqual() {
                var prev;
                if (token !== null && token[0] === "=") {
                    prev = result;
                    token = scanner.exec(formula);
                    if (parseFormula()) {
                        result = prev === result;
                    } else {
                        throw "Fail";
                    }
                    return true;
                } else {
                    return false;
                }
            }

            function parseProp() {
                if (token !== null && token[0] === token[3]) {
                    result = token[0];
                    token = scanner.exec(formula);
                    return true;
                } else {
                    return false;
                }
            }

            function parseVar() {
                var i;
                if (token !== null && token[0] === token[3]) {
                    result = context[token[0]];
                    token = scanner.exec(formula);
                    return true;
                } else {
                    return false;
                }
            }

            function parseNumber() {
                if (token !== null && (token[0] === token[1] || token[0] === token[2])) {
                    result = Number(token[0]);
                    token = scanner.exec(formula);
                    return true;
                } else {
                    return false;
                }
            }

            function parseString() {
                if (token !== null && (token[0] === token[4] || token[0] === token[5])) {
                    result = token[0].substr(1, token[0].length - 2);
                    token = scanner.exec(formula);
                    return true;
                } else {
                    return false;
                }
            }

            // console.log("evalFormula " + formula);

            try {
                if (parseFormula()) {
                    if (result === true || result === false) { //Fabsite has no booleans
                        if (result) {
                            console.log(formula + " -> success");
                        } else {
                            console.log(formula + " -> failed");
                        }
                        return result;
                    }
                    output.result = result;
                    console.log(formula + " -> " + format(result));
                    return true;
                } else {
                    console.log(formula + " -> failed");
                    return false;
                }
            } catch (error) {
                console.log(formula + " -> failed");
                return false;
            }
        }

        function cast(value, type) {
            var name;
            var i;
            var l;
            var array = [];
            var obj = {};

            if (type.hasOwnProperty("integer") || type.hasOwnProperty("number")) {
                if (typeof value === "number") {
                    return value;
                } else {
                    throw "Fail";
                }
            } else if (type.hasOwnProperty("time")) {
                if (typeof value === "number") {
                    return value;
                } else if (typeof value === "object" && value.hasOwnProperty("getTime")) {
                    return value.getTime();
                } else {
                    throw "Fail";
                }
            } else if (type.hasOwnProperty("string")) {
                if (typeof value === "string") {
                    return value;
                } else {
                    throw "Fail";
                }
            } else if (type.hasOwnProperty("array")) {
                if (typeof value === "object" && value.hasOwnProperty("length")) {
                    l = value.length;
                    array.length = l;
                    for (i = 0; i < l; i++) {
                        array[i] = cast(value[i], type.array);
                    }
                    return array;
                } else {
                    throw "Fail";
                }
            } else if (type.hasOwnProperty("prop")) {
                name = type.prop.name;
                if (typeof value === "object" && value.hasOwnProperty(name)) {
                    return value[name];
                } else {
                    throw "Fail";
                }
            } else if (type.hasOwnProperty("all")) {
                l = type.all.length;
                for (i = 0; i < l; i++) {
                    if (type.all[i].hasOwnProperty("prop") && value.hasOwnProperty(type.all[i].prop.name)) {
                        obj[type.all[i].prop.name] = cast(value[type.all[i].prop.name], type.all[i].prop.type);
                    } else {
                        throw "Fail";
                    }
                }
                return obj;
            } else if (type.hasOwnProperty("any")) {
                l = type.any.length;
                for (i = 0; i < l; i++) {
                    if (type.any[i].hasOwnProperty("prop") && value.hasOwnProperty(type.any[i].prop.name)) {
                        try {
                            obj[type.any[i].prop.name] = cast(value[type.any[i].prop.name], type.any[i].prop.type);
                            return obj;
                        } catch (error) {}
                    }
                }
                throw "Fail";
            }
        }

        function evalExpr(expr, context, output) {
            var stmt;
            var where;
            var i;
            var j;
            var l;
            var result = {};
            var context2 = {};
            var output2 = {};
            var prop;
            var array = [];
            var array2 = [];
            var obj = {};
            var parser;
            var xmlDoc;
            var temp;
            var temp2;
            var temp3;
            var action;
            var item;
            var idxname;
            var arg;
            var argname;
            var ret;
            var frmpat = /\[%(.*?)%\]/g;
            var info;

            var frmval = function(match, p1) {
                if (evalFormula(p1, context, output)) {
                    return output.result;
                } else {
                    throw "Fail";
                }
            };

            try {
                if (expr.nodeType == 3) {
                    return evalFormula(expr.nodeValue.trim(), context, output);
                }

                // console.log("evalExpr " + expr.nodeName);

                switch (expr.nodeName) {
                    case "invalid":
                        output.result = undefined;
                        return false;
                    case "text":
                        temp = expr.innerHTML.trim();
                        output.result = temp.replace(frmpat, frmval);
                        console.log(temp + " -> " + format(output.result));
                        break;
                    case "eval":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            if (window.DOMParser) {
                                parser = new DOMParser();
                                xmlDoc = parser.parseFromString(result.result, "text/xml");
                            } else {
                                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                                xmlDoc.async = false;
                                xmlDoc.loadXML(result.result);
                            }
                            return evalExpr(xmlDoc.children[0], context, output);
                        } else {
                            output.result = undefined;
                            return false;
                        }
                        break;
                    case "cast":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            temp = findChild(expr, "to");
                            info = analyzeType(first(temp), {
                                types: [],
                                vars: []
                            });
                            output.result = cast(result.result, info.type);
                            console.log("cast : " + format(output.result));
                        } else {
                            output.result = undefined;
                            console.log("cast : failed");
                            return false;
                        }
                        break;
                    case "list":
                        temp = getChildren(expr);
                        array.length = temp.length;
                        for (i = 0; i < array.length; i++) {
                            if (evalExpr(temp[i], context, result)) {
                                array[i] = result.result;
                                console.log("list : " + format(result.result));
                            } else {
                                output.result = undefined;
                                console.log("list : failed");
                                return false;
                            }
                        }
                        output.result = array;
                        break;
                    case "entries":
                        temp = findChildren(expr, "entry");
                        for (i = 0; i < temp.length; i++) {
                            temp2 = firstExpr(temp[i]);
                            if (evalExpr(temp2, context, result)) {
                                temp2 = result.result;
                                temp3 = firstExpr(findChild(temp[i], "value"));
                                if (evalExpr(temp3, context, result)) {
                                    obj[temp2] = result.result;
                                } else {
                                    output.result = undefined;
                                    console.log("entries : failed");
                                    return false;
                                }
                            } else {
                                output.result = undefined;
                                console.log("entries : failed");
                                return false;
                            }
                        }
                        output.result = obj;
                        console.log("entries : " + format(obj));
                        break;
                    case "array":
                        temp = firstExpr(findChild(expr, "size"));
                        if (evalExpr(temp, context, result)) {
                            array.length = result.result;
                            item = findChild(expr, "item");
                            idxname = item.getAttribute("index");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            for (i = 0; i < array.length; i++) {
                                context2[idxname] = i;
                                if (evalExpr(firstExpr(item), context2, result)) {
                                    array[i] = result.result;
                                } else {
                                    output.result = undefined;
                                    console.log("array : failed");
                                    return false;
                                }
                            }
                        } else {
                            output.result = undefined;
                            console.log("array : failed");
                            return false;
                        }
                        output.result = array;
                        console.log("array : " + format(array));
                        break;
                    case "dictionary":
                        temp = firstExpr(findChild(expr, "size"));
                        if (evalExpr(temp, context, result)) {
                            temp = result.result;
                            item = findChild(expr, "entry");
                            idxname = item.getAttribute("index");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            for (i = 0; i < temp; i++) {
                                context2[idxname] = i;
                                if (evalExpr(firstExpr(item), context2, result)) {
                                    temp2 = result.result; //key
                                    temp3 = firstExpr(findChild(item, "value"));
                                    if (evalExpr(temp3, context2, result)) {
                                        obj[temp2] = result.result; //value
                                    } else {
                                        output.result = undefined;
                                        console.log("dictionary : failed");
                                        return false;
                                    }
                                } else {
                                    output.result = undefined;
                                    console.log("dictionary : failed");
                                    return false;
                                }
                            }
                        } else {
                            output.result = undefined;
                            console.log("dictionary : failed");
                            return false;
                        }
                        output.result = obj;
                        console.log("dictionary : " + format(obj));
                        break;
                    case "keys":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            for (prop in result.result) {
                                array.push(prop);
                            }
                            output.result = array;
                            console.log("keys : " + format(array));
                        } else {
                            console.log("keys : failed");
                            return false;
                        }
                        break;
                    case "range":
                        temp = firstExpr(findChild(expr, "from"));
                        if (evalExpr(temp, context, result)) {
                            temp = result.result;
                            temp2 = firstExpr(findChild(expr, "to"));
                            if (evalExpr(temp2, context, result) && result.result >= temp) {
                                temp2 = result.result;
                                array.length = temp2 - temp;
                                for (i = temp; i < temp2; i++) {
                                    array[i - temp] = i;
                                }
                            } else {
                                output.result = undefined;
                                return false;
                            }
                        } else {
                            output.result = undefined;
                            return false;
                        }
                        output.result = array;
                        break;
                    case "noitems":
                        output.result = [];
                        break;
                    case "noentries":
                        output.result = {};
                        break;
                    case "join":
                        temp = getChildren(expr);
                        l = 0;
                        for (i = 0; i < temp.length; i++) {
                            if (evalExpr(temp[i], context, output)) {
                                temp[i] = output.result;
                                l += output.result.length;
                            }
                        }
                        array.length = l;
                        l = 0;
                        for (i = 0; i < temp.length; i++) {
                            for (j = 0; j < temp[i].length; j++) {
                                array[l] = temp[i][j];
                                l++;
                            }
                        }
                        output.result = array;
                        break;
                    case "merge":
                        temp = getChildren(expr);
                        l = 0;
                        for (i = 0; i < temp.length; i++) {
                            if (evalExpr(temp[i], context, output)) {
                                for (prop in output.result) {
                                    obj[prop] = output.result[prop];
                                }
                            }
                        }
                        output.result = obj;
                        break;
                    case "calc":
                        where = getChildren(expr);
                        for (prop in context) {
                            context2[prop] = context[prop];
                        }
                        for (i = where.length - 1; i > 0; i--) {
                            stmt = where[i].children[0];
                            if (evalStmt(stmt, context2, result)) {
                                for (prop in result) {
                                    context2[prop] = result[prop];
                                }
                            } else {
                                output.result = undefined;
                                return false;
                            }
                        }
                        return evalExpr(where[0], context2, output);
                    case "func":
                        arg = findChild(expr, "arg");
                        argname = arg.getAttribute("name");
                        ret = firstExpr(findChild(expr, "return"));
                        for (prop in context) {
                            context2[prop] = context[prop];
                        }
                        output.result = function(x) {
                            var funcout = {};
                            context2[argname] = x;
                            if (evalExpr(ret, context2, funcout)) {
                                return funcout.result;
                            } else {
                                throw "Fail";
                            }
                        };
                        break;
                    case "wrap":
                        for (prop in context) {
                            context2[prop] = context[prop];
                        }
                        for (i = 0; i < stmt.childNodes.length; i++) {
                            if (stmt.childNodes[i].nodeType != 3) {
                                if (evalStmt(stmt.childNodes[i], context2, result)) {
                                    for (prop in result) {
                                        context2[prop] = result[prop];
                                        output2[prop] = result[prop];
                                    }
                                    result = {};
                                } else {
                                    return false;
                                }
                            }
                        }
                        output.result = output2;
                        break;
                    case "find":
                        temp = firstExpr(findChild(expr, "in"));
                        if (evalExpr(temp, context, output)) {
                            array = output.result;
                            temp = findChild(expr, "item");
                            argname = temp.getAttribute("name");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            for (i = 0; i < array.length; i++) {
                                context2[argname] = array[i];
                                if (evalStmt(temp.children[0], context2, output2)) {
                                    output.result = array[i];
                                    console.log("find : " + format(output.result));
                                    return true;
                                }
                            }
                            console.log("find : failed");
                            return false;
                        }
                        console.log("find : failed");
                        return false;
                    case "select":
                        temp = firstExpr(findChild(expr, "in"));
                        if (evalExpr(temp, context, output)) {
                            array = output.result;
                            temp = findChild(expr, "item");
                            argname = temp.getAttribute("name");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            for (i = 0; i < array.length; i++) {
                                context2[argname] = array[i];
                                if (evalStmt(temp.children[0], context2, output2)) {
                                    array2.push(array[i]);
                                }
                            }
                            output.result = array2;
                            console.log("select : " + array2.length);
                            return true;
                        }
                        return false;
                    case "count":
                        temp = firstExpr(findChild(expr, "in"));
                        if (evalExpr(temp, context, output)) {
                            array = output.result;
                            temp = findChild(expr, "item");
                            argname = temp.getAttribute("name");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            var count = 0;
                            for (i = 0; i < array.length; i++) {
                                context2[argname] = array[i];
                                if (evalStmt(temp.children[0], context2, output2)) {
                                    count++;
                                }
                            }
                            output.result = count;
                            console.log("count : " + count);
                            return true;
                        }
                        return false;
                    case "redraw":
                        output.result = actions.redraw();
                        break;
                    case "delay":
                        temp = getChildren(expr);
                        if (evalExpr(temp[0], context, result)) {
                            action = result.result;
                            if (evalExpr(firstExpr(temp[1]), context, result)) {
                                output.result = actions.delay(action, result.result);
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                        break;
                    case "input":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            output.result = actions.input(result.result);
                        } else {
                            return false;
                        }
                        break;
                    case "output":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            output.result = actions.output(result.result);
                        } else {
                            return false;
                        }
                        break;
                    default:
                        return false;
                }
                return true;
            } catch (error) {
                console.log(expr.nodeName + " -> failed");
                return false;
            }
        }

        function evalStmt(stmt, context, output) {
            var name;
            var i;
            var prop;
            var context2 = {};
            var stmt2;
            var result = {};
            var temp;

            function list() {
                var result = "";
                for (var v in output) {
                    result += v + " ";
                }
                return result;
            }
            try {
                // console.log("evalStmt " + stmt.nodeName);

                switch (stmt.nodeName) {
                    case "is":
                        if (evalExpr(firstExpr(stmt), context, result)) {
                            console.log("is : success");
                        } else {
                            console.log("is : failed");
                            return false;
                        }
                        break;
                    case "not":
                        temp = evalStmt(stmt.children[0], context, result);
                        if (temp) {
                            console.log("not : failed");
                            return false;
                        } else {
                            console.log("not : success");
                            return true;
                        }
                        break;
                    case "def":
                        name = stmt.getAttribute("var");
                        if (evalExpr(firstExpr(stmt), context, result)) {
                            output[name] = result.result;
                            console.log("def " + name + " : " + format(result.result));
                        } else {
                            console.log("def " + name + " : failed");
                            return false;
                        }
                        break;
                    case "all":
                        for (prop in context) {
                            context2[prop] = context[prop];
                        }
                        for (i = 0; i < stmt.children.length; i++) {
                            if (evalStmt(stmt.children[i], context2, result)) {
                                for (prop in result) {
                                    context2[prop] = result[prop];
                                    output[prop] = result[prop];
                                }
                                result = {};
                                console.log("all " + list() + ": success");
                            } else {
                                output = {};
                                console.log("all : failed");
                                return false;
                            }
                        }
                        break;
                    case "any":
                        for (i = 0; i < stmt.children.length; i++) {
                            if (evalStmt(stmt.children[i], context, result)) {
                                for (prop in result) {
                                    output[prop] = result[prop];
                                }
                                console.log("any " + list() + ": success");
                                return true;
                            }
                        }
                        console.log("any : failed");
                        return false;
                    case "unwrap":
                        if (evalExpr(firstExpr(stmt), context, result)) {
                            for (prop in result.result) {
                                output[prop] = result.result[prop];
                            }
                            console.log("unwrap " + list() + ": success");
                        } else {
                            console.log("unwrap : failed");
                        }
                        break;
                    default:
                        return false;
                }
                return true;
            } catch (error) {
                return false;
            }
        }

        this.evalExpr = evalExpr;
        this.evalStmt = evalStmt;
    }

    /*
     * Analyzer support
     */

    function analyzeApplet(code, context) {
        var result = {
            name: "unknown",
            output: {
                type: {
                    other: null
                },
                errors: []
            },
            state: {
                name: "unknown",
                type: {
                    other: null
                },
                errors: []
            },
            content: {
                type: {
                    other: null
                },
                errors: []
            },
            init: {
                state: {
                    name: "unknown",
                    type: {
                        other: null
                    },
                    errors: []
                },
                actions: []
            },
            respond: {
                input: {
                    name: "unknown"
                },
                state: {
                    name: "unknown",
                    type: {
                        other: null
                    },
                    errors: []
                },
                actions: []
            },
            events: [],
            accept: [],
            errors: []
        };
        var name;
        var id;
        var type;
        var temp;
        var temp2;
        var temp3;
        var expr;
        var prop;
        var local = {
            vars: {},
            types: {}
        };
        var templocal;
        var i;

        for (prop in context.types) {
            local.types[prop] = context.types[prop];
        }
        for (prop in context.vars) {
            local.vars[prop] = context.vars[prop];
        }

        try {
            name = code.getAttribute("name");
            if (name === null || name === "") {
                throw "Applet name not specified";
            } else {
                result.name = name;
            }

            id = code.getAttribute("id");
            if (id !== null && id !== "") {
                result.id = id;
                local.vars[id] = {
                    string: null
                };
            }

            temp = findChildren(code, "output");
            if (temp.length > 0) {
                temp = getChildren(single(temp, "output type"));
                type = analyzeType(single(temp, "output type"), context);
                result.output = type;
                local.output = type.type;
                if (type.errors.length > 0) {
                    result.errors.push("Erroneous output type");
                }
            }

            temp = single(findChildren(code, "state"), "state");
            name = temp.getAttribute("name");
            if (name === null || name === "") {
                throw "Missing state name";
            } else {
                result.state.name = name;
            }
            temp = getChildren(temp);
            type = analyzeType(single(temp, "state"), context);
            if (type.errors.length > 0) {
                result.errors.push("Invalid state definition");
            }
            result.state.type = type.type;
            result.state.errors = type.errors;
            local.vars[result.state.name] = result.state.type;

            temp = single(findChildren(code, "content"), "content");
            temp = single(getChildren(temp), "content");
            result.content = analyzeExpr(temp, local);
            if (result.content.errors.length > 0) {
                result.errors.push("Invalid or missing content");
            }

            //analyze response now to find out input type
            temp = single(findChildren(code, "respond"), "response");
            temp2 = single(findChildren(temp, "input"), "input");
            name = temp2.getAttribute("name");
            if (name === null || name === "") {
                throw "Response input name not specified";
            } else {
                result.respond.input.name = name;
            }
            temp2 = single(getChildren(temp2), "response input type");
            type = analyzeType(temp2, context);
            local.vars[name] = type.type;
            local.input = type.type;
            if (type.errors.length > 0) {
                result.errors.push("Invalid response state type");
            }
            result.respond.input.type = type.type;
            result.respond.input.errors = type.errors;

            local.vars[result.respond.input.name] = result.respond.input.type;

            temp2 = single(findChildren(temp, "state"), "response state");
            temp2 = single(getChildren(temp2), "response state");
            result.respond.state = analyzeExpr(temp2, local);
            if (!covariant(result.respond.state.type, result.state.type)) {
                result.errors.push("Response state does not match state type");
            }

            temp2 = single(findChildren(temp, "actions"), "response action list");
            temp2 = getChildren(temp2);
            for (i = 0; i < temp2.length; i++) {
                result.respond.actions.push(analyzeExpr(temp2[i], local));
                if (!covariant(result.respond.actions[i].type, {
                    action: null
                })) {
                    result.errors.push("Expression of invalid type in action list");
                }
            }

            temp = single(findChildren(code, "init"), "initialization");

            temp2 = single(findChildren(temp, "state"));
            temp2 = single(getChildren(temp2));
            result.init.state = analyzeExpr(temp2, local);
            if (!covariant(result.init.state.type, result.state.type)) {
                result.errors.push("Initial state does not match state type");
            }

            temp2 = single(findChildren(temp, "actions"), "action list");
            temp2 = getChildren(temp2);
            for (i = 0; i < temp2.length; i++) {
                result.init.actions.push(analyzeExpr(temp2[i], local));
                if (!covariant(result.init.actions[i].type, {
                    action: null
                })) {
                    result.errors.push("Expression of invalid type in action list");
                }
            }
        } catch (error) {
            result.errors.push(error);
        }

        return result;

    }

    function analyzeFormula(formula, context) {

        var scanner = /\s*(-?\d*\.\d+)|(-?\d+)|(\w+)|(\".*\")|('.*')|(`.*`)|(#)|(@)|(\+)|(-)|(\*)|(\/)|(\.)|(\()|(\))|(\[)|(\])|(\{)|(\})|(:)|(,)|(<=?)|(\/?=)|(>=?)/g;
        var token = scanner.exec(formula);
        var result = {
            none: null
        };
        var level = 0;

        function parseFormula() {
            if (parseSubexp()) {
                if (parseSize()) {}
                if (parseMult() || parseDiv()) {}
                if (parsePlus() || parseMinus()) {}
                if (parseRelation()) {}
                return true;
            } else if (parseString()) {
                return true;
            } else if (parseNumber()) {
                if (parseMult() || parseDiv()) {}
                if (parsePlus() || parseMinus()) {}
                if (parseRelation()) {}
                return true;
            } else if (parseObject()) {
                return true;
            } else if (parseVar()) {
                while (parseApply() || parseIndex() || parseDot()) {}
                if (parseSize()) {}
                if (parseMult() || parseDiv()) {}
                if (parsePlus() || parseMinus()) {}
                if (parseRelation()) {}
                return true;
            } else {
                return false;
            }
        }

        function parseSubexp() {
            if (token !== null && token[0] === "(") {
                level++;
                token = scanner.exec(formula);
                if (parseFormula()) {
                    if (token === null || token[0] !== ")") {
                        throw "Right parenthesis missing";
                    }
                    token = scanner.exec(formula);
                } else {
                    throw "Parse error";
                }
                level--;
                return true;
            } else {
                return false;
            }
        }

        function parseObject() {
            if (token !== null && token[0] === "{") {
                var obj = {
                    all: []
                };
                var prop;

                level++;
                token = scanner.exec(formula);
                if (parseProp()) {
                    if (token === null || token[0] !== ":") {
                        throw "Colon is missing";
                    }
                    prop = result;
                    token = scanner.exec(formula);
                    if (token !== null && (token[0] === "," || token[0] === "}")) {
                        obj.all.push({
                            prop: {
                                name: prop,
                                type: {
                                    none: null
                                }
                            }
                        });
                    } else if (parseFormula()) {
                        obj.all.push({
                            prop: {
                                name: prop,
                                type: result
                            }
                        });
                    } else {
                        throw "Invalid property";
                    }
                    while (token !== null && token[0] === ",") {
                        token = scanner.exec(formula);
                        if (parseProp()) {
                            if (token === null || token[0] !== ":") {
                                throw "Colon is missing";
                            }
                            prop = result;
                            token = scanner.exec(formula);
                            if (token !== null && (token[0] === "," || token[0] === "}")) {
                                obj.all.push({
                                    prop: {
                                        name: prop,
                                        type: {
                                            none: null
                                        }
                                    }
                                });
                            } else if (parseFormula()) {
                                obj.all.push({
                                    prop: {
                                        name: prop,
                                        type: result
                                    }
                                });
                            } else {
                                throw "Invalid property";
                            }
                        } else {
                            throw "Invalid property";
                        }
                    }
                }
                if (token === null || token[0] !== "}") {
                    throw "No closing bracket";
                }
                token = scanner.exec(formula);
                level--;
                if (obj.all.length === 1) {
                    result = obj.all[0];
                } else {
                    result = obj;
                }
                return true;
            } else {
                return false;
            }
        }

        function parseApply() {
            var prev;
            var arg;

            if (token !== null && token[0] === "(") {
                level++;
                prev = result;
                token = scanner.exec(formula);
                if (token !== null && token[0] !== ")") {
                    if (parseFormula()) {
                        arg = result;
                    } else {
                        throw "Invalid argument";
                    }
                } else {
                    throw "Argument is missing";
                }
                if (!prev.hasOwnProperty("func")) {
                    throw typeStr(prev) + " is not a function";
                }
                if (!covariant(arg, prev.func.arg)) {
                    throw typeStr(arg) + " is not compatible with " + typeStr(prev.func.arg);
                }
                result = prev.func.ret;
                if (token === null || token[0] !== ")") {
                    throw "No closing parenthesis";
                }
                token = scanner.exec(formula);
                level--;
                return true;
            } else {
                return false;
            }
        }

        function parseSize() {
            var prev;

            if (token !== null && token[0] === "#") {
                prev = result;
                if (!prev.hasOwnProperty("array")) {
                    throw typeStr(prev) + " is not an array";
                }
                result = {
                    integer: null
                };
                token = scanner.exec(formula);
                return true;
            } else {
                return false;
            }
        }

        function parseIndex() {
            var prev;

            if (token !== null && token[0] === "[") {
                level++;
                prev = result;
                if (!prev.hasOwnProperty("array")) {
                    throw typeStr(prev) + " is not an array";
                }
                token = scanner.exec(formula);
                if (parseFormula()) {
                    if (!prev.hasOwnProperty("integer")) {
                        throw "Index is not an integer";
                    }
                    result = prev.array;
                } else {
                    throw "Invalid index";
                }
                if (token === null || token[0] !== "]") {
                    throw "No closing bracket";
                }
                token = scanner.exec(formula);
                level--;
                return true;
            } else {
                return false;
            }
        }

        function parseDot() {
            var prev;
            var prop = {};

            if (token !== null && token[0] === ".") {
                prev = result;
                if (!isObjType(prev)) {
                    throw typeStr(prev) + " is not an object type";
                }
                token = scanner.exec(formula);
                if (parseProp()) {
                    if (findProp(prev, result, prop)) {
                        result = {
                            prop: prop
                        };
                    } else {
                        throw "Type " + typeStr(prev) + " does not contain property <code>" + result + "</code>";
                    }
                } else {
                    throw "Property name is invalid or missing";
                }
                return true;
            } else {
                return false;
            }
        }

        function parseAt() {
            var prev;
            var prop = {};

            if (token !== null && token[0] === "@") {
                prev = result;
                if (!prev.hasOwnProperty("dictionary")) {
                    throw typeStr(prev) + " is not a dictionary";
                }
                token = scanner.exec(formula);
                if (parseFormula()) {
                    if (!prev.hasOwnProperty("string")) {
                        throw "Key is not a string";
                    }
                    result = prev.array;
                } else {
                    throw "Property name is invalid or missing";
                }
                return true;
            } else {
                return false;
            }
        }

        function parsePlus() {
            var prev;

            if (token !== null && token[0] === "+") {
                prev = result;
                token = scanner.exec(formula);
                if (parseFormula()) {
                    if (prev.hasOwnProperty("integer") && result.hasOwnProperty("integer")) {
                        result = {
                            integer: null
                        };
                    } else if ((prev.hasOwnProperty("integer") || prev.hasOwnProperty("number")) && (result.hasOwnProperty("integer") || result.hasOwnProperty("number"))) {
                        result = {
                            number: null
                        };
                    } else if (prev.hasOwnProperty("interval") && result.hasOwnProperty("interval")) {
                        result = {
                            interval: null
                        };
                    } else if ((prev.hasOwnProperty("time") && result.hasOwnProperty("interval")) || (prev.hasOwnProperty("interval") && result.hasOwnProperty("time"))) {
                        result = {
                            time: null
                        };
                    } else {
                        throw "Cannot add " + typeStr(prev) + " and " + typeStr(result);
                    }
                } else {
                    throw "Parse error";
                }
                return true;
            } else {
                return false;
            }
        }

        function parseMinus() {
            var prev;

            if (token !== null && token[0] === "-") {
                prev = result;
                token = scanner.exec(formula);
                if (parseFormula()) {
                    if (prev.hasOwnProperty("integer") && result.hasOwnProperty("integer")) {
                        result = {
                            integer: null
                        };
                    } else if ((prev.hasOwnProperty("integer") || prev.hasOwnProperty("number")) && (result.hasOwnProperty("integer") || result.hasOwnProperty("number"))) {
                        result = {
                            number: null
                        };
                    } else if (prev.hasOwnProperty("interval") && result.hasOwnProperty("interval")) {
                        result = {
                            interval: null
                        };
                    } else if (prev.hasOwnProperty("time") && result.hasOwnProperty("interval")) {
                        result = {
                            time: null
                        };
                    } else {
                        throw "Cannot subtract " + typeStr(result) + " from " + typeStr(prev);
                    }
                } else {
                    throw "Parse error";
                }
                return true;
            } else {
                return false;
            }
        }

        function parseMult() {
            var prev;

            if (token !== null && token[0] === "*") {
                prev = result;
                token = scanner.exec(formula);
                if (parseFormula()) {
                    if (prev.hasOwnProperty("integer") && result.hasOwnProperty("integer")) {
                        result = {
                            integer: null
                        };
                    } else if ((prev.hasOwnProperty("integer") || prev.hasOwnProperty("number")) && (result.hasOwnProperty("integer") || result.hasOwnProperty("number"))) {
                        result = {
                            number: null
                        };
                    } else if ((prev.hasOwnProperty("interval") && (result.hasOwnProperty("integer") || result.hasOwnProperty("number"))) || (result.hasOwnProperty("interval") && (prev.hasOwnProperty("integer") || prev.hasOwnProperty("number")))) {
                        result = {
                            interval: null
                        };
                    } else {
                        throw "Cannot multiply " + typeStr(prev) + " by " + typeStr(result);
                    }
                } else {
                    throw "Parse error";
                }
                return true;
            } else {
                return false;
            }
        }

        function parseDiv() {
            var prev;

            if (token !== null && token[0] === "/") {
                prev = result;
                token = scanner.exec(formula);
                if (parseFormula()) {
                    if ((prev.hasOwnProperty("integer") || prev.hasOwnProperty("number")) && (result.hasOwnProperty("integer") || result.hasOwnProperty("number"))) {
                        result = {
                            number: null
                        };
                    } else if (prev.hasOwnProperty("interval") && (result.hasOwnProperty("integer") || result.hasOwnProperty("number"))) {
                        result = {
                            interval: null
                        };
                    } else {
                        throw "Cannot divide " + typeStr(prev) + " by " + typeStr(result);
                    }
                } else {
                    throw "Parse error";
                }
                return true;
            } else {
                return false;
            }
        }

        function parseRelation() {
            var prev;

            function both(name) {
                return prev.hasOwnProperty(name) && result.hasOwnProperty(name);
            }

            if (token !== null && (token[0] === token[5] || token[0] === "=")) {
                prev = result;
                token = scanner.exec(formula);
                if (!(token[0] === "'lt'" || token[0] === "'le'" || token[0] === "'eq'" || token[0] === "'ne'" || token[0] === "'ge'" || token[0] === "'gt'" || token[0] === "=")) {
                    throw "Invalid relation symbol";
                }
                if (parseFormula()) {
                    if (!((prev.hasOwnProperty("integer") || prev.hasOwnProperty("number")) && (result.hasOwnProperty("integer") || result.hasOwnProperty("number")) || both("time") || both("interval") || both("string"))) {
                        throw "Cannot compare " + typeStr(prev) + " and " + typeStr(result);
                    }
                    result = {
                        none: null
                    };
                } else {
                    throw "Parse error";
                }
                return true;
            } else {
                return false;
            }
        }

        function parseProp() {
            if (token !== null && token[0] === token[3]) {
                result = token[0];
                token = scanner.exec(formula);
                return true;
            } else {
                return false;
            }
        }

        function parseVar() {
            if (token !== null && token[0] === token[3]) {
                if (context.vars.hasOwnProperty(token[0])) {
                    result = context.vars[token[0]];
                } else {
                    throw "Variable <code>" + token[0] + "</code> not found";
                }
                token = scanner.exec(formula);
                return true;
            } else {
                return false;
            }
        }

        function parseNumber() {
            if (token !== null && (token[0] === token[1] || token[0] === token[2])) {
                if (token[0] === token[1]) {
                    result = {
                        number: null
                    };
                } else {
                    result = {
                        integer: null
                    };
                }
                token = scanner.exec(formula);
                return true;
            } else {
                return false;
            }
        }

        function parseString() {
            if (token !== null && (token[0] === token[4] || token[0] === token[5])) {
                result = {
                    string: null
                };
                token = scanner.exec(formula);
                return true;
            } else {
                return false;
            }
        }

        if (parseFormula()) {
            return {
                type: result,
                errors: []
            };
        } else {
            return {
                type: {
                    none: null
                },
                errors: ["Invalid formula"]
            };
        }
    }

    function varpresent(name, context) {
        for (var i = 0; i < context.vars.length; i++) {
            if (context.vars[i].name === name) {
                return true;
            }
        }
        return false;
    }

    function analyzeExpr(expr, context) {
        var stmt;
        var where;
        var i;
        var j;
        var result = {
            // code: expr,
            type: {
                none: null
            },
            errors: []
        };
        var context2 = {
            types: {},
            vars: {}
        };
        var prop;
        var temp;
        var temp2;
        var idxname;
        var arg;
        var argname;
        var ret;
        var frmpat = /\[%(.*?)%\]/g;
        var type;
        var formula;
        var info;

        for (prop in context.types) {
            context2.types[prop] = context.types[prop];
        }
        for (prop in context.vars) {
            context2.vars[prop] = context.vars[prop];
        }

        try {
            if (expr.nodeType == 3) {
                formula = expr.nodeValue.trim();
                info = analyzeFormula(formula, context);
                if (info.errors.length > 0) {
                    result.errors.push("Invalid formula data type");
                }
                result.type = info.type;
                result.formula = formula;
                return result;
            }
            switch (expr.nodeName) {
                case "invalid":
                    info = analyzeType(expr.children[0], context);
                    if (info.errors.length > 0) {
                        result.errors.push("Invalid data type");
                    }
                    result.type = info.type;
                    result.invalid = null;
                    break;
                case "text":
                    temp = expr.innerHTML.trim();
                    formula = frmpat.exec(temp);
                    while (formula !== null) {
                        info = analyzeFormula(formula[1], context);
                        if (info.errors.length > 0) {
                            result.errors.push(info.errors[0]);
                        }
                        if (!(info.type.hasOwnProperty("string") || info.type.hasOwnProperty("integer") || info.type.hasOwnProperty("number"))) {
                            result.errors.push("Formula of type " + typeStr(info.type) + " cannot be inserted in text");
                        }
                        formula = frmpat.exec(temp);
                    }
                    result.type = {
                        string: null
                    };
                    result.text = temp;
                    break;
                case "eval":
                    temp = single(getChildren(temp), "in 'eval'");
                    info = analyzeExpr(temp, context);
                    if (info.errors.length > 0) {
                        result.errors.push("Invalid data type");
                    }
                    if (!info.type.hasOwnProperty("string")) {
                        result.errors.push("Expression type in 'eval' is " + typeStr(info.type) + "; must be string");
                    }
                    result.type = {
                        dynamic: null
                    };
                    result.eval = temp[0];
                    break;
                case "list":
                    temp = getChildren(expr);
                    if (temp.length > 0) {
                        info = analyzeExpr(temp[0], context);
                        result.type = {
                            array: info.type
                        };
                        result.list = [info];
                        for (i = 1; i < temp.length; i++) {
                            info = analyzeExpr(temp[i], context);
                            if (!covariant(info.type, result.type)) {
                                result.errors.push("Element type in 'list' is " + typeStr(info.type) + "; must be " + typeStr(result.type));
                            }
                            result.list[i] = info;
                        }
                    } else {
                        result.list = [];
                        result.errors.push("List must not be empty");
                    }
                    break;
                case "array":
                    temp = single(findChildren(expr, "size"), "'size' in 'array'");
                    temp = single(getChildren(temp), "array size");
                    info = analyzeExpr(temp, context);
                    if (!covariant(info.type, {
                        integer: null
                    })) {
                        result.errors.push("Array size must be integer");
                    }
                    temp = single(findChildren(expr, "item"), "item expression");
                    idxname = temp.getAttribute("index");
                    if (idxname === null || idxname === "") {
                        result.errors.push("Index attribute not specified");
                    }
                    temp = single(getChildren(temp), "item expression");
                    if (varpresent(idxname, context2)) {
                        result.errors.push("Variable " + idxname + " is already used");
                    }
                    context2.vars.push({
                        name: idxname,
                        type: {
                            integer: null
                        }
                    });
                    temp = analyzeExpr(temp, context2);
                    if (temp.errors.length > 0) {
                        result.errors.push("Invalid item expression");
                    }
                    result.type = {
                        array: temp.type
                    };
                    result.array = null;
                    break;
                case "noitems":
                    temp = single(getChildren(expr), "item type");
                    info = analyzeType(temp, context);
                    result.type = {
                        array: info.type
                    };
                    result.noitems = null;
                    break;
                case "noentries":
                    temp = single(getChildren(expr), "item type");
                    info = analyzeType(temp, context);
                    result.type = {
                        dictionary: info.type
                    };
                    result.noentries = null;
                    break;
                case "calc":
                    where = getChildren(expr);
                    for (i = where.length - 1; i > 0; i--) {
                        temp = getChildren(where[i]);
                        if (temp.length > 1) {
                            result.errors.push("More than one statement after <where>");
                        } else if (temp.length === 0) {
                            result.errors.push("Missing statement after <where>");
                        } else {
                            stmt = temp[0];
                            temp = analyzeStmt(stmt, context2);
                            for (j = 0; j < temp.vars.length; j++) {
                                if (varpresent(temp.vars[j].name, context2)) {
                                    result.errors.push("Variable " + temp.vars[j].name + " is already used");
                                }
                                context2.vars.push(temp.vars[j]);
                            }
                            if (temp.errors.length > 0) {
                                result.errors.push("Erroneous statement after <where>");
                            }
                        }
                    }
                    return analyzeExpr(where[0], context2);
                case "func":
                    arg = single(findChildren(expr, "arg"), "argument");
                    argname = arg.getAttribute("name");
                    if (argname === null || argname === "") {
                        throw "Missing argument name";
                    }
                    arg = single(getChildren(arg), "argument");
                    arg = analyzeType(arg, context);
                    if (arg.errors.length > 0) {
                        result.errors.push("Erroneous argument type");
                    }
                    ret = single(findChildren(expr, "return"), "result");
                    ret = single(getChildren(ret), "result");
                    if (varpresent(argname, context2)) {
                        result.errors.push("Variable " + argname + " is already used");
                    }
                    context2.vars.push({
                        name: argname,
                        type: arg.type
                    });
                    ret = analyzeExpr(ret, context2);
                    if (ret.errors.length > 0) {
                        result.errors.push("Erroneous return expression");
                    }
                    result.type = {
                        func: {
                            arg: arg.type,
                            ret: ret.type
                        }
                    };
                    result.func = {
                        arg: argname,
                        ret: ret
                    };
                    break;
                case "wrap":
                    temp = single(getChildren(stmt), "statement after 'wrap'");
                    result.type = {
                        all: []
                    };
                    temp2 = analyzeStmt(temp, context);
                    result.wrap = temp2;
                    if (temp2.errors.length > 0) {
                        result.errors.push("Erroneous statement after <wrap>");
                    }
                    for (i = 0; i < temp2.vars.length; i++) {
                        result.type.all.push({
                            prop: {
                                name: temp2.vars[i].name,
                                type: temp2.vars[i].type
                            }
                        });
                    }
                    break;
                case "find":
                    temp = single(findChildren(expr, "in"), "'in' clause");
                    temp = single(getChildren(temp), "'in' expression");
                    info = analyzeExpr(temp, context);
                    if (!info.type.hasOwnProperty("array")) {
                        result.errors.push("Expression after 'in' is not of an array type");
                    }
                    if (info.errors.length > 0) {
                        result.errors.push("Erroneous expression after 'in'");
                    }
                    temp2 = single(findChildren(expr, "item"), "'item' expression");
                    argname = temp.getAttribute("name");
                    temp2 = single(getChildren(temp2), "'item' expression");
                    context2.vars.push({
                        name: argname,
                        type: info.type.array
                    });
                    result.type = info.type.array;
                    info = analyzeStmt(temp2, context2);
                    if (info.errors.length > 0) {
                        result.errors.push("Erroneous statement after 'item'");
                    }
                    result.find = {
                        in_: temp,
                        item: {
                            name: argname,
                            stmt: info
                        }
                    };
                    break;
                case "select":
                    temp = single(findChildren(expr, "in"), "'in' clause");
                    temp = single(getChildren(temp), "'in' expression");
                    info = analyzeExpr(temp, context);
                    if (!info.type.hasOwnProperty("array")) {
                        result.errors.push("Expression after 'in' is not of an array type");
                    }
                    if (info.errors.length > 0) {
                        result.errors.push("Erroneous expression after 'in'");
                    }
                    temp = single(findChildren(expr, "item"), "'item' expression");
                    argname = temp.getAttribute("name");
                    temp = single(getChildren(temp), "'item' expression");
                    context2.vars.push({
                        name: argname,
                        type: info.type.array
                    });
                    result.type = info.type;
                    info = analyzeStmt(temp, context2);
                    if (info.errors.length > 0) {
                        result.errors.push("Erroneous statement after 'item'");
                    }
                    result.select = {
                        in_: temp,
                        item: {
                            name: argname,
                            stmt: info
                        }
                    };
                    break;
                case "count":
                    temp = single(findChildren(expr, "in"), "'in' clause");
                    temp = single(getChildren(temp), "'in' expression");
                    info = analyzeExpr(temp, context);
                    if (!info.type.hasOwnProperty("array")) {
                        result.errors.push("Expression after 'in' is not of an array type");
                    }
                    if (info.errors.length > 0) {
                        result.errors.push("Erroneous expression after 'in'");
                    }
                    temp = single(findChildren(expr, "item"), "'item' expression");
                    argname = temp.getAttribute("name");
                    temp = single(getChildren(temp), "'item' expression");
                    context2.vars.push({
                        name: argname,
                        type: info.type.array
                    });
                    result.type = {
                        integer: null
                    };
                    info = analyzeStmt(temp, context2);
                    if (info.errors.length > 0) {
                        result.errors.push("Erroneous statement after 'item'");
                    }
                    result.count = {
                        in_: temp,
                        item: {
                            name: argname,
                            stmt: info
                        }
                    };
                    break;
                case "redraw":
                    result.type = {
                        action: null
                    };
                    result.redraw = null;
                    break;
                case "delay":
                    temp = getChildren(expr);
                    info = analyzeExpr(temp[0], context);
                    if (!covariant(info.type, {
                        action: null
                    })) {
                        result.errors.push("Expression after 'delay' must be of the action type");
                    }
                    temp = single(findChildren(expr, "by"), "delay interval");
                    temp = single(getChildren(temp), "delay interval");
                    temp2 = analyzeExpr(temp, context);
                    if (!covariant(temp2.type, {
                        interval: null
                    })) {
                        result.errors.push("Expression after 'by' must be of the interval type");
                    }
                    result.type = {
                        action: null
                    };
                    result.delay = {
                        action: info,
                        by: temp2
                    };
                    break;
                case "input":
                    temp = single(getChildren(expr), "expression in 'input'");
                    info = analyzeExpr(temp, context);
                    if (!covariant(info.type, context.input)) {
                        result.errors.push("Expression in 'input' must be of the applet's input type");
                    }
                    result.type = {
                        action: null
                    };
                    result.input = info;
                    break;
                case "output":
                    temp = single(getChildren(expr), "expression in 'output'");
                    info = analyzeExpr(temp, context);
                    if (!covariant(info.type, context.output)) {
                        result.errors.push("Expression in 'output' must be of the applet's output type");
                    }
                    result.type = {
                        action: null
                    };
                    result.output = info;
                    break;
                default:
                    result.errors.push("Expression not recognized: " + expr.nodeName);
                    result.other = null;
            }
        } catch (error) {
            result.errors.push(error);
        }
        return result;
    }

    function analyzeStmt(stmt, context) {
        var result = {
            vars: {},
            errors: []
        };
        var expr;
        var children;
        var name;
        var i;
        var j;
        var context2 = {};
        var prop;
        var vars = {};
        var temp;
        var info;

        switch (stmt.nodeName) {
            case "is":
                temp = single(getChildren(stmt), "expression in 'is'");
                info = analyzeExpr(temp, context);
                if (info.errors.length !== 0) {
                    result.errors.push("Invalid expression in 'is'");
                }
                result.is = expr;
                break;
            case "not":
                children = single(getChildren(stmt), "statement in 'not'");
                expr = analyzeStmt(stmt.children, context);
                if (expr.errors.length !== 0) {
                    result.errors.push("Invalid statement in 'not'");
                }
                result.not = expr;
                break;
            case "def":
                name = stmt.getAttribute("var");
                if (name !== null) {
                    temp = single(getChildren(stmt), "expression in 'def'");
                    info = analyzeExpr(temp, context);
                    if (info.errors.length !== 0) {
                        result.errors.push("Invalid expression in 'def'");
                    }
                    result.vars[name] = info.type;
                    result.def = info;
                }
                break;
            case "all":
                children = getChildren(stmt);
                for (prop in context.types) {
                    context2.types[prop] = context.types[prop];
                }
                for (prop in context.vars) {
                    context2.vars[prop] = context.vars[prop];
                    vars[prop] = context.vars[prop];
                }
                result.all = [];
                for (i = 0; i < children.length; i++) {
                    expr = analyzeStmt(children[i], context2);
                    for (prop in expr.vars) {
                        if (vars.hasOwnProperty(prop)) {
                            result.errors.push("Variable redefined: " + prop);
                        } else {
                            vars[prop] = expr.vars[prop];
                            context2.vars[prop] = expr.vars[prop];
                        }
                    }
                    result.all.push(expr);
                }
                result.vars = context2.vars;
                break;
            case "any":
                children = getChildren(stmt);
                for (j = 0; j < context.types.length; j++) {
                    context2.types.push(context.types[j]);
                }
                for (j = 0; j < context.vars.length; j++) {
                    vars[context.vars[j].name] = context.vars[j].type;
                    context2.vars.push(context.vars[j]);
                }
                result.any = [];
                if (children.length > 0) {
                    expr = analyzeStmt(children[0], context2);
                    for (j = 0; j < expr.vars.length; j++) {
                        vars[expr.vars[j].name] = {
                            type: expr.vars[j].type,
                            count: 1
                        };
                    }
                    for (i = 1; i < children.length; i++) {
                        expr = analyzeStmt(children[i], context2);
                        for (j = 0; j < expr.vars.length; j++) {
                            vars[expr.vars[j].name].count++;
                            if (vars.hasOwnProperty(expr.vars[j].name)) {
                                if (isObjType(expr.vars[j].type)) {
                                    vars[expr.vars[j].name] = combine(expr.vars[j].type, vars[expr.vars[j].name].type);
                                } else {
                                    result.errors.push("Incompatible types for " + expr.vars[j].name);
                                }
                            }
                        }
                        result.any.push(expr);
                    }
                    for (prop in vars) {
                        if (vars[prop].count == children.length) {
                            result.vars[prop] = vars[prop].type;
                        }
                    }
                }
                break;
            case "unwrap":
                expr = analyzeExpr(single(getChildren(stmt), "expression in 'unwrap'"), context);
                if (expr.type.all) {
                    for (j = 0; j < expr.type.all.length; j++) {
                        if (expr.type.all[j].hasOwnProperty("prop")) {
                            prop = expr.type.all[j].prop.name;
                            if (context.vars.hasOwnProperty(prop)) {
                                result.errors.push("Variable redefined: " + prop);
                            } else {
                                context.vars[prop] = expr.type.all[j].prop.type;
                            }
                        }
                    }
                } else {
                    throw "Expression after 'unwrap' must be of 'all' type";
                }
                break;
            default:
                result.errors.push("Unknown statement: " + stmt.nodeName);
                result.other = null;
                break;
        }

        return result;
    }

    function isObjType(type) {
        return type.hasOwnProperty("prop") || type.hasOwnProperty("all") || type.hasOwnProperty("any");
    }

    function findProp(type, prop, result) {
        var i;

        if (type.hasOwnProperty("prop")) {
            if (type.prop.name === prop) {
                result.prop = type.prop;
                return true;
            } else {
                return false;
            }
        } else if (type.hasOwnProperty("all")) {
            for (i = 0; i < type.all.length; i++) {
                if (findProp(type.all[i], prop, result)) {
                    return true;
                }
            }
            return false;
        } else if (type.hasOwnProperty("any")) {
            for (i = 0; i < type.any.length; i++) {
                if (findProp(type.any[i], prop, result)) {
                    return true;
                }
            }
            return false;
        } else {
            throw typeStr(type) + " is not an object type";
        }
    }

    function combine(type1, type2) {
        var result = {
            errors: []
        };
        if (type1.hasOwnProperty("prop")) {

            if (type2.hasOwnProperty("prop")) {
                if (type1.prop.name == type2.prop.name) {
                    if (covariant(type1.prop.type, type2.prop.type) && covariant(type2.prop.type, type1.prop.type)) {
                        result.prop = type1.prop;
                    } else {
                        result.none = null;
                        result.errors.push("Incompatible property types");
                    }
                } else {
                    result.any = [type1, type2];
                }
            } else {
                result.errors.push("Only single-property types can be combined into variants");
            }
        } else {
            result.errors.push("Only single-property types can be combined into variants");
        }
    }

    function analyzeType(code, context) {
        var type;
        var info;
        var errors = 0;
        var name;
        var temp;
        var i;
        var children = [];
        var argerrors = [];
        var reterrors = [];
        var argtype;
        var rettype;
        var prop;
        var result = {
            type: {
                none: null
            },
            errors: []
        };

        try {

            switch (code.nodeName) {
                case "none":
                    break;
                case "integer":
                    result.type = {
                        integer: null
                    };
                    break;
                case "number":
                    result.type = {
                        number: null
                    };
                    break;
                case "string":
                    result.type = {
                        string: null
                    };
                    break;
                case "time":
                    result.type = {
                        time: null
                    };
                    break;
                case "interval":
                    result.type = {
                        interval: null
                    };
                    break;
                case "dynamic":
                    result.type = {
                        dynamic: null
                    };
                    break;
                case "action":
                    result.type = {
                        action: null
                    };
                    break;
                case "prop":
                    name = code.getAttribute("name");
                    if (name === null || name === "") {
                        throw "Missing property name";
                    }
                    children = getChildren(code);
                    if (children.length === 0) {
                        result.type = {
                            prop: {
                                name: name,
                                type: {
                                    none: null
                                }
                            }
                        };
                    } else {
                        type = analyzeType(children[0], context);
                        if (type.errors.length > 0) {
                            throw type.errors[0];
                        }
                        result.type = {
                            prop: {
                                name: name,
                                type: type.type
                            }
                        };
                    }
                    break;
                case "all":
                    result.type = {
                        all: []
                    };
                    children = getChildren(code);
                    for (i = 0; i < children.length; i++) {
                        type = analyzeType(children[i], context);
                        if (!isObjType(type.type)) {
                            throw "Invalid object property type";
                        }
                        if (type.errors.length !== 0) {
                            result.errors.push(type.errors[0]);
                        }
                        result.type.all.push(type.type);
                    }
                    break;
                case "any":
                    result.type = {
                        any: []
                    };
                    children = getChildren(code);
                    for (i = 0; i < children.length; i++) {
                        type = analyzeType(children[i], context);
                        if (!isObjType(type.type)) {
                            throw "Invalid object property type";
                        }
                        if (type.errors.length !== 0) {
                            throw type.errors[0];
                        }
                        result.type.any.push(type.type);
                    }
                    break;
                case "array":
                    children = getChildren(code);
                    type = analyzeType(single(children), context);
                    if (type.errors.length > 0) {
                        throw type.errors[0];
                    }
                    result.type = {
                        array: type.type
                    };
                    break;
                case "dictionary":
                    children = getChildren(code);
                    type = analyzeType(single(children), context);
                    if (type.errors.length > 0) {
                        throw type.errors[0];
                    }
                    result.type = {
                        dictionary: type.type
                    };
                    break;
                case "func":
                    children = findChildren(code, "arg");
                    if (children.length > 1 || (children.length == 1 && children[0].children.length > 1)) {
                        throw "More than one argument type";
                    } else if (children.length === 0 || (children.length == 1 && children[0].children.length === 0)) {
                        throw "Missing argument type";
                    } else {
                        type = analyzeType(children[0].children[0], context);
                        if (type.errors.length > 0) {
                            throw type.errors[0];
                        }
                        argtype = type.type;
                    }
                    children = findChildren(code, "return");
                    if (children.length > 1 || (children.length == 1 && children[0].children.length > 1)) {
                        throw "More than one return type";
                    } else if (children.length === 0 || (children.length == 1 && children[0].children.length === 0)) {
                        throw "Missing return type";
                    } else {
                        type = analyzeType(children[0].children[0], context);
                        if (type.errors.length > 0) {
                            throw type.errors[0];
                        }
                        rettype = type.type;
                    }
                    result.type = {
                        func: {
                            arg: argtype,
                            ret: rettype
                        }
                    };
                    break;
                case "type":
                    name = code.getAttribute("name");
                    if (name === null || name === "") {
                        throw "Missing type name";
                    }
                    if (context.types.hasOwnProperty(name)) {
                        result.type = context.types[name];
                    } else {
                        throw "Unknown user-defined data type: " + name;
                    }
                    break;
                case "like":
                    temp = single(getChildren(code));
                    info = analyzeExpr(temp, context);
                    if (info.errors.length > 0) {
                        throw "Erroneous expression";
                    }
                    result.type = info.type;
                    break;
                default:
                    throw "Unknown data type: " + code.nodeName;
            }
        } catch (error) {
            result.errors.push(error);
        }
        return result;
    }

    function typeStr(type) {
        return "<code><pre>" + formatType(type, "") + "</pre></code>";
    }

    function formatType(type, indent) {
        var temp;
        var i;
        var newindent = "    " + indent;

        if (type.hasOwnProperty("none")) {
            return "<strong>none</strong>";
        } else if (type.hasOwnProperty("integer")) {
            return "<strong>integer</strong>";
        } else if (type.hasOwnProperty("number")) {
            return "<strong>number</strong>";
        } else if (type.hasOwnProperty("string")) {
            return "<strong>string</strong>";
        } else if (type.hasOwnProperty("time")) {
            return "<strong>time</strong>";
        } else if (type.hasOwnProperty("interval")) {
            return "<strong>interval</strong>";
        } else if (type.hasOwnProperty("dynamic")) {
            return "<strong>dynamic</strong>";
        } else if (type.hasOwnProperty("action")) {
            return "<strong>action</strong>";
        } else if (type.hasOwnProperty("array")) {
            return "[" + formatType(type.array, "") + "]";
        } else if (type.hasOwnProperty("dictionary")) {
            return "{" + formatType(type.dictionary, "") + "}";
        } else if (type.hasOwnProperty("prop")) {
            if (type.prop.type.hasOwnProperty("none")) {
                return type.prop.name + ': ';
            } else {
                return type.prop.name + ': ' + formatType(type.prop.type, newindent);
            }
        } else if (type.hasOwnProperty("all")) {
            temp = "{ <br/>";
            for (i = 0; i < type.all.length - 1; i++) {
                temp = temp.concat(newindent, formatType(type.all[i], newindent), ", <br/>");
            }
            return temp + newindent + formatType(type.all[type.all.length - 1], newindent) + "<br/>" + indent + "}";
        } else if (type.hasOwnProperty("any")) {
            temp = "{ <br/>";
            for (i = 0; i < type.any.length - 1; i++) {
                temp = temp.concat(newindent, formatType(type.any[i], newindent), " | <br/>");
            }
            return temp + newindent + formatType(type.any[type.any.length - 1], newindent) + "<br/>" + indent + "}";
        } else if (type.hasOwnProperty("func")) {
            return formatType(type.func.arg, newindent) + " -> " + formatType(type.func.ret, newindent);
        } else {
            return "<strong>unknown</strong>";
        }
    }

    function covFunc(type1, type2) {
        if (type1.hasOwnProperty("func") && type2.hasOwnProperty("func")) {
            return covariant(type2.func.arg, type1.func.arg) && covariant(type1.func.ret, type2.func.ret);
        } else {
            return false;
        }
    }

    function covNum(type1, type2) {
        return (type1.hasOwnProperty("integer") && type2.hasOwnProperty("integer")) || (type1.hasOwnProperty("integer") && type2.hasOwnProperty("number")) || (type1.hasOwnProperty("number") && type2.hasOwnProperty("number"));
    }

    function covObj(type1, type2) {
        var i;

        if (type2.hasOwnProperty("prop")) {
            if (type1.hasOwnProperty("prop")) {
                return type1.prop.name == type2.prop.name && covariant(type1.prop.type, type2.prop.type);
            } else if (type1.hasOwnProperty("all")) {
                for (i = 0; i < type1.all.length; i++) {
                    if (covariant(type1.all[i], type2)) {
                        return true;
                    }
                }
                return false;
            } else {
                return false;
            }
        } else if (type2.hasOwnProperty("any")) {
            for (i = 0; i < type2.any.length; i++) {
                if (covObj(type1, type2.any[i])) {
                    return true;
                }
            }
            return false;
        } else if (type2.hasOwnProperty("all")) {
            for (i = 0; i < type2.all.length; i++) {
                if (!covObj(type1, type2.all[i])) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    function covariant(type1, type2) {
        function both(name) {
            return type1.hasOwnProperty(name) && type2.hasOwnProperty(name);
        }

        return both("none") || covNum(type1, type2) || both("string") || both("time") || both("interval") || (both("array") && covariant(type1.array, type2.array)) || covObj(type1, type2) || covFunc(type1, type2) || both("action");
    }

    function analyzeLib(code) {
        var result = {
            applets: {},
            global: {
                vars: {
                    core: coretype
                },
                types: {}
            },
            errors: []
        };
        var type;
        var temp;
        var temp2;
        var expr;
        var stmt;
        var applet;
        var name;
        var i;
        var j;
        var prop;
        var children = getChildren(code);

        for (j = 0; j < children.length; j++) {
            temp = children[j];

            switch (temp.nodeName) {
                case "typedef":
                    name = temp.getAttribute("name");
                    if (name !== null) {
                        temp2 = getChildren(temp);
                        if (temp2.length != 1) {
                            result.errors.push("Invalid type definition for " + name);
                        } else {
                            type = analyzeType(temp2[0], result.global);
                            if (type.errors.length > 0) {
                                result.errors.push("Erroneous type definition for " + name);
                            }
                            result.global.types[name] = type.type;

                        }
                    } else {
                        result.errors.push("Type definition has no name attribute");
                    }
                    break;
                case "common":
                    temp2 = getChildren(temp);
                    for (i = 0; i < temp2.length; i++) {
                        stmt = analyzeStmt(temp2[i], result.global);
                        if (stmt.errors.length > 0) {
                            result.errors.push("Common section contains errors");
                            break;
                        } else {
                            for (prop in stmt.vars) {
                                result.global.vars[prop] = stmt.vars[prop];
                            }
                        }
                    }
                    break;
                case "applet":
                    applet = analyzeApplet(temp, result.global);
                    if (applet.errors.length > 0) {
                        if (applet.hasOwnProperty("name")) {
                            name = applet.name;
                            if (result.applets.hasOwnProperty(name)) {
                                result.errors.push("Duplicate applet name: " + name);
                            } else {
                                result.applets[name] = applet;
                            }
                        } else {
                            result.errors.push("Missing applet name");
                        }
                        result.errors.push("Invalid applet definition: " + name);
                    }
                    break;
                default:
                    result.errors.push("Invalid element: " + temp.nodeName);
            }
        }

        return result;

    }

    /*
     * Run-time objects
     */

    function Applet(xml, context, engine, lib) {
        var temp;
        var children;
        var child;
        var prop;
        this.local = {};
        var i;
        var j;

        this.name = xml.getAttribute("name");
        var id = xml.getAttribute("id");
        if (id === null) {
            id = "id";
        }
        this.idname = id;
        this.events = {};
        this.listeners = {};

        children = getChildren(xml);
        for (i = 0; i < children.length; i++) {
            child = children[i];
            switch (child.nodeName) {
                case "state":
                    this.statename = child.getAttribute("name");
                    break;
                case "content":
                    this.content = firstExpr(child);
                    break;
                case "init":
                    this.initargname = child.getAttribute("arg");
                    if (this.initargname === null) {
                        this.initargname = "arg";
                    }
                    this.initState = firstExpr(findChild(child, "state"));
                    temp = findChildren(child, "actions");
                    if (temp.length === 1) {
                        this.initActions = getChildren(temp[0]);
                    } else {
                        this.initActions = [];
                    }
                    break;
                case "respond":
                    // this.respcontentname = child.getAttribute("content");
                    this.inputname = findChild(child, "input").getAttribute("name");
                    this.respState = firstExpr(findChild(child, "state"));
                    temp = findChildren(child, "actions");
                    if (temp.length === 1) {
                        this.respActions = getChildren(temp[0]);
                    } else {
                        this.respActions = [];
                    }
                    break;
                case "events":
                    this.eventname = child.getAttribute("data");
                    for (j = 0; j < child.children.length; j++) {
                        this.events[child.children[j].nodeName] = firstExpr(child.children[j]);
                    }
                    break;
                case "accept":
                    for (j = 0; j < child.children.length; j++) {
                        this.listeners[child.children[j].getAttribute("applet")] = {
                            // id: child.getAttribute("sender"),
                            data: child.getAttribute("data"),
                            expr: firstExpr(child.children[j])
                        };
                    }
                    break;
                case "output":
                    break;
                default:
                    throw "Error";
            }
        }

        this.instances = {};
        this.input = [];
        this.targets = [];

        var output = {};
        for (prop in context) {
            this.local[prop] = context[prop];
        }

        var applet = this;

        this.handlers = {
            click: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                console.log("click " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (engine.evalExpr(applet.events.click, applet.local, output)) {
                    e.stopPropagation();
                    e.preventDefault();
                    applet.respond(id, output.result);
                }
            },
            focus: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                console.log("focus " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (engine.evalExpr(applet.events.focus, applet.local, output)) {
                    e.stopPropagation();
                    e.preventDefault();
                    applet.respond(id, output.result);
                }
            },
            blur: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                console.log("blur " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                // applet.local[applet.eventname] = e.currentTarget.value;
                if (engine.evalExpr(applet.events.blur, applet.local, output)) {
                    e.stopPropagation();
                    e.preventDefault();
                    applet.respond(id, output.result);
                }
            },
            change: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                console.log("change " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                applet.local[applet.eventname] = e.currentTarget.value;
                if (engine.evalExpr(applet.events.change, applet.local, output)) {
                    e.stopPropagation();
                    e.preventDefault();
                    applet.respond(id, output.result);
                }
            },
            mouseover: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                console.log("mouseover " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (engine.evalExpr(applet.events.mouseover, applet.local, output)) {
                    e.stopPropagation();
                    e.preventDefault();
                    applet.respond(id, output.result);
                }
            },
            mouseout: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                console.log("mouseout " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (engine.evalExpr(applet.events.mouseout, applet.local, output)) {
                    e.stopPropagation();
                    e.preventDefault();
                    applet.respond(id, output.result);
                }
            },
            mousedown: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                console.log("mousedown " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (engine.evalExpr(applet.events.mousedown, applet.local, output)) {
                    e.stopPropagation();
                    e.preventDefault();
                    applet.respond(id, output.result);
                }
            },
            mouseup: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                console.log("mouseup " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (engine.evalExpr(applet.events.mouseup, applet.local, output)) {
                    e.stopPropagation();
                    e.preventDefault();
                    applet.respond(id, output.result);
                }
            }
        };

        this.create = function(id, element) {
            this.local[this.idname] = id;
            // var element = document.getElementById(id);
            if (element !== null) {
                if (element.attributes["data-arg"]) {
                    this.local[this.initargname] = element.attributes["data-arg"].value;
                } else {
                    this.local[this.initargname] = "";
                }
                console.log("create " + applet.name + "::" + id + " : " + this.local[this.initargname]);
                if (engine.evalExpr(this.initState, this.local, output)) {
                    this.instances[id] = output.result;
                    this.local[this.statename] = output.result;
                    if (engine.evalExpr(this.content, this.local, output)) {
                        element.innerHTML = output.result;
                    }
                    resume();
                    this.input[id] = [];
                    for (var e in this.events) {
                        element.addEventListener(e, this.handlers[e]);
                    }
                    for (i = 0; i < this.initActions.length; i++) {
                        if (engine.evalExpr(this.initActions[i], this.local, output)) {
                            var action = output.result;
                            action(this, id);
                        }
                    }
                }
                delete this.local[this.initargname];
            }
        };
        this.exists = function(id) {
            return this.instances.hasOwnProperty(id);
        };
        this.redraw = function(id) {
            // console.log("redraw " + applet.name + "::" + id);
            this.local[this.idname] = id;
            this.local[this.statename] = this.instances[id];
            if (engine.evalExpr(this.content, this.local, output)) {
                var element = document.getElementById(id);
                element.innerHTML = output.result;
                resume();
            }
        };
        this.respond = function(id, msg) {
            this.input[id].push(msg);
            resume();
        };
        this.run = function(id) {
            var instance = this.instances[id];
            var queue = this.input[id];
            this.local[this.idname] = id;
            this.local[this.statename] = instance;
            /*            var element = document.getElementById(id);
            if (element !== null) {
                this.local[this.respcontentname] = element.innerHTML;
            }
*/
            i = 0;
            while (i < queue.length) {
                this.local[this.inputname] = queue[i];
                console.log("respond " + applet.name + "::" + id + " : " + format(queue[i]));
                if (engine.evalExpr(this.respState, this.local, output)) {
                    this.instances[id] = output.result;
                    this.local[this.statename] = output.result;
                    for (i = 0; i < this.respActions.length; i++) {
                        if (engine.evalExpr(this.respActions[i], this.local, output)) {
                            var action = output.result;
                            action(this, id);
                        }
                    }
                }
                i++;
            }
            this.input[id] = [];
            delete this.local[this.inputname];
        };
        this.broadcast = function(msg) {
            var instance;
            this.local[this.inputname] = msg;
            // console.log("broadcast " + id);
            for (var id in this.instances) {
                instance = this.instances[id];
                this.local[this.statename] = instance;
                this.input[id].push(msg);
                resume();
            }
            delete this.local[this.inputname];
        };
        this.destroy = function(id) {
            console.log("destroy " + applet.name + "::" + id);
            delete this.instances[id];
            delete this.input[id];
        };
    }

    function getLib(url, receive) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                var xml = xmlhttp.responseXML;
                var lib = new Library(xml.children[0]);
                pending--;
                receive(url, lib);
            }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
        pending++;
    }

    function Library(xml) {
        this.applets = {};
        var temp;
        var name;
        var output = {};
        var prop;
        var common;
        this.context = {
            core: core
        };
        var lib = this;
        var code = {
            analyzeLib: analyzeLib,
            typeStr: typeStr
        };

        var actions = {
            redraw: function() {
                return function(applet, id) {
                    console.log("redraw " + applet.name + "::" + id);
                    applet.redraw(id);
                    //resume();
                };
            },
            output: function(msg) {
                return function(applet, id) {
                    console.log("output " + applet.name + "::" + id + " : " + format(msg));
                    for (var i = 0; i < applet.targets.length; i++) {
                        var target = applet.targets[i];
                        if (target.listeners.hasOwnProperty(applet.name)) { //target applet has a listener for current applet?
                            var local = {};
                            for (prop in target.local) {
                                local[prop] = target.local[prop];
                            }
                            local[target.listeners[applet.name].data] = msg;
                            for (var id2 in target.instances) {
                                var state = target.instances[id2];
                                local[target.statename] = state;
                                console.log("accept " + target.name + "::" + id2 + " : " + format(msg));
                                if (engine.evalExpr(target.listeners[applet.name].expr, local, output)) {
                                    target.respond(id2, output.result);
                                }
                            }
                        }
                    }
                };
            },
            input: function(msg) {
                return function(applet, id) {
                    console.log("input " + applet.name + "::" + id);
                    applet.respond(id, msg);
                };
            },
            delay: function(action, interval) {
                return function(applet, id) {
                    setTimeout(function() {
                        action(applet, id);
                    }, interval);
                };
            },
            now: function(timename, success) {
                return function(applet, id) {
                    var local = {};
                    for (prop in applet.local) {
                        local[prop] = applet.local[prop];
                    }
                    local[timename] = Number(Date());
                    if (engine.evalExpr(success, local, output)) {
                        applet.respond(id, output.result);
                    }
                };
            },
            random: function(numname, success) {
                return function(applet, id) {
                    var local = {};
                    for (prop in applet.local) {
                        local[prop] = applet.local[prop];
                    }
                    local[numname] = Math.random();
                    if (engine.evalExpr(success, local, output)) {
                        applet.respond(id, output.result);
                    }
                };
            },
            gettext: function(url, resultname, success) {
                return function(applet, id) {
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.onreadystatechange = function() {
                        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                            var local = {};
                            for (prop in applet.local) {
                                local[prop] = applet.local[prop];
                            }
                            local[resultname] = xmlhttp.responseText;
                            if (engine.evalExpr(success, local, output)) {
                                applet.respond(id, output.result);
                            }
                        }
                    };
                    xmlhttp.open("GET", url, true);
                    xmlhttp.send();
                };
            },
            getxml: function(url, resultname, success) {
                return function(applet, id) {
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.onreadystatechange = function() {
                        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                            var local = {};
                            for (prop in applet.local) {
                                local[prop] = applet.local[prop];
                            }
                            local[resultname] = xmlhttp.responseXML.children[0];
                            if (engine.evalExpr(success, local, output)) {
                                applet.respond(id, output.result);
                            }
                        }
                    };
                    xmlhttp.open("GET", url, true);
                    xmlhttp.send();
                };
            }
        };

        var engine = new ExprEngine(actions);
        var i;
        var j;
        var doimport;
        var vars;
        var applets;
        var varmap = {};
        var appmap = {};
        var tempmap;
        var attr;
        var p;
        var oldname;
        var newname;
        var liburl;

        temp = findChildren(xml, "common");
        if (temp.length > 0) {
            temp = temp[0];
            for (i = 0; i < temp.children.length; i++) {
                if (!engine.evalStmt(temp.children[i], lib.context, output)) {
                    throw "Fail";
                }
                for (prop in output) {
                    this.context[prop] = output[prop];
                }
            }
        }

        temp = findChildren(xml, "applet");
        for (i = 0; i < temp.length; i++) {
            name = temp[i].getAttribute("name");
            applet = new Applet(temp[i], lib.context, engine);
            this.applets[name] = applet;
        }

        for (name in this.applets) {
            var target = this.applets[name];
            for (prop in target.listeners) {
                applet = this.applets[prop];
                applet.targets.push(target);
            }
        }

        code.self = xml;
        this.context.core.code = code;

        doimport = function(url, childlib) {
            for (prop in varmap[url]) {
                console.log("import " + prop + " as " + varmap[url][prop] + " : " + format(childlib.context[prop]));
                lib.context[varmap[url][prop]] = childlib.context[prop];
            }
            for (name in lib.applets) {
                var target = lib.applets[name];
                for (prop in childlib.applets) {
                    if (target.listeners.hasOwnProperty(appmap[url][prop])) {
                        applet = childlib.applets[prop];
                        applet.targets.push(target);
                    }
                }
            }
            for (prop in appmap[url]) {
                console.log("import applet " + prop + " as " + appmap[url][prop]);
                lib.applets[appmap[url][prop]] = childlib.applets[prop];
            }

            if (pending === 0) {
                resume();
            }
        };

        temp = findChildren(xml, "import");
        for (i = 0; i < temp.length; i++) {
            liburl = temp[i].getAttribute("library");
            vars = findChildren(temp[i], "var");
            tempmap = {};
            for (j = 0; j < vars.length; j++) {
                attr = vars[j].getAttribute("name");
                p = attr.indexOf("/");
                if (p === -1) {
                    oldname = attr;
                    newname = attr;
                } else {
                    oldname = attr.slice(0, p);
                    newname = attr.slice(p + 1);
                }
                tempmap[oldname] = newname;
            }
            varmap[liburl] = tempmap;
            applets = findChildren(temp[i], "applet");
            tempmap = {};
            for (j = 0; j < applets.length; j++) {
                attr = applets[j].getAttribute("name");
                p = attr.indexOf("/");
                if (p === -1) {
                    oldname = attr;
                    newname = attr;
                } else {
                    oldname = attr.slice(0, p);
                    newname = attr.slice(p + 1);
                }
                tempmap[oldname] = newname;
            }
            appmap[liburl] = tempmap;
            getLib(liburl, doimport);
        }
    }

    var activelib;
    var runlib = function(url, lib) {
        var name;
        var applet;
        var elements;
        var element;
        var id;
        var ids;
        var i;
        activelib = lib;
        if (pending === 0) {
            console.log("RUN at " + (new Date()).toTimeString().slice(0, 8));
            ids = [];
            for (name in lib.applets) {
                applet = lib.applets[name];
                elements = document.getElementsByClassName("fabsite-" + name);
                for (i = 0; i < elements.length; i++) {
                    element = elements[i];
                    id = element.getAttribute("id");
                    if (id !== null && id !== "") {
                        if (!applet.exists(id)) {
                            ids.push({
                                id: id,
                                applet: applet,
                                element: element
                            });
                        }
                    }
                }
                for (id in applet.instances) {
                    element = document.getElementById(id);
                    if (element === null) {
                        applet.destroy(id);
                    } else {
                        applet.run(id);
                    }
                }
            }
            for (i in ids) {
                ids[i].applet.create(ids[i].id, ids[i].element);
            }
        }
    };
    var active = false;
    var run = function() {
        active = false;
        runlib(url, activelib);
    };

    resume = function() {
        if (!active) {
            active = true;
            setTimeout(run, 0);
        }
    };

    getLib(url, runlib);
}