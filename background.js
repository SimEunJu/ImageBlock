chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({'blockList': {}});
});

let blockList = {};
chrome.storage.sync.get('blockList', function(ret){
  blockList = ret.blockList;
});
let on = true;

chrome.tabs.onUpdated.addListener(function(id, info, tab) {
  chrome.storage.sync.get('blockList', function(ret){
    blockList = ret.blockList;
    if(on && !blockList[extractUrl(tab.url)] && info.status==='loading'){
      chrome.tabs.insertCSS(null, {
        code: "img, iframe{visibility: hidden !important; a, div, span{background-image:none !important;}}",
          allFrames: true,
          runAt: "document_start"
      });
    }
  });
});

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse){
  chrome.storage.sync.get('blockList', function(ret){
    blockList = ret.blockList;
  });
  switch(req.type){
    case 'add':
      const _url = extractUrl(req.url);
      if(blockList[_url]) break;
      blockList[_url] = _url;
      chrome.storage.sync.set({'blockList': blockList})
      sendResponse({'add': true});
      console.log(blockList);
      break;
    case 'remove':
      const url = extractUrl(req.url);
      delete blockList[url];
      chrome.storage.sync.set({'blockList': blockList});
      sendResponse({'remove': true});
      console.log(blockList);
      break;
    case 'tempBlock':
      on = true;
      chrome.tabs.reload();
      sendResponse({'tempBlock': true});
      break;
    case 'tempUnblock':
      on = false;
      chrome.tabs.reload();
      sendResponse({'tempUnblock': true});
      break;
    default: 
      console.error();
  }
});

const URL_REG = new RegExp('(http|https)://\\w+\\.\\w+\\.\\w+','g');
function extractUrl(url){
  const savedUrl = url.match(URL_REG)[0];
  return savedUrl;
}