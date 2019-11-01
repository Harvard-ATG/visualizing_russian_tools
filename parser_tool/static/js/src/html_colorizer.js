(function(global, $) {
  "use strict";

  const ApiClient = global.app.ApiClient;

  function colorizehtml(input_html) {
    const api = new ApiClient();
    return api.colorizehtml(input_html).then((res) => {
      return res;
    });
  }

  async function processHtml() {
    const input_html = $("#contentinput").val();
    writeframe('inputpreview', input_html);
    writeframe('outputpreview', 'Processing...');

    const output_html = await colorizehtml(input_html);
    writeframe('outputpreview', output_html);
    $("#outputhtml").val(output_html);
    $("#results").show();
  }

  function writeframe(id, html) {
    var iframe = document.createElement('iframe');
    iframe.className = "previewhtml";
    document.getElementById(id).innerHTML = "";
    document.getElementById(id).appendChild(iframe);

    // Note: using this method instead of:
    //    iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
    // because it handles larger strings/html
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
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
    $('#colorizebtn').on('click', processHtml);
    $("#copytoclipboard").on("click", copy);
  });

})(window, jQuery);
