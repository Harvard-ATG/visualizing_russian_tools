(function ($) {
    $(document).ready(async function () {
        console.log("ready!");
        $(document).on("click", "button.options", function (event) {
            console.log('click options')
            window.location.href = 'spot-it';
        })
    })
})(jQuery);