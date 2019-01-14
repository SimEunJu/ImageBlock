//global variables
var showAll = false, extensionUrl = chrome.extension.getURL(''), urlExtensionUrl = 'url("' + extensionUrl, blankImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', urlBlankImg = 'url("' + blankImg + '")', patternCSSUrl = 'url(' + extensionUrl + "pattern.png" + ')', patternLightUrl = extensionUrl + "pattern-light.png", patternLightCSSUrl = 'url(' + patternLightUrl + ')', eyeCSSUrl = 'url(' + extensionUrl + "eye.svg" + ')', undoCSSUrl = 'url(' + extensionUrl + "undo.png" + ')', tagList = ['IMG', 'DIV', 'SPAN', 'A', 'UL', 'LI', 'TD', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'I', 'STRONG', 'B', 'BIG', 'BUTTON', 'CENTER', 'SECTION', 'TABLE', 'FIGURE', 'ASIDE', 'HEADER', 'VIDEO', 'P', 'ARTICLE', 'PICTURE'], tagListCSS = tagList.join(), iframes = [], contentLoaded = false, settings, quotesRegex = /['"]/g;
//keep track of contentLoaded
window.addEventListener('DOMContentLoaded', function () { contentLoaded = true; });
//start by seeing if is active or is paused etc.
chrome.runtime.sendMessage({ r: 'getSettings' }, function (s) {
    settings = s;
    //if is active - go
    if (!settings.isExcluded && !settings.isExcludedForTab && !settings.isPaused && !settings.isPausedForTab) {
        //change icon
        chrome.runtime.sendMessage({ r: 'setColorIcon', toggle: true });
        //do main window
        DoWin(window, contentLoaded);
    }
    else {
        AddClass(document.documentElement, 'wizmage-show-html');
        var observer = new WebKitMutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                if (m.target.tagName == 'HTML' && m.attributeName == 'class') {
                    if (m.target.className.indexOf('wizmage-show-html') == -1)
                        AddClass(m.target, 'wizmage-show-html');
                }
            }
        });
        observer.observe(document.documentElement, { attributes: true });
    }
});
//catch 'Show Images' option from browser actions
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.r == 'showImages')
        ShowImages();
});
function isImg(el) { return el.tagName == 'IMG'; }
function ShowImages() {
    if (showAll)
        return;
    showAll = true;
    if (window == top)
        chrome.runtime.sendMessage({ r: 'setColorIcon', toggle: false });
    window.wzmShowImages();
    for (var i = 0, max = iframes.length; i < max; i++) {
        try {
            if (iframes[i].contentWindow && iframes[i].contentWindow.wzmShowImages)
                iframes[i].contentWindow.wzmShowImages();
        }
        catch (err) { /*iframe may have been rewritten*/ }
    }
}
function DoWin(win, winContentLoaded) {
    var _settings = settings, //DoWin is only called after settings is set
    doc = win.document, observer = undefined, eye = doc.createElement('div'), mouseMoved = false, mouseEvent, mouseOverEl, elList = [], hasStarted = false;
    //global show images
    win.wzmShowImages = function () {
        if (hasStarted) {
            doc.removeEventListener('keydown', DocKeyDown);
            doc.removeEventListener('mousemove', DocMouseMove);
            win.removeEventListener('scroll', WindowScroll);
            for (var i = 0, max = elList.length; i < max; i++)
                ShowEl.call(elList[i]);
            win.removeEventListener('DOMContentLoaded', Start);
            if (mouseOverEl) {
                DoHover(mouseOverEl, false);
                mouseOverEl = undefined;
            }
            for (var i = 0, bodyChildren = doc.body.children; i < bodyChildren.length; i++) //for some reason, sometimes the eye is removed before
                if (bodyChildren[i] == eye)
                    doc.body.removeChild(eye);
            observer.disconnect();
            RemoveClass(document.documentElement, 'wizmage-running');
        }
        else
            AddClass(document.documentElement, 'wizmage-show-html');
    };
    //start, or register start
    if (winContentLoaded)
        Start();
    else
        win.addEventListener('DOMContentLoaded', Start);
    function DocKeyDown(e) {
        if (e.altKey && e.keyCode == 80 && !_settings.isPaused) { //ALT-p
            _settings.isPaused = true;
            chrome.runtime.sendMessage({ r: 'pause', toggle: true });
            ShowImages();
        }
        else if (mouseOverEl && e.altKey) {
            if (e.keyCode == 65 && mouseOverEl.wzmWizmaged) { //ALT-a
                ShowEl.call(mouseOverEl);
                eye.style.display = 'none';
            }
            else if (e.keyCode == 90 && !mouseOverEl.wzmWizmaged) { //ALT-z
                DoElement.call(mouseOverEl);
                eye.style.display = 'none';
            }
        }
    }
    function DocMouseMove(e) { mouseEvent = e; mouseMoved = true; }
    var windowScrollIX = 0;
    function WindowScroll() {
        var _windowScrollIX = ++windowScrollIX;
        if (mouseOverEl)
            DoHoverVisual(mouseOverEl, false);
        setTimeout(function () {
            if (_windowScrollIX != windowScrollIX)
                return;
            windowScrollIX = 0; //Signal no pending scroll callbacks. CheckMousePosition doesn't run during scroll to avoid showing eye in wrong place.
            mouseMoved = true;
            UpdateElRects();
            CheckMousePosition();
        }, 200);
    }
    //keep track of which image-element mouse if over
    function mouseEntered(e) {
        DoHover(this, true, e);
        e.stopPropagation();
    }
    function mouseLeft(e) {
        DoHover(this, false, e);
    }
    //process all elements with background-image, and observe mutations for new ones
    function Start() {
        //when viewing an image (not a webpage). iFrames, or pdfs may not have body/head
        if (!doc.body || !doc.head || (win == top && doc.body.children.length == 1 && !doc.body.children[0].children.length)) {
            ShowImages();
            return;
        }
        //do elements
        DoElements(doc.body, false);
        //show body
        AddClass(doc.documentElement, 'wizmage-show-html wizmage-running');
        //create eye
        eye.style.display = 'none';
        eye.style.width = eye.style.height = '16px';
        eye.style.position = 'fixed';
        eye.style.zIndex = '100000000';
        eye.style.cursor = 'pointer';
        eye.style.padding = '0';
        eye.style.margin = '0';
        eye.style.opacity = '.5';
        doc.body.appendChild(eye);
        //create temporary div, to eager load background img light for noEye to avoid flicker
        if (_settings.isNoEye) {
            for (var i = 0; i < 8; i++) {
                var div = doc.createElement('div');
                div.style.opacity = div.style.width = div.style.height = '0';
                div.className = 'wizmage-pattern-bg-img wizmage-light wizmage-shade-' + i;
                doc.body.appendChild(div);
            }
        }
        //mutation observer
        observer = new WebKitMutationObserver(function (mutations) {
            var _loop_1 = function (i) {
                var m = mutations[i];
                if (m.type == 'attributes') {
                    if (m.attributeName == 'class') {
                        if (m.target.tagName == 'HTML') {
                            //incase the website is messing with the <html> classes
                            if (m.target.className.indexOf('wizmage-show-html') == -1)
                                AddClass(m.target, 'wizmage-show-html');
                            if (m.target.className.indexOf('wizmage-running') == -1)
                                AddClass(m.target, 'wizmage-running');
                        }
                        var oldHasLazy = m.oldValue != null && m.oldValue.indexOf('lazy') > -1, newHasLazy = m.target.className != null && m.target.className.indexOf('lazy') > -1;
                        if (oldHasLazy != newHasLazy)
                            DoElements(m.target, true);
                    }
                    else if (m.attributeName == 'style' && m.target.style.backgroundImage.indexOf('url(') > -1) {
                        var oldBgImg = void 0, oldBgImgMatch = void 0;
                        if (m.oldValue == null || !(oldBgImgMatch = /background(?:-image)?:[^;]*url\(['"]?(.+?)['"]?\)/.exec(m.oldValue)))
                            oldBgImg = '';
                        else
                            oldBgImg = oldBgImgMatch[1];
                        var imgUrlMatch = /url\(['"]?(.+?)['"]?\)/.exec(m.target.style.backgroundImage);
                        if (imgUrlMatch && oldBgImg != imgUrlMatch[1]) {
                            setTimeout(function () { return DoElement.call(m.target); }, 0); //for sites that change the class just after, like linkedin
                        }
                    }
                    else if (m.attributeName == 'srcset' && m.target.tagName == 'SOURCE' && m.target.srcset)
                        DoElement.call(m.target.parentElement);
                }
                else if (m.addedNodes != null && m.addedNodes.length > 0)
                    for (var j = 0; j < m.addedNodes.length; j++) {
                        var el = m.addedNodes[j];
                        if (!el.tagName) //eg text nodes
                            continue;
                        if (el.tagName == 'IFRAME')
                            DoIframe(el);
                        else
                            DoElements(el, true);
                    }
            };
            for (var i = 0; i < mutations.length; i++) {
                _loop_1(i);
            }
        });
        observer.observe(doc, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
        //CheckMousePosition every so often
        setInterval(CheckMousePosition, 250);
        setInterval(UpdateElRects, 3000);
        for (var _i = 0, _a = [250, 1500, 4500, 7500]; _i < _a.length; _i++) {
            var to = _a[_i];
            setTimeout(UpdateElRects, to);
        }
        //ALT-a, ALT-z
        doc.addEventListener('keydown', DocKeyDown);
        //notice when mouse has moved
        doc.addEventListener('mousemove', DocMouseMove);
        win.addEventListener('scroll', WindowScroll);
        //empty iframes
        var iframes = doc.getElementsByTagName('iframe');
        for (var i = 0, max = iframes.length; i < max; i++) {
            DoIframe(iframes[i]);
        }
        hasStarted = true;
    }
    function DoElements(el, includeEl) {
        if (includeEl && tagList.indexOf(el.tagName) > -1)
            DoElement.call(el);
        var all = el.querySelectorAll(tagListCSS);
        for (var i = 0, max = all.length; i < max; i++)
            DoElement.call(all[i]);
    }
    function DoIframe(iframe) {
        if (iframe.src && iframe.src != "about:blank" && iframe.src.substr(0, 11) != 'javascript:')
            return;
        var _win = iframe.contentWindow;
        if (!_win)
            return; //with iFrames it happens
        var pollNum = 0, pollID = setInterval(function () {
            try {
                var _doc = _win.document;
            } //may cause access error, if is from other domain
            catch (err) {
                clearInterval(pollID);
                return;
            }
            if (_doc && _doc.body) {
                clearInterval(pollID);
                if (_doc.head) {
                    var linkEl = _doc.createElement('link');
                    linkEl.rel = 'stylesheet';
                    linkEl.href = extensionUrl + 'css.css';
                    _doc.head.appendChild(linkEl);
                    iframes.push(iframe);
                    DoWin(_win, true);
                }
            }
            if (++pollNum == 500)
                clearInterval(pollID);
        }, 10);
    }
    function DoElement() {
        if (showAll)
            return;
        var el = this;
        if (isImg(el)) {
            //attach load event - needed 1) as we need to catch it after it is switched for the blankImg, 2) in case the img gets changed to something else later
            DoLoadEventListener(el, true);
            //see if not yet loaded
            if (!el.complete) {
                //hide, to avoid flash until load event is handled
                MarkWizmaged(el, true);
                DoHidden(el, true);
                return;
            }
            var elWidth = el.width, elHeight = el.height;
            if (el.src == blankImg && !el.srcset) { //was successfully replaced
                DoHidden(el, false);
            }
            else if ((elWidth == 0 || elWidth > _settings.maxSafe) && (elHeight == 0 || elHeight > _settings.maxSafe)) { //needs to be hidden - we need to catch 0 too, as sometimes images start off as zero
                DoMouseEventListeners(el, true);
                if (!el.wzmHasTitleAndSizeSetup) {
                    el.style.width = elWidth + 'px';
                    el.style.height = elHeight + 'px';
                    if (!el.title)
                        if (el.alt)
                            el.title = el.alt;
                        else {
                            el.src.match(/([-\w]+)(\.[\w]+)?$/i);
                            el.title = RegExp.$1;
                        }
                    el.wzmHasTitleAndSizeSetup = true;
                }
                DoHidden(el, true);
                DoImgSrc(el, true);
                DoWizmageBG(el, true);
                el.src = blankImg;
            }
            else { //small image
                MarkWizmaged(el, false); //maybe !el.complete initially
                DoHidden(el, false);
            }
        }
        else if (el.tagName == 'VIDEO') {
            DoHidden(el, true);
            MarkWizmaged(el, true);
        }
        else if (el.tagName == 'PICTURE') {
            for (var i = 0; i < el.children.length; i++) {
                var child = el.children[i];
                if (child.tagName == 'SOURCE')
                    DoImgSrc(child, true);
            }
            MarkWizmaged(el, true);
        }
        else {
            var compStyle = getComputedStyle(el), bgimg = compStyle.backgroundImage, width = parseInt(compStyle.width) || el.clientWidth, height = parseInt(compStyle.height) || el.clientHeight; //as per https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle, getComputedStyle will return the 'used values' for width and height, which is always in px. We also use clientXXX, since sometimes compStyle returns NaN.
            if (bgimg && bgimg != 'none'
                && !el.wzmWizmaged
                && (width == 0 || width > _settings.maxSafe) && (height == 0 || height > _settings.maxSafe) /*we need to catch 0 too, as sometimes elements start off as zero*/
                && bgimg.indexOf('url(') != -1
                && !bgimg.startsWith(urlExtensionUrl)) {
                DoWizmageBG(el, true);
                DoMouseEventListeners(el, true);
                if (el.wzmLastCheckedSrc != bgimg) {
                    el.wzmLastCheckedSrc = bgimg;
                    var i = new Image();
                    i.owner = el;
                    i.onload = CheckBgImg;
                    var urlMatch = /\burl\(["']?(.*?)["']?\)/.exec(bgimg);
                    if (urlMatch)
                        i.src = urlMatch[1];
                }
            }
        }
    }
    function CheckBgImg() {
        if (this.height <= _settings.maxSafe || this.width <= _settings.maxSafe)
            ShowEl.call(this.owner);
        this.onload = undefined;
    }
    ;
    function MarkWizmaged(el, toggle) {
        if (toggle) {
            el.wzmWizmaged = true;
            el.wzmBeenBlocked = true;
            if (elList.indexOf(el) == -1) {
                elList.push(el);
                el.wzmRect = el.getBoundingClientRect();
            }
        }
        else
            el.wzmWizmaged = false;
    }
    function DoWizmageBG(el, toggle) {
        if (toggle && !el.wzmHasWizmageBG) {
            var shade = Math.floor(Math.random() * 8);
            if (_settings.isNoPattern)
                AddClass(el, 'wizmage-no-bg');
            else {
                el.wzmShade = shade;
                AddClass(el, 'wizmage-pattern-bg-img wizmage-shade-' + shade);
            }
            el.wzmHasWizmageBG = true;
            MarkWizmaged(el, true);
        }
        else if (!toggle && el.wzmHasWizmageBG) {
            if (_settings.isNoPattern)
                RemoveClass(el, 'wizmage-no-bg');
            else {
                RemoveClass(el, 'wizmage-pattern-bg-img');
                RemoveClass(el, 'wizmage-shade-' + el.wzmShade);
            }
            el.wzmHasWizmageBG = false;
            MarkWizmaged(el, false);
        }
    }
    //for IMG,SOURCE
    function DoImgSrc(el, toggle) {
        if (toggle) {
            if (el.tagName != 'SOURCE') {
                el.oldsrc = el.src;
                el.src = '';
            }
            el.oldsrcset = el.srcset;
            el.srcset = '';
        }
        else {
            if (el.tagName != 'SOURCE' && el.oldsrc != undefined) //may be undefined if img was hidden and never loaded
                el.src = el.oldsrc || '';
            if (el.oldsrcset != undefined)
                el.srcset = el.oldsrcset || '';
        }
    }
    function DoHidden(el, toggle) {
        if (toggle && !el.wzmHidden) {
            AddClass(el, 'wizmage-hide');
            el.wzmHidden = true;
        }
        else if (!toggle && el.wzmHidden) {
            RemoveClass(el, 'wizmage-hide');
            el.wzmHidden = false;
        }
    }
    function DoMouseEventListeners(el, toggle) {
        if (toggle && !el.wzmHasMouseEventListeners) {
            el.addEventListener('mouseover', mouseEntered);
            el.addEventListener('mouseout', mouseLeft);
            el.wzmHasMouseEventListeners = true;
        }
        else if (!toggle && el.wzmHasMouseEventListeners) {
            el.removeEventListener('mouseover', mouseEntered);
            el.removeEventListener('mouseout', mouseLeft);
            el.wzmHasMouseEventListeners = false;
        }
    }
    function DoLoadEventListener(el, toggle) {
        if (toggle && !el.wzmHasLoadEventListener) {
            el.addEventListener('load', DoElement);
            el.wzmHasLoadEventListener = true;
        }
        else if (!toggle && el.wzmHasLoadEventListener) {
            el.removeEventListener('load', DoElement);
            el.wzmHasLoadEventListener = false;
        }
    }
    function DoHover(el, toggle, evt) {
        var coords = el.wzmRect;
        if (toggle && !el.wzmHasHover) {
            if (mouseOverEl && mouseOverEl != el)
                DoHover(mouseOverEl, false);
            mouseOverEl = el;
            DoHoverVisual(el, true, coords);
            el.wzmHasHover = true;
        }
        else if (!toggle && el.wzmHasHover && (!evt || !coords || !IsMouseIn(evt, coords))) {
            DoHoverVisual(el, false, coords);
            el.wzmHasHover = false;
            if (el == mouseOverEl)
                mouseOverEl = undefined;
        }
    }
    function DoHoverVisual(el, toggle, coords) {
        if (toggle && !el.wzmHasHoverVisual && el.wzmWizmaged) {
            if (!_settings.isNoEye) {
                //eye
                if (!eye.parentElement) //page js may have removed it
                    doc.body.appendChild(eye);
                PositionEye(el, coords);
                eye.style.display = 'block';
                var setupEye_1 = function () {
                    eye.style.backgroundImage = eyeCSSUrl;
                    eye.onclick = function (e) {
                        e.stopPropagation();
                        ShowEl.call(el);
                        eye.style.backgroundImage = undoCSSUrl;
                        DoHoverVisualClearTimer(el, true);
                        eye.onclick = function (e) {
                            e.stopPropagation();
                            DoElement.call(el);
                            setupEye_1();
                            DoHoverVisualClearTimer(el, true);
                        };
                    };
                };
                setupEye_1();
            }
            else
                AddClass(el, 'wizmage-light');
            DoHoverVisualClearTimer(el, true);
            el.wzmHasHoverVisual = true;
        }
        else if (!toggle && el.wzmHasHoverVisual) {
            if (!_settings.isNoEye)
                eye.style.display = 'none';
            else
                RemoveClass(el, 'wizmage-light');
            DoHoverVisualClearTimer(el, false);
            el.wzmHasHoverVisual = false;
        }
    }
    function DoHoverVisualClearTimer(el, toggle) {
        if (toggle) {
            DoHoverVisualClearTimer(el, false);
            el.wzmClearHoverVisualTimer = setTimeout(function () { DoHoverVisual(el, false); }, 2500);
        }
        else if (!toggle && el.wzmClearHoverVisualTimer) {
            clearTimeout(el.wzmClearHoverVisualTimer);
            el.wzmClearHoverVisualTimer = undefined;
        }
    }
    function PositionEye(el, coords) {
        if (!coords)
            return;
        eye.style.top = (coords.top < 0 ? 0 : coords.top) + 'px';
        var left = coords.right;
        if (left > doc.documentElement.clientWidth)
            left = doc.documentElement.clientWidth;
        eye.style.left = (left - 16) + 'px';
    }
    function UpdateElRects() {
        for (var _i = 0, elList_1 = elList; _i < elList_1.length; _i++) {
            var el = elList_1[_i];
            if (el.wzmBeenBlocked)
                el.wzmRect = el.getBoundingClientRect();
        }
    }
    function CheckMousePosition() {
        if (!mouseMoved || !mouseEvent || !contentLoaded || showAll || windowScrollIX > 0)
            return;
        mouseMoved = false;
        //see if needs to defocus current
        if (mouseOverEl) {
            var coords = mouseOverEl.wzmRect;
            if (!coords || !IsMouseIn(mouseEvent, coords))
                DoHover(mouseOverEl, false);
            else if (mouseOverEl.wzmWizmaged) {
                if (!mouseOverEl.wzmHasHoverVisual)
                    DoHoverVisual(mouseOverEl, true, coords);
                else {
                    DoHoverVisualClearTimer(mouseOverEl, true);
                    PositionEye(mouseOverEl, coords);
                }
            }
        }
        //find element under mouse
        var foundEl = mouseOverEl, found = false, foundSize = (foundEl && foundEl.wzmRect) ? foundEl.wzmRect.width * foundEl.wzmRect.height : undefined;
        for (var _i = 0, elList_2 = elList; _i < elList_2.length; _i++) {
            var el = elList_2[_i];
            if (el == foundEl || !el.wzmBeenBlocked)
                continue;
            var rect = el.wzmRect;
            if (rect && IsMouseIn(mouseEvent, rect)) {
                //If not foundEl yet, use this. Else if foundEl has not got wzmBG, then if ours does, use it. Else if foundEl is bigger, use this.
                var useThis = false;
                if (!foundEl)
                    useThis = true;
                else if (!foundEl.wzmWizmaged && el.wzmWizmaged) {
                    useThis = true;
                }
                else if ((!foundSize || (foundSize > rect.width * rect.height)) && foundEl.wzmWizmaged == el.wzmWizmaged)
                    useThis = true;
                if (useThis) {
                    foundEl = el;
                    foundSize = rect.width * rect.height;
                    found = true;
                }
            }
        }
        if (found && foundEl && foundEl != mouseOverEl) {
            DoHover(foundEl, true);
        }
    }
    function IsMouseIn(mouseEvt, coords) {
        return mouseEvt.x >= coords.left && mouseEvt.x < coords.right && mouseEvt.y >= coords.top && mouseEvt.y < coords.bottom;
    }
    function ShowEl() {
        //mustn't trigger the observer here to call DoElement on this
        var el = this;
        DoHidden(el, false);
        if (isImg(el)) {
            DoLoadEventListener(el, false);
            DoImgSrc(el, false);
            DoWizmageBG(el, false);
        }
        else if (el.tagName == 'VIDEO') {
            MarkWizmaged(el, false);
        }
        else if (el.tagName == 'PICTURE') {
            for (var i = 0; i < el.children.length; i++) {
                var node = el.children[i];
                if (node.tagName == 'SOURCE')
                    DoImgSrc(node, false);
            }
            MarkWizmaged(el, false);
        }
        else {
            DoWizmageBG(el, false);
        }
        if (el.wzmCheckTimeout) {
            clearTimeout(el.wzmCheckTimeout);
            el.wzmCheckTimeout = undefined;
        }
        if (showAll) {
            DoMouseEventListeners(el, false);
        }
    }
}
function RemoveClass(el, n) {
    var oldClass = el.className, newClass = el.className.replace(new RegExp('\\b' + n + '\\b'), '');
    if (oldClass != newClass) {
        el.className = newClass;
    }
}
function AddClass(el, c) {
    el.className += ' ' + c;
}
//# sourceMappingURL=js.js.map