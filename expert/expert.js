function EditorWrapper(id, channel) {
    var cm = CodeMirror.fromTextArea(document.getElementById(id), {
        mode: "xml",
        lineNumbers: true,
        autoCloseBrackets: true,
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    });
    cm.setSize(null, 400);
    this.size = 400;
    cm.on("cursorActivity", function(sender) {
        channel.send(sender.doc.getCursor());
    });
    this.validate = function(callback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                callback(xmlhttp.responseText);
            }
        };
        xmlhttp.open("POST", "validate.php", true);
        xmlhttp.setRequestHeader("Content-Type", "text/xml");
        xmlhttp.send(cm.doc.getValue());
    };
    this.insert = function(text) {
        cm.doc.replaceSelection(text);
    };
    this.sizeUp = function() {
        this.size += 200;
        cm.setSize(null, this.size);
    };
    this.sizeDown = function() {
        if (this.size > 200) {
            this.size -= 200;
            cm.setSize(null, this.size);
        }
    };
}

function WaitText(action) {
    return action + "...<img src='ani-busy.gif'/>";
}