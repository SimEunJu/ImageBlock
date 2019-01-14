document.querySelector(".add").addEventListener("click", function(){
  const self = this;
  chrome.runtime.sendMessage({'add': window.location.origin}, function(res){
    if(res.add === true) this.checked = true;
  });
});
document.querySelector(".remove").addEventListener("click", function(){
  const self = this;
  chrome.runtime.sendMessage({'remove': window.location.origin}, function(res){
    if(res.remove === true) this.checked = true;
  });
});
