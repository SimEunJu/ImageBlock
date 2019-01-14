chrome.tabs.onUpdated.addListener(function() {
  chrome.tabs.insertCSS(null, {
    code: "img{visibility: hidden !important;} a{background-image:none !important;} div{background-image:none !important;} span{background-image:none !important;} iframe{visibility: hidden !important}",
      allFrames: true,
      runAt: "document_start"
  });
});
const blockList;
chrome.runtime.onMessage.addListener(function(req, sender, sendResponse){
  blockList = chrome.storage.sync.get('blockList').split(',');
  switch(req){
    case 'add':
      if(blockList.indexOf(req.add)) break;
      blockList.push(req.add);
      chrome.storage.sync.set({'blockList': blockList.join(',')})
      sendResponse({'add': true});
      break;
    case 'remove':
      const idx = blockList.indexOf(req.remove);
      blockList = blockList.splice(idx, 1);
      chrome.storage.sync.set({'blockList': blockList.join(',')});
      sendResponse({'remove': true});
      break;
    default: 
      console.error();
  }
});