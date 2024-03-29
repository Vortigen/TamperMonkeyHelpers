// ==UserScript==
// @name         Kollabe.com helper
// @namespace    http://tampermonkey.net/
// @description  Adding helper message on the votes in the JS console.
// @version      1.0
// @match        https://kollabe.com/room*
// @run-at       document-start
// ==/UserScript==

const searchRegExp = /e=>e\.usersState\.updateRoomPresence/g;

const replaceStr = `e=>{
  const sg = e.votesState.getSubmissionGroups();
  const latest = sg.map((s) => ({
    submission: s.submission,
    users: s.users.map((u) => u.user.name).join(', ')
  }))
  console.clear();
  latest.forEach((s) => console.log(s));
  return e.usersState.updateRoomPresence;
}`;

// https://kollabe.com/_next/static/chunks/pages/room-6b9431b254ce3c7a.js
const roomScriptRegExp = /<script[^"]*src=\"([^"]*\/pages\/room-[^"]*)\"[^<]*<\/script>/gim;

(async function() {
    'use strict';
    console.log('Kollabe.com helper loaded');

    async function loadModedScript(roomScriptSrc) {
        let text = await fetch(roomScriptSrc)
            .then(e => e.text())
            .then(e => e.replace(searchRegExp, replaceStr));

        let newScript = document.createElement('script');
        newScript.type = 'text/javascript';
        newScript.textContent = text;
        document.querySelector('head').appendChild(newScript);
    }

    async function replaceHTML() {
        const docText = await fetch(document.location.href).then(e => e.text());
        const roomScriptSrc = [...docText.matchAll(roomScriptRegExp)][0][1];
        const docTextNew = docText.replace(roomScriptRegExp, '');

        var html = document.createElement('html');
        html.innerHTML = docTextNew.trim();

        document.write('<!doctype html>' + html.outerHTML);
        document.close();

        loadModedScript(roomScriptSrc);
    }

    const observer = new MutationObserver(mutationRecords => {
      mutationRecords.every((record) => {
        if (record.addedNodes[0]) {
            document.write('');
            observer.disconnect();
            replaceHTML();
            return false;
        }
        return true;
      });
    });

    observer.observe(document, {
        childList: true,
        subtree: true,
    });
})();
