
document.querySelector(".add").addEventListener("click", function(){
  const self = this;
  let url;
  chrome.tabs.query({'active': true, 'currentWindow': true}, function(tab){
    url = tab[0].url;
    chrome.runtime.sendMessage({'url': url, 'type': 'add'}, function(res){
      if(res.add === true) self.checked = true;
    });
  });
  
});
document.querySelector(".remove").addEventListener("click", function(){
  const self = this;
  let url;
  chrome.tabs.query({'active': true, 'currentWindow': true}, function(tab){
    url = tab[0].url;
    chrome.runtime.sendMessage({'type': 'remove', 'url': url}, function(res){
      if(res.remove === true) self.checked = true;
    });
  });
});
document.querySelector(".tempStop").addEventListener("click", function(){
  const self = this;
  console.dir(self.checked);
  if(self.checked){
    console.log('unchecked');
    chrome.runtime.sendMessage({'type': 'tempStop', 'on': false}, function(res){
      console.log(res);
    });
  }else{
    chrome.runtime.sendMessage({'type': 'tempStop', 'on': true}, function(res){
      console.log(res);
    })
  }
});

