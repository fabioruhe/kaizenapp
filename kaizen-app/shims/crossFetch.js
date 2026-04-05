'use strict';
// Substitui cross-fetch pelo fetch nativo do React Native (NSURLSession no iOS).
// O cross-fetch usa whatwg-fetch (XHR-based) que falha no simulador iOS.
var nativeFetch   = global.fetch.bind(global);
var nativeHeaders = global.Headers;
var nativeRequest = global.Request;
var nativeResponse = global.Response;

module.exports            = nativeFetch;
module.exports.default    = nativeFetch;
module.exports.fetch      = nativeFetch;
module.exports.Headers    = nativeHeaders;
module.exports.Request    = nativeRequest;
module.exports.Response   = nativeResponse;
