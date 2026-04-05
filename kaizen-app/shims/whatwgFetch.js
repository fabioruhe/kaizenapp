// Shim vazio: impede que whatwg-fetch sobrescreva global.fetch.
// O React Native já possui fetch nativo (NSURLSession no iOS),
// que funciona corretamente. Não precisamos de polyfill.
