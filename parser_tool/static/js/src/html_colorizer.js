(function($) {
  "use strict";

  const ApiClient = window.app.ApiClient;

  async function colorize() {
    const api = new ApiClient();
    const input_html = $("#contentinput").val();
    try {
      before_colorize(input_html);
      const output_html = await api.colorize_html(input_html);
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

  // Just execute "demo()" in the console to populate the input with sample HTML.
  window.demo = function() {
    var html = `
<div class="paragraph_wrapper"><div class="body_copy"><span style="font-size:medium"><span style="font-family:&quot;Times New Roman&quot;, serif"><span style="caret-color:#000000"><span style="color:#000000"><span style="font-style:normal"><span style="font-variant-caps:normal"><span style="font-weight:normal"><span style="letter-spacing:normal"><span style="orphans:auto"><span style="text-transform:none"><span style="white-space:normal"><span style="widows:auto"><span style="word-spacing:0px"><span style="-webkit-text-size-adjust:auto"><span style="text-decoration:none"><span style="line-height:24px"><span lang="RU" style="line-height:24px"><span style="font-family:Cambria, serif">1.&nbsp;&nbsp;&nbsp;Мама, папа, Ва́ся хоро́ший, вот уви́дите! Вы его обяза́тельно ________________________.&nbsp;</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><br><span style="font-size:medium"><span style="font-family:&quot;Times New Roman&quot;, serif"><span style="caret-color:#000000"><span style="color:#000000"><span style="font-style:normal"><span style="font-variant-caps:normal"><span style="font-weight:normal"><span style="letter-spacing:normal"><span style="orphans:auto"><span style="text-transform:none"><span style="white-space:normal"><span style="widows:auto"><span style="word-spacing:0px"><span style="-webkit-text-size-adjust:auto"><span style="text-decoration:none"><span style="line-height:24px"><span lang="RU" style="line-height:24px"><span style="font-family:Cambria, serif">2.&nbsp;&nbsp;&nbsp;После рабо́ты мы не ________________________ говори́ть об университе́тских дела́х, проблема́х педаго́гики и образова́ния.&nbsp;</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><br><span style="font-size:medium"><span style="font-family:&quot;Times New Roman&quot;, serif"><span style="caret-color:#000000"><span style="color:#000000"><span style="font-style:normal"><span style="font-variant-caps:normal"><span style="font-weight:normal"><span style="letter-spacing:normal"><span style="orphans:auto"><span style="text-transform:none"><span style="white-space:normal"><span style="widows:auto"><span style="word-spacing:0px"><span style="-webkit-text-size-adjust:auto"><span style="text-decoration:none"><span style="line-height:24px"><span lang="RU" style="line-height:24px"><span style="font-family:Cambria, serif">3.&nbsp;&nbsp;&nbsp;Они ________________________ друг дру́га по́сле трёх лет знако́мства.&nbsp;</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><br><span style="font-size:medium"><span style="font-family:&quot;Times New Roman&quot;, serif"><span style="caret-color:#000000"><span style="color:#000000"><span style="font-style:normal"><span style="font-variant-caps:normal"><span style="font-weight:normal"><span style="letter-spacing:normal"><span style="orphans:auto"><span style="text-transform:none"><span style="white-space:normal"><span style="widows:auto"><span style="word-spacing:0px"><span style="-webkit-text-size-adjust:auto"><span style="text-decoration:none"><span style="line-height:24px"><span lang="RU" style="line-height:24px"><span style="font-family:Cambria, serif">4.&nbsp;&nbsp;&nbsp;У нас в ко́лледже отли́чников никто́ не ________________________ .&nbsp;</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><br><span style="font-size:medium"><span style="font-family:&quot;Times New Roman&quot;, serif"><span style="caret-color:#000000"><span style="color:#000000"><span style="font-style:normal"><span style="font-variant-caps:normal"><span style="font-weight:normal"><span style="letter-spacing:normal"><span style="orphans:auto"><span style="text-transform:none"><span style="white-space:normal"><span style="widows:auto"><span style="word-spacing:0px"><span style="-webkit-text-size-adjust:auto"><span style="text-decoration:none"><span style="line-height:24px"><span lang="RU" style="line-height:24px"><span style="font-family:Cambria, serif">5.&nbsp;&nbsp;&nbsp;Я не ________________________ ходи́ть на дополни́тельные заня́тия.&nbsp;</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><br><span style="font-size:medium"><span style="font-family:&quot;Times New Roman&quot;, serif"><span style="caret-color:#000000"><span style="color:#000000"><span style="font-style:normal"><span style="font-variant-caps:normal"><span style="font-weight:normal"><span style="letter-spacing:normal"><span style="orphans:auto"><span style="text-transform:none"><span style="white-space:normal"><span style="widows:auto"><span style="word-spacing:0px"><span style="-webkit-text-size-adjust:auto"><span style="text-decoration:none"><span style="line-height:24px"><span lang="RU" style="line-height:24px"><span style="font-family:Cambria, serif">6.&nbsp;&nbsp;&nbsp;В аспиранту́ре Лёня наконе́ц-то ________________________ писа́ть конспе́кты.&nbsp;</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><br></div></div>
`;
    $("#contentinput").val(html);
  }

})(jQuery);
