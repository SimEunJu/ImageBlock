setInterval(test, 7000);

function test(){
    chrome.runtime.sendMessage({image: "block"}, function(res){
        console.log(res.result);
    });
}
// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         console.log('content script');
//       if (request.greeting == "hello")
//         sendResponse({farewell: "goodbye"});
       
//     });