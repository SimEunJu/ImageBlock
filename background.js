chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({'blockList': ''});
});

let blockList = [];
chrome.storage.sync.get('blockList', function(ret){
  blockList = ret.blockList.split(',');
});
let on = true;
chrome.tabs.onUpdated.addListener(function(id, info, tab) {
  //if(blockList.indexOf(extractUrl(tab.url))) chrome.browserAction.setIcon();
  //else chrome.browserAction.setIcon();
  console.log(on);
  if(on){
    chrome.tabs.insertCSS(null, {
      code: "img{visibility: hidden !important;} a{background-image:none !important;} div{background-image:none !important;} span{background-image:none !important;} iframe{visibility: hidden !important}",
        allFrames: true,
        runAt: "document_start"
    });
  }
});
chrome.runtime.onMessage.addListener(function(req, sender, sendResponse){
  chrome.storage.sync.get('blockList', function(ret){
    blockList = ret.blockList.split(',');
  });
  switch(req.type){
    case 'add':
      console.log(blockList);
      if(blockList.indexOf(req.url) != -1) break;
      blockList.push(extractUrl(req.url));
      chrome.storage.sync.set({'blockList': blockList.join(',')})
      sendResponse({'add': true});
      console.log(blockList);
      break;
    case 'remove':
      const idx = blockList.indexOf(extractUrl(req.url));
      blockList = blockList.splice(idx, 1);
      chrome.storage.sync.set({'blockList': blockList.join(',')});
      sendResponse({'remove': true});
      console.log(blockList);
      break;
    case 'tempStop':
      if(req.on === true){
        on = true;
      }else{
        on = false;
      }
      chrome.tabs.reload();
      sendResponse({'tempStop': true});
      break;
    default: 
      console.error();
  }
});

const URL_REG = new RegExp('(http|https)://www\\.\\w+\\.\\w+','g');
function extractUrl(url){
  const savedUrl = url.match(URL_REG);
  return savedUrl;
}