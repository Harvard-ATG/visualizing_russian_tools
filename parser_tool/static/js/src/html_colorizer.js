(function(global, $) {
  "use strict";

  const ApiClient = global.app.ApiClient;

  async function colorize() {
    const api = new ApiClient();
    const input_html = $("#contentinput").val();
    try {
      before_colorize(input_html);
      const output_html = await api.colorizehtml(input_html);
      after_colorize(output_html);
    } catch(err) {
      error(err);
    }
  }

  function before_colorize(input_html) {
    $("#colorizeerror").html("").hide();
    $("#outputhtml").val("");
    $("#results").hide();

    writeframe('inputpreview', input_html);
    writeframe('outputpreview', 'Processing...');
  }

  function after_colorize(output_html) {
    writeframe('outputpreview', output_html, {cssLink: "/static/css/colorization.css"});
    $("#outputhtml").val(output_html);
    $("#results").show();
  }

  function error(err) {
    console.log("Error colorizing HTML:", err);
    $("#colorizeerror").html(err.statusText || "Error colorizing HTML").show();
    writeframe('outputpreview', 'Error');
  }

  function writeframe(id, html, options) {
    options = options || {};

    const iframe = document.createElement('iframe');
    iframe.className = "previewhtml";
    document.getElementById(id).innerHTML = "";
    document.getElementById(id).appendChild(iframe);

    // Note: using this method instead of:
    //    iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
    // because it handles larger strings/html
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();

    if(iframe.contentWindow.document.head && options.cssLink) {
      const link = document.createElement("link");
      link.href = options.cssLink;
      link.type = "text/css";
      link.rel = "stylesheet";
      iframe.contentWindow.document.head.appendChild(link);
    }
  }

  function copy() {
    var copyText = document.querySelector("#outputhtml");
    copyText.select();
    document.execCommand("copy");
  }

  $(document).ready(function () {
    $("textarea#output_html").focus(function() {
      $(this).select();
    });
    $('#colorizebtn').on('click', colorize);
    $("#copytoclipboard").on("click", copy);
  });

})(window, jQuery);
