function Plugin() {
    this.init = function(channels) {};
    this.attach = function(id, element, applet) {
        if (applet.name === "code-viewer") {
            // CodeMirror.runMode(element.innerHTML, "xml", element);
            var cm = CodeMirror.fromTextArea(element, {
                mode: "xml",
                readOnly: true,
                scrollbarStyle: "null"
            });
            var n = cm.doc.lineCount();
            var h = cm.defaultTextHeight();
            cm.setSize(null, n * h);
        }
    };
    this.run = function() {
        $(function () {
          $('[data-toggle="tooltip"]').tooltip();
        });
    };
}