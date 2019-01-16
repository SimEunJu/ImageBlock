const URL_REG = new RegExp('(http|https)://\\w+\\.\\w+\\.\\w+','g');
function extractUrl(url){
  const savedUrl = url.match(URL_REG)[0];
  return savedUrl;
}
const add = document.querySelector(".add");
const remove = document.querySelector(".remove");
document.addEventListener('DOMContentLoaded', function(){
  chrome.storage.sync.get('blockList', function(ret){
    let url;
    chrome.tabs.query({'active': true, 'currentWindow': true}, function(tab){
      url = extractUrl(tab[0].url);
      if(ret.blockList[url]) add.firstElementChild.checked = true;
    });
  });
});

add.addEventListener("click", function(){
  let url;
  chrome.tabs.query({'active': true, 'currentWindow': true}, function(tab){
    url = tab[0].url;
    chrome.runtime.sendMessage({'url': url, 'type': 'add'}, function(res){
      remove.firstElementChild.check = false;
      console.log(res.add);
    });
  });
  
});
remove.addEventListener("click", function(){
  const self = this;
  let url;
  chrome.tabs.query({'active': true, 'currentWindow': true}, function(tab){
    url = tab[0].url;
    chrome.runtime.sendMessage({'type': 'remove', 'url': url}, function(res){
      add.firstElementChild.checked = false;
      console.log(res.remove);
    });
  });
});

const tempBlock = document.querySelector(".tempBlock");
const tempUnblock = document.querySelector(".tempUnblock");

tempUnblock.addEventListener("click", function(){
  chrome.runtime.sendMessage({'type': 'tempUnblock'}, function(res){
    tempBlock.firstElementChild.checked = false;
    console.log(res);
  });
});
tempBlock.addEventListener("click", function(){
  chrome.runtime.sendMessage({'type': 'tempBlock'}, function(res){
    tempUnblock.firstElementChild.checked = false;
    console.log(res);
  });
});

document.querySelector("button").addEventListener("click", function(){
  chrome.runtime.openOptionsPage();
})