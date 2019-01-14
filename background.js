chrome.tabs.onUpdated.addListener(function() {
  chrome.tabs.insertCSS(null, {
    code: "img{visibility: hidden !important;} a, div, span{background-image:none !important;} iframe img{visibility: hidden !important;}",
      runAt: "document_start",
      allFrames: true
  });
});
// chrome.runtime.onMessage.addListener(function(req, sender, sendResponse){
//   chrome.tabs.executeScript(
//     {
//       file : "./block_img.js"
//     }
//   );
//   sendResponse({result: "okay"});
// });