(function(global, $) {
    "use strict";

    class ApiClient {
        constructor() {
            this.api_base_url = "";
            this.ajax_settings = {
                dataType: "json",
                contentType: "application/json"
            };
        }

        _url(path, params) {
            params = params || {};
            var url = `${this.api_base_url}${path}`;
            var querystring = this._querystring(params);
            if(querystring) {
                url = `${url}?${querystring}`;
            }
            return url;
        }

        _querystring(params) {
            var esc = encodeURIComponent;
            return Object.keys(params).map(k => esc(k) + '=' + esc(params[k])).join('&');
        }

        _ajax(url, settings) {
            settings = $.extend(this.ajax_settings, settings);
            return $.ajax(url, settings);
        }

        tokenize(content) {
            var url = this._url('/api/tokenize');
            var settings = {method: "POST", data: JSON.stringify(content)};
            var jqXhr = this._ajax(url, settings);
            return jqXhr;
        }

        lemmatizetext(content) {
            var url = this._url('/api/lemmatize');
            var settings = {method: "POST", data: JSON.stringify({text: content})};
            var jqXhr = this._ajax(url, settings);
            return jqXhr;
        }

        lemmatizeword(word) {
            var url = this._url('/api/lemmatize');
            var settings = {method: "GET", data: {word: word}};
            var jqXhr = this._ajax(url, settings);
            return jqXhr;
        }

        getLemmaById(lemma_id) {
            var url = this._url('/api/lemma');
            var settings = {method: "GET", data: {id: lemma_id}};
            var jqXhr = this._ajax(url, settings);
            return jqXhr;
        }

        parsetext(content, params) {
            params = params || {};
            var url = this._url('/api/parsetext', params);
            var settings = {method: "POST", data: JSON.stringify(content)};
            var jqXhr = this._ajax(url, settings);
            return jqXhr;
        }

        colorize_html(html, params) {
            params = params || {};
            var url = this._url('/api/colorize/html', params);
            var settings = {
                method: "POST",
                headers: {'Content-Type':'text/html'},
                dataType: "text",
                data: html
            };
            var jqXhr = this._ajax(url, settings);
            return jqXhr;
        }

        colorize_elements(elements, params) {
            params = params || {};
            var url = this._url('/api/colorize/elements', params);
            var settings = {
                method: "POST",
                headers: {'Content-Type':'application/json'},
                dataType: "json",
                data: elements
            };
            var jqXhr = this._ajax(url, settings);
            return jqXhr;
        }
    }

    // Exports
    global.app = global.app || {};
    global.app.ApiClient = ApiClient;
})(window, jQuery);
