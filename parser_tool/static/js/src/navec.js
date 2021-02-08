(function ($) {
    const ApiClient = window.app.ApiClient;

    async function ready() {
        const api = new ApiClient();

        console.log('vector function working!')

        $('#output1').empty();

        var input_text = $("#contentinput").val();

        const jqXhr = api.getNavecVec(input_text);

        $('#loading1').css('display', 'block');

        jqXhr.then(function (result, textStatus) {
            console.log('vector jqXhr loaded');
            $('#loading1').css('display', 'none');
            $('#output1').append('<p>' + 'Vector Representation of ' + input_text + '</p>')
            result.vector.forEach(elt => {
                $('#output1').append('<p>' + elt + '</p>')
            });
        })
    }
    async function similar() {
        const api = new ApiClient();

        $('#output2').empty();

        console.log('similarity function working!')

        var input_text = $("#contentinput").val();

        // getNavecSimilar
        const jqXhr = api.getNavecSimilar(input_text);

        $('#loading2').css('display', 'block');

        jqXhr.then(function (result, textStatus) {
            console.log('similar jqXhr loaded');
            $('#loading2').css('display', 'none');
            console.log(result);
            $('#output2').append('<p>' + 'Similar words to ' + input_text + ' (above .5) </p>')
            result.similar.forEach(elt => {
                $('#output2').append('<p>' + elt[0] + ': ' + elt[1] + '</p>')
            });
        });
    }

    $(document).ready(async function () {
        console.log("ready!");
        $("#submit").on("click", ready);
        $("#similar").on("click", similar);
    });

    // // Just execute "demo()" in the console to populate the input with sample HTML.
    window.demo = function () {
        // happiness
        $("#contentinput").val('счастье');
    }

})(jQuery);