<?php
/*
	Fabula Code Expert
*/
    function getChildren($node) {
        $result = array();
        foreach ($node->childNodes as $child) {
            if ($child->nodeType != XML_NODE_COMMENT && ($child->nodeType != XML_NODE_TEXT || trim($child->nodeValue) != "")) {
                array_push($result, $child);
            }
        }
        return $result;
    }

    // function firstExpr($node) {
    //     $first = 0;
    //     while ($node->childNodes[i]->nodeType == XML_NODE_COMMENT || ($node->childNodes[i]->nodeType == XML_NODE_TEXT && trim($node->childNodes[i]->nodeValue) == "")) {
    //         $first++;
    //     }
    //     return $node->childNodes[$first];
    // }

    // function findChild($node, $name) {
    //     for ($node->childNodes as $child) {
    //         if ($child->nodeName == $name) {
    //             return $child;
    //         }
    //     }
    //     throw new Exception("Error: ".$name." not found");
    // }

    function findChildren($node, $name) {
        $result = array();
        foreach ($node->childNodes as $child) {
            if ($child->nodeName == $name) {
                array_push($result, $child);
            }
        }
        return $result;
    }

    function single($a, $name) {
        if ($a->length > 1) {
            throw new Exception("More than one ".$name);
        } else if ($a->length == 0) {
            throw new Exception("Missing ".$name);
        }
        return $a[0];
    }

class FabType {
	const TNULL = 0;
	const TSTRING = 1;
	const TINTEGER = 2;
	const TNUMBER = 3;
	const TTIME = 4;
	const TINTERVAL = 5;
	const TARRAY = 6;
	const TDICTIONARY = 7;
	const TALL = 9;
	const TANY = 10;
	const TFUNCTION = 11;
	const TACTION = 12;
	const TDYNAMIC = 13;

	protected $kind;

	public function asNode(DOMDocument $doc) {

	}

	public function covariant(FabType $other) {
		return $this->kind == $other->kind || $other->kind == self::TDYNAMIC;
	}

	public static function create(DOMNode $node) {

	}

}

class FabTypeNull extends FabType {

	function __construct() {
		$this->kind = self::TNULL;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("null");
        return $result;
	}
}

class FabTypeString extends FabType {

	function __construct() {
		$this->kind = self::TSTRING;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("string");
        return $result;
	}
}

class FabTypeInteger extends FabType {

	function __construct() {
		$this->kind = self::TINTEGER;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("integer");
        return $result;
	}

	public function covariant(FabType $other) {
		return $this->kind == $other->kind || $other->kind == self::TNUMBER || $other->kind == self::TDYNAMIC;
	}
}

class FabTypeNumber extends FabType {

	function __construct() {
		$this->kind = self::TNUMBER;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("number");
        return $result;
	}
}

class FabTypeTime extends FabType {

	function __construct() {
		$this->kind = self::TTIME;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("time");
        return $result;
	}
}

class FabTypeInterval extends FabType {

	function __construct() {
		$this->kind = self::TINTERVAL;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("interval");
        return $result;
	}
}

class FabTypeAction extends FabType {

	function __construct() {
		$this->kind = self::TACTION;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("action");
        return $result;
	}
}

class FabTypeDynamic extends FabType {

	function __construct() {
		$this->kind = self::TDYNAMIC;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("dynamic");
        return $result;
	}
}

class FabTypeArray extends FabType {

	private $item;

	function __construct(FabType $item) {
		$this->kind = self::TARRAY;
		$this->item = $item;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("array");
		$result->appendChild($item->asNode());
        return $result;
	}

	public function covariant(FabType $other) {
		return ($other->kind == self::TARRAY && $this->item->covariant($other->item)) || $other->kind == self::TDYNAMIC;
	}
}

class FabTypeDictionary extends FabType {

	private $item;

	function __construct(FabType $item) {
		$this->kind = self::TDICTIONARY;
		$this->item = $item;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("dictionary");
		$result->appendChild($item->asNode());
        return $result;
	}

	public function covariant(FabType $other) {
		return ($other->kind == self::TDICTIONARY && $this->item->covariant($other->item)) || $other->kind == self::TDYNAMIC;
	}
}

class FabTypeFunction extends FabType {

	private $arg;
	private $result;

	function __construct(FabType $arg, FabType $result) {
		$this->kind = self::TFUNCTION;
		$this->arg = $arg;
		$this->result = $result;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("function");
		$result->appendChild($arg->asNode());
		$result->appendChild($result->asNode());
        return $result;
	}

	public function covariant(FabType $other) {
		return ($other->kind == self::TFUNCTION && $this->result->covariant($other->result) && $other->arg->covariant($this->arg)) || $other->kind == self::TDYNAMIC;
	}
}

class FabTypeAll extends FabType {

	private $members;

	function __construct($members) {
		$this->kind = self::TALL;
		$this->members = $members;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("all");
		foreach ($this->members as $key => $value) {
			$prop = $doc->createElement("prop");
			$attr = $doc->createAttribute("name");
			$attr->value = $key;
			$prop->appendChild($attr);
			$prop->appendChild($value->asNode());
			$result->appendChild($prop);
		}
        return $result;
	}

	public function covariant(FabType $other) {
		if ($other->kind == self::TDYNAMIC) {
			return TRUE;
		}
		if ($other->kind == self::TALL) {
			foreach ($this->members as $key => $value) {
				$prop = $other->members[$key];
				if (!$prop || !($value->covariant($prop))) {
					return FALSE;
				}
			}
			return TRUE;
		}
		return FALSE;
	}
}

class FabTypeAny extends FabType {

	private $members;

	function __construct($members) {
		$this->kind = self::TANY;
		$this->members = $members;
	}

	public function asNode(DOMDocument $doc) {
		$result = $doc->createElement("any");
		foreach ($this->members as $key => $value) {
			$prop = $doc->createElement("prop");
			$attr = $doc->createAttribute("name");
			$attr->value = $key;
			$prop->appendChild($attr);
			$prop->appendChild($value->asNode());
			$result->appendChild($prop);
		}
        return $result;
	}

	public function covariant(FabType $other) {
		if ($other->kind == self::TDYNAMIC) {
			return TRUE;
		}
		if ($other->kind == self::TANY) {
			foreach ($other->members as $key => $value) {
				$prop = $this->members[$key];
				if (!$prop || !($prop->covariant($value))) {
					return FALSE;
				}
			}
			return TRUE;
		}
		return FALSE;
	}
}

class FabExpr {
	
    protected $errors = array();
    protected $comments = array();
    public $type;

	public function asNode(DOMDocument $doc) {
        return "";
	}

	public static function create(DOMNode $node) {
		if ($node->nodeType == XML_NODE_TEXT) {
			$result = new FabFormula($node->nodeValue);
		} else {
			switch ($node->nodeName) {
				case 'text':
					$result = new FabExprText(DOMinnerHTML($node));
					break;
				
				default:
					# code...
					break;
			}
		}
		return $result;
	}
}

function DOMinnerHTML(DOMNode $element) 
{ 
    $innerHTML = ""; 
    $children  = $element->childNodes;

    foreach ($children as $child) 
    { 
        $innerHTML .= $element->ownerDocument->saveHTML($child);
    }

    return $innerHTML; 
} 

class FabFormula extends FabExpr {
	
	private $text;

	function __construct($node) {
		$this->text = $node->nodeValue;

	}

	public function asNode(DOMDocument $doc) {
        $textnode = $doc->createTextNode($this->text);
        if ($this->errors) {
	    	$result = $doc->createElement("calc");
	    	$result->appendChild($textnode);
	    	foreach ($this->errors as $value) {
	    		$error = $result->createElement("error", $value);
	    		$result->appendChild($error);
	    	}
        } else {
        	$result = $textnode;
        }

        return $result;
	}

}

class FabExprText extends FabExpr {
	
	private $text;

	function __construct($node) {
		$this->text = DOMinnerHTML($node);
	}

	public function asNode($doc) {
        // $textnode = $doc->createTextNode($this->text);
    	$result = $doc->createElement("text", $this->text);
    	// $result->appendChild($textnode);
    	foreach ($this->errors as $value) {
    		$error = $result->createElement("error", $value);
    		$result->appendChild($error);
    	}

        return $result;
	}

}

class FabApplet {
	
    private $errors = array();
    private $comments = array();
    private $state;
    private $content;
    private $initstate;
    private $initactions = array();
    private $respstate;
    private $respactions = array();
    private $events = array();
    private $accept = array();

	function __construct($node) {
    	if ($node->hasAttribute("name")) {
    		$name = $node->getAttribute("name");
	        foreach ($node->childNodes() as $child) {
        		if ($child->nodeType == XML_NODE_ELEMENT) {
		            switch ($child->nodeName) {
		                case "state":
		                break;

		                default:
	                    	$error = "Invalid element at line ".$child->getLineNo().": ".$child->nodeName;
		                    array_push($this->errors, $error);
		            }
			    } elseif ($child->nodeType == XML_NODE_COMMENT) {
		            array_push($this->comments, $child->nodeValue);
			    } else {
		        	$error = "Invalid node at line ".$child->getLineNo().": ".$child->nodeName;
		            array_push($this->errors, $error);
			    }
	        }
        } else {
        	$error = "Applet definition at line ".$node->getLineNo()." has no name attribute";
        	array_push($this->errors, $error);
    	}
	}

	public function asElement($doc) {
        $result = $doc->createElement("applet");

        return $result;
	}
}

class FabLibrary {

    private $types = array();
    private $common = array();
    private $applets = array();
    private $errors = array();
    private $comments = array();

	function __construct($node) {
        if ($node->nodeType == XML_NODE_ELEMENT && $node->nodeName == "library") {
	        foreach ($node->childNodes() as $child) {
        		if ($child->nodeType == XML_NODE_ELEMENT) {
		            switch ($child->nodeName) {
		                case "typedef":
			            	// if (child->hasAttribute("name")) {
			            		$type = FabType::create($child);
			            		array_push($this->types, $type);
		              //       } else {
		              //       	$error = "Type definition at line ".$child->getLineNo()." has no name attribute";
		              //       	array_push($errors, $error);
			            	// }
			            	break;
		                case "common":
		                	$children = $child->childNodes;
		                	foreach ($children as $value) {
			            		$stmt = FabStmt::create($value);
			            		array_push($this->common, $stmt);
		                	}
			            	break;
		                case "applet":
		            		$applet = new FabApplet($child);
		            		array_push($this->applets, $applet);
			            	break;
		                default:
	                    	$error = "Invalid element at line ".$child->getLineNo().": ".$child->nodeName;
		                    array_push($this->errors, $error);
			        }
			    } elseif ($child->nodeType == XML_NODE_COMMENT) {
		            array_push($this->comments, $child->nodeValue);
			    } else {
		        	$error = "Invalid node at line ".$child->getLineNo().": ".$child->nodeName;
		            array_push($this->errors, $error);
			    }
	        }
        } else {
        	$error = "Invalid node at line ".$node->getLineNo().": ".$node->nodeName;
            array_push($this->errors, $error);
	    }
	}

	public function asDocument() {
        $result = new DOMDocument();
    	foreach ($this->comments as $value) {
    		$comment = $result->createComment($value);
    		$result->appendChild($comment);
    	}
    	foreach ($this->errors as $value) {
    		$error = $result->createElement("error", $value);
    		$result->appendChild($error);
    	}
    	foreach ($this->types as $value) {
    		$result->appendChild($value->asElement($result));
    	}
    	foreach ($this->applets as $value) {
    		$result->appendChild($value->asElement($result));
    	}
        
        return $result;
	}
}

require_once(__DIR__ . '/../PhpConsole/src/PhpConsole/__autoload.php');
$connector = PhpConsole\Connector::getInstance();
$connector->setPassword('asteroid11', true);
PhpConsole\Helper::register();

session_start();
// if ($_SESSION["authorized"]) {
	$postdata = file_get_contents('php://input');
	libxml_use_internal_errors(true);
	$doc = new DOMDocument();
	$doc->loadXML($postdata);
	if (libxml_get_last_error()) {
		// $output = new SimpleXMLElement('<parseerrors/>');
	    foreach(libxml_get_errors() as $error) {
	    	// $row = $output->addChild('error', $error->message);
	    	print($error->message."<br/>");
			// PC::debug($error->message, 'test');
	    }
		// Header('Content-type: text/xml');
		// print($output->asXML());    
		// print($postdata);
	} else {
		// $library = new FabLibrary($doc);
		// Header('Content-type: text/xml');
		// print($library->asDocument()->saveXML());    
		print("No errors were found");
	}
// } else {
// 		Header('Content-type: text/xml');
// 		print('<authorization/>');    
// }
/*    function analyzeApplet(code, context) {
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

        var scanner = /\s*(-?\d*\.\d+)|(-?\d+)|(\w+)|(\".*?\")|('.*?')|(`.*?`)|(#)|(@)|(\+)|(-)|(\*)|(\/)|(\.)|(\()|(\))|(\[)|(\])|(\{)|(\})|(:)|(,)|(<=?)|(\/?=)|(>=?)/g;
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
                    info = analyzeType(firstExpr(expr), context);
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

*/
?>
