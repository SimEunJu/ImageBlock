let blockList = [];
const select = document.querySelector('.select');
document.addEventListener('DOMContentLoaded', function(){
    chrome.storage.sync.get('blockList', function(ret){
        blockList = ret.blockList.split(',');
        updateList(blockList);
    });
});
const sites = document.querySelectorAll('option');
const checkedSites = [];
document.querySelector('.delete').addEventListener("click", function(){
   sites.forEach(s => {
       if(!s.checked) checkedSites.push(s);
   });
   chrome.storage.sync.set({'blockList': checkedSites.join(',')});
   updateList(checkedSites);
});

function updateList(list){
    let listStr = '';
    list.forEach((i, idx) => listStr += `<input type="checkbox">${i}</option>`);
    select.innerHTML = listStr;
}