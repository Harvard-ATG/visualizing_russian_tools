(function($) {
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

        lemmatize(content) {
            var url = this._url('/api/lemmatize');
            var settings = {method: "POST", data: JSON.stringify(content)};
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
    }

    // Exports
    window.VZR = window.VZR || {};
    window.VZR.ApiClient = ApiClient;
})(jQuery);