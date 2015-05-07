/*
 * =======  Fabula Interpreter  =======
 *     © Aha! Factor Pty Ltd, 2015
 *       http://fabsitetools.com
 * ====================================
 */

function fabLoadLibrary(url, trace, extcallback) {

    var asyncRequest = function(method, uri, callback, postData) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                if (callback) {
                    callback(xhr.responseXML);
                }
            }
        };
        xhr.open(method, uri, true);
        xhr.send(postData || null);
        return xhr;
    };

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
        for (i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeName === name) {
                return node.childNodes[i];
            }
        }
        throw "Error";
    }

    function findChildren(node, name) {
        var i = 0;
        var result = [];
        for (i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeName == name) {
                result.push(node.childNodes[i]);
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
            if (flevel > 4) {
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
            return "applet-" + name;
        },
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
                return Math.floor(x);
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
            },
            encode: function(arg) {
                return Number(Date(arg.year, arg.month, arg.day, arg.hours, arg.min, arg.sec, arg.msec));
            },
            decode: function(t) {
                return {
                    year: t.getFullYear(),
                    month: t.getMonth(),
                    day: t.getDate(),
                    hours: t.getHours(),
                    min: t.getMinutes(),
                    sec: t.getSeconds(),
                    msec: t.getMilliseconds()
                };
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
            nbsp: "&nbsp;",
            lt: "&lt;",
            amp: "&",
            br: "<br/>",
            substr: function(args) {
                var from = args.from;
                var to = args.to;
                if (to.hasOwnProperty("length")) {
                    return args.str.substr(from, to.length);
                } else {
                    if (to.hasOwnProperty("pos")) {
                        return args.str.slice(from, to.pos);
                    } else {
                        return args.str.slice(from);
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
            lastIndexOf: function(args) {
                var idx = args.str.lastIndexOf(args.substr);
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
                var re = new RegExp(arg.substr, 'g');

                return arg.str.replace(re, arg.to);
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
                return xmlDoc.childNodes[0];
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
                var temp = arg.node.getAttribute(arg.name);
                if (temp === null)
                    throw "Attribute not found";
                return temp;
            },
            getAttributes: function(node) {
                var n = node.attributes.length;
                var attrnode;
                var result = {};
                for (var i = 0; i < n; i++) {
                    attrnode = node.attributes.item(i);
                    result[attrnode.name] = attrnode.nodeValue;
                }
                return result;
            },
            innerHTML: function(node) {
                var ser = new XMLSerializer();
                var temp = "";
                for (var i = 0; i < node.childNodes.length; i++) {
                    temp += ser.serializeToString(node.childNodes[i]);
                }
                return temp;
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

            var scanner = /\s*(-?\d*\.\d+)|(-?\d+)|(\w+)|(\".*?\")|('.*?')|(`..`)|(#)|(@)|(\+)|(-)|(\*)|(\/)|(\.)|(\()|(\))|(\[)|(\])|(\{)|(\})|(:)|(,)|(<=?)|(\/?=)|(>=?)/g;
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
                    if (parseProp() && typeof result !== "undefined") {
                        result = prev[result];
                        if (typeof result === "undefined") {
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
                    if (token[0] === "null") {
                        result = null;
                    } else {
                        result = context[token[0]];
                    }
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

            // trace("evalFormula " + formula);

            try {
                if (parseFormula()) {
                    if (result === true || result === false) { //Fabula has no booleans
                        if (result) {
                            trace(formula + " -> success");
                        } else {
                            trace(formula + " -> failed");
                        }
                        return result;
                    }
                    output.result = result;
                    trace(formula + " -> " + format(result));
                    return true;
                } else {
                    trace(formula + " -> failed");
                    return false;
                }
            } catch (error) {
                trace(formula + " -> failed");
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
            return value;
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
            var chame;
            var ret;
            var frmpat = /\[%(.*?)%\]/g;
            var info;
            var children;

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

                // trace("evalExpr " + expr.nodeName);

                switch (expr.nodeName) {
                    case "invalid":
                        output.result = undefined;
                        return false;
                    case "text":
                        children = getChildren(expr);
                        var ser = new XMLSerializer();
                        temp = "";
                        for (i = 0; i < children.length; i++) {
                            temp += ser.serializeToString(children[i]);
                        }
                        // temp = ser.serializeToString(expr);
                        // temp = expr.innerHTML.trim();
                        output.result = temp.replace(frmpat, frmval);
                        trace("text : " + temp + " -> " + format(output.result));
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
                            return evalExpr(xmlDoc.childNodes[0], context, output);
                        } else {
                            output.result = undefined;
                            return false;
                        }
                        break;
                    case "cast":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            // temp = findChild(expr, "to");
                            // info = analyzeType(firstExpr(temp), {
                            //     types: [],
                            //     vars: []
                            // });
                            // output.result = cast(result.result, info.type);
                            output.result = result.result;
                            trace("cast : " + format(output.result));
                        } else {
                            output.result = undefined;
                            trace("cast : failed");
                            return false;
                        }
                        break;
                    case "list":
                        temp = getChildren(expr);
                        array.length = temp.length;
                        for (i = 0; i < temp.length; i++) {
                            if (evalExpr(temp[i], context, result)) {
                                array[i] = result.result;
                            } else {
                                output.result = undefined;
                                trace("list : failed");
                                return false;
                            }
                        }
                        output.result = array;
                        trace("list : " + format(result.result));
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
                                    trace("entries : failed");
                                    return false;
                                }
                            } else {
                                output.result = undefined;
                                trace("entries : failed");
                                return false;
                            }
                        }
                        output.result = obj;
                        trace("entries : " + format(obj));
                        break;
                    case "array":
                        temp = firstExpr(findChild(expr, "size"));
                        if (evalExpr(temp, context, result)) {
                            l = result.result;
                            item = findChild(expr, "item");
                            idxname = item.getAttribute("index");
                            for (prop in context) {
                                context2[prop] = context[prop];
                            }
                            for (i = 0; i < l; i++) {
                                context2[idxname] = i;
                                if (evalExpr(firstExpr(item), context2, result)) {
                                    array.push(result.result);
                                } else {
                                    output.result = undefined;
                                    trace("array : failed");
                                    return false;
                                }
                            }
                        } else {
                            output.result = undefined;
                            trace("array : failed");
                            return false;
                        }
                        output.result = array;
                        trace("array : " + format(array));
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
                                        trace("dictionary : failed");
                                        return false;
                                    }
                                } else {
                                    output.result = undefined;
                                    trace("dictionary : failed");
                                    return false;
                                }
                            }
                        } else {
                            output.result = undefined;
                            trace("dictionary : failed");
                            return false;
                        }
                        output.result = obj;
                        trace("dictionary : " + format(obj));
                        break;
                    case "keys":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            for (prop in result.result) {
                                array.push(prop);
                            }
                            output.result = array;
                            trace("keys : " + format(array));
                        } else {
                            trace("keys : failed");
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
                        // l = 0;
                        for (i = 0; i < temp.length; i++) {
                            if (evalExpr(temp[i], context, output)) {
                                temp[i] = output.result;
                                // l += output.result.length;
                            }
                        }
                        // array.length = l;
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
                    case "alter":
                        temp = firstExpr(expr);
                        if (evalExpr(temp, context, output)) {
                            for (prop in output.result) {
                                obj[prop] = output.result[prop];
                            }
                            temp = findChildren(expr, "set");
                            for (i = 0; i < temp.length; i++) {
                                if (evalExpr(firstExpr(temp[i]), context, output)) {
                                    prop = temp[i].getAttribute("prop");
                                    obj[prop] = output.result;
                                } else {
                                    return false;
                                }
                            }
                            output.result = obj;
                        } else {
                            return false;
                        }
                        break;
                    case "calc":
                        where = getChildren(expr);
                        for (prop in context) {
                            context2[prop] = context[prop];
                        }
                        for (i = where.length - 1; i > 0; i--) {
                            stmt = firstExpr(where[i]);
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
                                trace("invoke(" + format(x) + ") -> " + format(funcout.result));
                                return funcout.result;
                            } else {
                                trace("invoke(" + format(x) + ") -> failed");
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
                                if (evalStmt(firstExpr(temp), context2, output2)) {
                                    output.result = array[i];
                                    trace("find : " + format(output.result));
                                    return true;
                                }
                            }
                            trace("find : failed");
                            return false;
                        }
                        trace("find : failed");
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
                                if (evalStmt(firstExpr(temp), context2, output2)) {
                                    array2.push(output2.result);
                                }
                            }
                            output.result = array2;
                            trace("select : " + array2.length);
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
                                if (evalStmt(firstExpr(temp), context2, output2)) {
                                    count++;
                                }
                            }
                            output.result = count;
                            trace("count : " + count);
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
                    case "send":
                        chname = expr.getAttribute("channel");
                        if (evalExpr(firstExpr(expr), context, result)) {
                            output.result = actions.send(chname, result.result);
                        } else {
                            return false;
                        }
                        break;
                    case "get":
                        if (evalExpr(firstExpr(expr), context, result)) {
                            temp = findChild(expr, "success");
                            argname = temp.getAttribute("name");
                            output.result = actions.get(result.result, argname, firstExpr(temp));
                        } else {
                            return false;
                        }
                        break;
                        // case "exec":
                        //     if (evalExpr(firstExpr(expr), context, result)) {
                        //         temp = findChild(expr, "success");
                        //         argname = temp.getAttribute("name");
                        //         output.result = actions.exec(result.result, argname, firstExpr(temp));
                        //     } else {
                        //         return false;
                        //     }
                        //     break;
                    case "postfile":
                        temp = firstExpr(findChild(expr, "url"));
                        if (evalExpr(temp, context, result)) {
                            var url = result.result;
                            temp = firstExpr(findChild(expr, "fieldid"));
                            if (evalExpr(temp, context, result)) {
                                var fieldid = result.result;
                                temp = findChild(expr, "success");
                                argname = temp.getAttribute("name");
                                output.result = actions.postfile(url, fieldid, argname, firstExpr(temp));
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                        break;
                    default:
                        return false;
                }
                return true;
            } catch (error) {
                trace(expr.nodeName + " -> failed");
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
                // trace("evalStmt " + stmt.nodeName);

                switch (stmt.nodeName) {
                    case "is":
                        if (evalExpr(firstExpr(stmt), context, result)) {
                            trace("is : success");
                        } else {
                            trace("is : failed");
                            return false;
                        }
                        break;
                    case "not":
                        temp = evalStmt(firstExpr(stmt), context, result);
                        if (temp) {
                            trace("not : failed");
                            return false;
                        } else {
                            trace("not : success");
                            return true;
                        }
                        break;
                    case "def":
                        name = stmt.getAttribute("var");
                        if (evalExpr(firstExpr(stmt), context, result)) {
                            output[name] = result.result;
                            trace("def " + name + " : " + format(result.result));
                        } else {
                            trace("def " + name + " : failed");
                            return false;
                        }
                        break;
                    case "all":
                        for (prop in context) {
                            context2[prop] = context[prop];
                        }
                        temp = getChildren(stmt);
                        for (i = 0; i < temp.length; i++) {
                            if (evalStmt(temp[i], context2, result)) {
                                for (prop in result) {
                                    context2[prop] = result[prop];
                                    output[prop] = result[prop];
                                }
                                result = {};
                            } else {
                                output = {};
                                trace("all : failed");
                                return false;
                            }
                        }
                        trace("all " + list() + ": success");
                        break;
                    case "any":
                        temp = getChildren(stmt);
                        for (i = 0; i < temp.length; i++) {
                            if (evalStmt(temp[i], context, result)) {
                                for (prop in result) {
                                    output[prop] = result[prop];
                                }
                                trace("any " + list() + ": success");
                                return true;
                            }
                        }
                        trace("any : failed");
                        return false;
                    case "unwrap":
                        if (evalExpr(firstExpr(stmt), context, result)) {
                            for (prop in result.result) {
                                output[prop] = result.result[prop];
                            }
                            trace("unwrap " + list() + ": success");
                        } else {
                            trace("unwrap : failed");
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

        return both("none") || type2.hasOwnProperty("dynamic") || covNum(type1, type2) || both("string") || both("time") || both("interval") || (both("array") && covariant(type1.array, type2.array)) || covObj(type1, type2) || covFunc(type1, type2) || both("action");
    }

    /*
     * Run-time objects
     */

    function Applet(xml, context, engine) {
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
        this.initState = null;
        this.initActions = [];
        this.initrandnames = [];
        this.resprandnames = [];
        this.idname = id;
        this.events = {};
        this.channels = {};

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
                    temp = child.getAttribute("random");
                    if (temp !== null) {
                        this.initrandnames = temp.split(",");
                    }
                    this.inittimename = child.getAttribute("time");
                    temp = findChildren(child, "state");
                    if (temp.length === 1) {
                        this.initState = firstExpr(temp[0]);
                    } else {
                        this.initState = null;
                    }
                    temp = findChildren(child, "actions");
                    if (temp.length === 1) {
                        this.initActions = getChildren(temp[0]);
                    } else {
                        this.initActions = [];
                    }
                    break;
                case "respond":
                    this.inputname = findChild(child, "input").getAttribute("name");
                    temp = child.getAttribute("random");
                    if (temp !== null) {
                        this.resprandnames = temp.split(",");
                    }
                    this.resptimename = child.getAttribute("time");
                    temp = findChildren(child, "before");
                    if (temp.length === 1) {
                        this.respBefore = getChildren(temp[0]);
                    } else {
                        this.respBefore = [];
                    }
                    this.respState = firstExpr(findChild(child, "state"));
                    temp = findChildren(child, "after");
                    if (temp.length === 1) {
                        this.respAfter = getChildren(temp[0]);
                    } else {
                        this.respAfter = [];
                    }
                    break;
                case "events":
                    this.eventname = child.getAttribute("data");
                    temp = getChildren(child);
                    for (j = 0; j < temp.length; j++) {
                        this.events[temp[j].nodeName] = firstExpr(temp[j]);
                    }
                    break;
                case "accept":
                    temp = getChildren(child);
                    for (j = 0; j < temp.length; j++) {
                        if (temp[j].hasAttribute("channel")) {
                            this.channels[temp[j].getAttribute("channel")] = {
                                data: child.getAttribute("data"),
                                expr: firstExpr(temp[j])
                            };
                        }
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
                trace("click " + applet.name + "::" + id);
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
                trace("focus " + applet.name + "::" + id);
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
                trace("blur " + applet.name + "::" + id);
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
                applet.local[applet.statename] = instance;
                applet.local[applet.eventname] = e.target.value;
                trace("change " + applet.name + "::" + id + " : " + format(e.target.value));
                if (engine.evalExpr(applet.events.change, applet.local, output)) {
                    e.stopPropagation();
                    e.preventDefault();
                    applet.respond(id, output.result);
                }
            },
            mouseover: function(e) {
                var id = e.currentTarget.getAttribute("id");
                var instance = applet.instances[id];
                trace("mouseover " + applet.name + "::" + id);
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
                trace("mouseout " + applet.name + "::" + id);
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
                trace("mousedown " + applet.name + "::" + id);
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
                trace("mouseup " + applet.name + "::" + id);
                applet.local[applet.statename] = instance;
                if (engine.evalExpr(applet.events.mouseup, applet.local, output)) {
                    e.stopPropagation();
                    e.preventDefault();
                    applet.respond(id, output.result);
                }
            }
        };

        this.create = function(id, element, applets) {
            var i;
            var context = {};
            var prop;
            var child;
            var id2;
            var appname;
            var app;
            var elements;

            for (prop in this.local) {
                context[prop] = this.local[prop];
            }

            context[this.idname] = id;
            if (element !== null) {
                if (element.attributes["data-arg"]) {
                    context[this.initargname] = element.attributes["data-arg"].value;
                } else {
                    context[this.initargname] = "";
                }
                trace("create " + applet.name + "::" + id + " : " + context[this.initargname]);
                for (i = 0; i < this.initrandnames.length; i++) {
                    context[this.initrandnames[i]] = Math.random();
                }
                if (this.inittimename !== null) {
                    context[this.inittimename] = new Date();
                }
                if (this.initState === null || engine.evalExpr(this.initState, context, output)) {
                    if (this.initState !== null) {
                        this.instances[id] = output.result;
                        context[this.statename] = output.result;
                    } else {
                        this.instances[id] = null;
                    }
                    for (var e in this.events) {
                        element.addEventListener(e, this.handlers[e]);
                    }
                    if (engine.evalExpr(this.content, context, output)) {
                        element.innerHTML = ""; //output.result;
                        element.insertAdjacentHTML("beforeend", output.result);
                    }
                    for (appname in applets) {
                        app = applets[appname];
                        elements = element.getElementsByClassName("applet-" + appname);
                        for (i = 0; i < elements.length; i++) {
                            child = elements[i];
                            id2 = child.getAttribute("id");
                            if (id2 !== null && id2 !== id) {
                                if (app.exists(id2)) {
                                    // app.redraw(id2, applets);
                                } else {
                                    app.create(id2, child, applets);
                                }
                            }
                        }
                    }
                    resume();
                    this.input[id] = [];
                    for (i = 0; i < this.initActions.length; i++) {
                        if (engine.evalExpr(this.initActions[i], context, output)) {
                            var action = output.result;
                            action(this, id);
                        }
                    }
                }
            }
        };
        this.exists = function(id) {
            return this.instances.hasOwnProperty(id);
        };
        this.redraw = function(id, applets) {
            var id2;
            var appname;
            var app;
            var elements;
            var context = {};
            var prop;
            var i;
            // trace("redraw " + applet.name + "::" + id);

            for (prop in this.local) {
                context[prop] = this.local[prop];
            }

            context[this.idname] = id;
            context[this.statename] = this.instances[id];
            if (engine.evalExpr(this.content, context, output)) {
                var element = document.getElementById(id);
                element.innerHTML = ""; //output.result;
                element.insertAdjacentHTML("beforeend", output.result);
                for (appname in applets) {
                    app = applets[appname];
                    elements = element.getElementsByClassName("applet-" + appname);
                    for (i = 0; i < elements.length; i++) {
                        child = elements[i];
                        id2 = child.getAttribute("id");
                        if (id2 !== null && id2 !== id) {
                            if (app.exists(id2)) {
                                app.destroy(id2);
                            }
                            app.create(id2, child, applets);
                        }
                    }
                }
                resume();
            }
        };
        this.respond = function(id, msg) {
            if (this.input.hasOwnProperty(id)) {
                this.input[id].push(msg);
                resume();
            }
        };
        this.run = function(id) {
            var i;
            var j;

            var instance = this.instances[id];
            var action;
            var queue = this.input[id];
            var context = {};
            var prop;

            for (prop in this.local) {
                context[prop] = this.local[prop];
            }

            context[this.idname] = id;
            context[this.statename] = instance;
            i = 0;
            while (i < queue.length) {
                context[this.inputname] = queue[i];
                for (j = 0; j < this.resprandnames.length; j++) {
                    context[this.resprandnames[j]] = Math.random();
                }
                if (this.resptimename !== null) {
                    context[this.resptimename] = new Date();
                }
                trace("respond " + applet.name + "::" + id + " : " + format(queue[i]));
                for (j = 0; j < this.respBefore.length; j++) {
                    if (engine.evalExpr(this.respBefore[j], context, output)) {
                        action = output.result;
                        action(this, id);
                    }
                }
                if (engine.evalExpr(this.respState, context, output)) {
                    this.instances[id] = output.result;
                    context[this.statename] = output.result;
                    for (j = 0; j < this.respAfter.length; j++) {
                        if (engine.evalExpr(this.respAfter[j], context, output)) {
                            action = output.result;
                            action(this, id);
                        }
                    }
                }
                i++;
            }
            this.input[id] = [];
        };
        // this.broadcast = function(msg) {
        //     var instance;
        //     this.local[this.inputname] = msg;
        //     // trace("broadcast " + id);
        //     for (var id in this.instances) {
        //         instance = this.instances[id];
        //         this.local[this.statename] = instance;
        //         this.input[id].push(msg);
        //         resume();
        //     }
        //     delete this.local[this.inputname];
        // };
        this.destroy = function(id) {
            trace("destroy " + applet.name + "::" + id);
            delete this.instances[id];
            delete this.input[id];
        };
    }

    function Channel(xml, engine) {
        this.name = xml.getAttribute("name");
        this.targets = [];
        this.send = function(data) {
            var prop;
            var output = {};
            trace("channel " + this.name + " : " + format(data));
            for (var i = 0; i < this.targets.length; i++) {
                var target = this.targets[i];
                if (target.channels.hasOwnProperty(this.name)) { //target applet has a listener for current channel?
                    var local = {};
                    for (prop in target.local) {
                        local[prop] = target.local[prop];
                    }
                    local[target.channels[this.name].data] = data;
                    for (var id2 in target.instances) {
                        var state = target.instances[id2];
                        local[target.statename] = state;
                        trace("accept " + target.name + "::" + id2 + " : " + format(data));
                        if (engine.evalExpr(target.channels[this.name].expr, local, output)) {
                            target.respond(id2, output.result);
                        }
                    }
                }
            }
        };
    }

    function getLib(url, receive) {
        pending++;
        asyncRequest('GET', url,
            function(xml) {
                var lib = new Library(xml.childNodes[0]);
                pending--;
                receive(url, lib);
            });
    }

    // function getLib(url, receive) {
    //     var xmlhttp = new XMLHttpRequest();
    //     xmlhttp.onreadystatechange = function() {
    //         if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
    //             var xml = xmlhttp.responseXML;
    //             var lib = new Library(xml.childNodes[0]);
    //             pending--;
    //             receive(url, lib);
    //         }
    //     };
    //     xmlhttp.open("GET", url, true);
    //     xmlhttp.send();
    //     pending++;
    // }

    function Library(xml) {
        this.applets = {};
        this.channels = {};
        var temp;
        var name;
        var output = {};
        var prop;
        var common;
        this.context = {
            core: core
        };
        var lib = this;

        var actions = {
            redraw: function() {
                return function(applet, id) {
                    trace("redraw " + applet.name + "::" + id);
                    applet.redraw(id, lib.applets);
                    //resume();
                };
            },
            send: function(name, msg) {
                return function(applet, id) {
                    trace("send " + applet.name + "::" + id + " to: " + name + " data: " + format(msg));
                    var channel = lib.channels[name];
                    for (var i = 0; i < channel.targets.length; i++) {
                        var target = channel.targets[i];
                        if (target.channels.hasOwnProperty(name)) { //target applet has a listener for channel?
                            var local = {};
                            for (prop in target.local) {
                                local[prop] = target.local[prop];
                            }
                            local[target.channels[name].data] = msg;
                            for (var id2 in target.instances) {
                                var state = target.instances[id2];
                                local[target.statename] = state;
                                trace("accept " + target.name + "::" + id2);
                                if (engine.evalExpr(target.channels[name].expr, local, output)) {
                                    target.respond(id2, output.result);
                                }
                            }
                        }
                    }
                };
            },
            input: function(msg) {
                return function(applet, id) {
                    trace("input " + applet.name + "::" + id);
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
            get: function(url, resultname, success) {
                return function(applet, id) {
                    trace("get " + applet.name + "::" + id + " : " + url);
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.onreadystatechange = function() {
                        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                            var local = {};
                            for (prop in applet.local) {
                                local[prop] = applet.local[prop];
                            }
                            local[applet.idname] = id;
                            local[applet.statename] = applet.instances[id];
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
            postxml: function(url, data, resultname, success) {
                return function(applet, id) {
                    trace("postxml " + applet.name + "::" + id + " : " + url + " : " + format(data));
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.onreadystatechange = function() {
                        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                            var local = {};
                            for (prop in applet.local) {
                                local[prop] = applet.local[prop];
                            }
                            local[applet.idname] = id;
                            local[applet.statename] = applet.instances[id];
                            local[resultname] = xmlhttp.responseText;
                            if (engine.evalExpr(success, local, output)) {
                                applet.respond(id, output.result);
                            }
                        }
                    };
                    xmlhttp.open("POST", url, true);
                    xmlhttp.setRequestHeader("Content-Type", "text/xml");
                    xmlhttp.send(data);
                };
            },
            postfile: function(url, fieldid, resultname, success) {
                return function(applet, id) {
                    trace("postfile " + applet.name + "::" + id + " : " + url + " : " + fieldid);
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.onreadystatechange = function() {
                        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                            var local = {};
                            for (prop in applet.local) {
                                local[prop] = applet.local[prop];
                            }
                            local[applet.idname] = id;
                            local[applet.statename] = applet.instances[id];
                            local[resultname] = xmlhttp.responseText;
                            if (engine.evalExpr(success, local, output)) {
                                applet.respond(id, output.result);
                            }
                        }
                    };
                    var field = document.getElementById(fieldid);
                    var formData = new FormData();
                    formData.append("upload", field.files[0]);
                    field.files = null;
                    xmlhttp.open("POST", url, true);
                    // xmlhttp.setRequestHeader("Content-Type", "multipart/form-data");
                    xmlhttp.send(formData);
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
        lib.appmap = {};
        lib.chmap = {};
        var tempmap;
        var attr;
        var p;
        var oldname;
        var newname;
        var liburl;
        var skip;
        var channel;

        temp = findChildren(xml, "common");
        if (temp.length > 0) {
            temp = getChildren(temp[0]);
            for (i = 0; i < temp.length; i++) {
                if (!engine.evalStmt(temp[i], lib.context, output)) {
                    // throw "Fail";
                }
                for (prop in output) {
                    this.context[prop] = output[prop];
                }
            }
        }

        temp = findChildren(xml, "channel");
        for (i = 0; i < temp.length; i++) {
            name = temp[i].getAttribute("name");
            channel = new Channel(temp[i], engine);
            this.channels[name] = channel;
        }

        temp = findChildren(xml, "applet");
        for (i = 0; i < temp.length; i++) {
            name = temp[i].getAttribute("name");
            applet = new Applet(temp[i], lib.context, engine);
            this.applets[name] = applet;
        }

        for (name in lib.applets) {
            var target = lib.applets[name];
            // for (prop in target.listeners) {
            //     if (lib.applets.hasOwnProperty(prop)) {
            //         applet = lib.applets[prop];
            //         trace(name + " listens applet " + applet.name);
            //         applet.targets.push(target);
            //     }
            // }
            for (prop in target.channels) {
                if (lib.channels.hasOwnProperty(prop)) {
                    channel = lib.channels[prop];
                    trace("applet " + name + " listens channel " + channel.name);
                    channel.targets.push(target);
                }
            }
        }

        doimport = function(url, childlib) {
            var target;
            var channel;
            trace("importing " + url);
            for (prop in varmap[url]) {
                trace("import var " + prop + " as " + varmap[url][prop] + " : " + format(childlib.context[prop]));
                lib.context[varmap[url][prop]] = childlib.context[prop];
            }
            for (name in lib.applets) {
                target = lib.applets[name];
                for (prop in childlib.channels) {
                    if (target.channels.hasOwnProperty(lib.chmap[url][prop])) { //parent applet listens to child applet?
                        channel = childlib.channels[prop];
                        trace("applet " + name + " listens channel " + channel.name);
                        channel.targets.push(target);
                    }
                }
            }
            // for (name in lib.applets) {
            //     target = lib.applets[name];
            //     for (prop in childlib.applets) {
            //         if (target.listeners.hasOwnProperty(lib.appmap[url][prop])) { //parent applet listens to child applet?
            //             applet = childlib.applets[prop];
            //             trace(name + " listens " + applet.name);
            //             applet.targets.push(target);
            //         }
            //     }
            // }
            for (prop in lib.chmap[url]) {
                trace("import channel " + prop + " as " + lib.chmap[url][prop]);
                lib.channels[lib.chmap[url][prop]] = childlib.channels[prop];
            }
            for (prop in lib.appmap[url]) {
                trace("import applet " + prop + " as " + lib.appmap[url][prop]);
                lib.applets[lib.appmap[url][prop]] = childlib.applets[prop];
            }

            if (pending === 0) {
                resume();
            }
        };

        temp = findChildren(xml, "import");
        skip = false;
        for (i = 0; i < temp.length; i++) {
            liburl = temp[i].getAttribute("library");
            // import variable
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
            // import channel
            applets = findChildren(temp[i], "channel");
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
            lib.chmap[liburl] = tempmap;
            // import applet
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
            lib.appmap[liburl] = tempmap;
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
        if (pending === 0) {
            trace("RUN at " + (new Date()).toTimeString().slice(0, 8));
            ids = [];
            for (name in lib.applets) {
                applet = lib.applets[name];
                elements = document.getElementsByClassName("applet-" + name);
                for (i = 0; i < elements.length; i++) {
                    element = elements[i];
                    id = element.getAttribute("id");
                    if (id !== null && id !== "") {
                        if (!applet.exists(id)) {
                            // applet.create(id, element, lib.applets);
                            ids.push({
                                id: id,
                                applet: applet,
                                element: element
                            });
                        }
                    }
                }
            }
            for (i in ids) {
                ids[i].applet.create(ids[i].id, ids[i].element, lib.applets);
            }
            for (name in lib.applets) {
                applet = lib.applets[name];
                for (id in applet.instances) {
                    element = document.getElementById(id);
                    if (element === null) {
                        applet.destroy(id);
                    } else {
                        applet.run(id);
                    }
                }
            }
        }
    };
    var active = false;
    var initlib = function(url, lib) {
        var prop;

        lib.context.core.appletclass = function(name) {
            for (prop in lib.applets) {
                if (lib.applets[prop].name === name) {
                    return "applet-" + prop;
                }
            }
            trace("applet " + name + " not found");
        };

        activelib = lib;
        if (extcallback) {
            extcallback(lib.channels);
        }
        runlib(url, lib);
    };
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

    console.log("Fabula Interpreter v0.1.1");
    getLib(url, initlib);
}
trace = function(msg) {
    console.log(msg);
};
notrace = function(msg) {};