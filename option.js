let blockList = {};
const select = document.querySelector('.select');
document.addEventListener('DOMContentLoaded', function(){
    chrome.storage.sync.get('blockList', function(ret){
        blockList = ret.blockList;
        updateList(blockList);
    });
});

document.querySelector('.delete').addEventListener("click", function(){
    const sites = document.querySelectorAll('.check');
    sites.forEach(s => {
       if(s.firstElementChild.checked) delete blockList[s.innerText];
    });
    console.log(blockList);
    chrome.storage.sync.set({'blockList': blockList});
    updateList(blockList);
});

function updateList(list){
    let listStr = '';
    for (const site in list) {
        listStr += `<div class="check"><input type="checkbox"/>${site}</div>`;
    }
    select.innerHTML = listStr;
}

