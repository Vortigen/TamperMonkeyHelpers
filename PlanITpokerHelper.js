// ==UserScript==
// @name         2024 PlanITpocker helper
// @namespace    http://tampermonkey.net/
// @description  Adding helper messages in the JS console.
// @version      3.1
// @match        https://app.planitpoker.com/room/*
// @run-at       document-start
// ==/UserScript==

//* eslint-disable prettier/prettier */
// unsafeWindow.WebSocket hook /////////////////////////////////////////////////////////////////////

const wsUrlMatch = ".firebaseio.com/.ws?v=";
let board = null;

unsafeWindow.console.error = (...args) => console.debug(...args);
unsafeWindow.console.warn = (...args) => console.debug(...args);
unsafeWindow.console.clear();
setTimeout(() => unsafeWindow.console.clear(), 1000);

const wsReceive = function (msg, url, wsObject) {
  // console.debug(">>> Received message from " + url + " : " + msg.data);
  if (!url.includes(wsUrlMatch)) return msg;

  let msgData = JSON.parse(msg.data);
  console.debug(msg.data, msgData);

  if (
    !msgData ||
    msgData.t !== "d" ||
    !msgData.d ||
    !(msgData.d.a === "m" || msgData.d.a === "d") ||
    !msgData.d.b ||
    !msgData.d.b.p ||
    !msgData.d.b.d
  )
    return msg;
  const payload = msgData.d.b.p;
  const data = msgData.d.b.d;
  console.debug(">>> ", { payload, data });

  const getUserId = (payload, defaultUnknown = true) => {
    // "rooms/0Wl1g0U2q4xExWttelkhaTWfdijoB1MP/users/VRg4xqbkplQxbkAz7w8KEKNleV32"
    const id = payload.split("/");
    return id[0] === "rooms" && id[2] === "users"
      ? id[3]
      : defaultUnknown
      ? "Unknown"
      : "";
  };

  const getStoryId = (payload) => {
    // "rooms/0Wl1g0U2q4xExWttelkhaTWfdijoB1MP/stories/0"
    const id = payload.split("/");
    return id[0] === "rooms" && id[2] === "stories" ? id[3] : "0";
  };

  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  // Board
  if (data.users && data.name) {
    board = clone(data);
    console.debug(">>> Board received", board);
  }

  // User joined / Changed name
  if (board && !data.users && data.name) {
    const userId = getUserId(payload, false);
    const userName = data.name;
    if (userId && userName) {
      console.debug(">>> Adding new user / Change user name", {
        userId,
        userName,
      });
      board.users = board.users || {};
      board.users[userId] = { name: userName };
      console.debug(">>> Board modified", board);
    }
  }

  // Votes
  if (board && !!data.voted_at) {
    const userId = getUserId(payload);
    const userName = board.users?.[userId]?.name || userId;
    const vote = data.vote;

    let voteMap = {
      scrum: {
        0: 0,
        1: "1/2",
        2: 1,
        3: 2,
        4: 3,
        5: 5,
        6: 8,
        7: 13,
        8: 20,
        9: 40,
        10: 100,
        "-1": "?",
        "-2": "Coffee",
      },
      fibonacci: {
        0: 0,
        1: 1,
        2: 2,
        3: 3,
        4: 5,
        5: 8,
        6: 13,
        7: 21,
        8: 34,
        9: 55,
        10: 89,
        "-1": "?",
        "-2": "Coffee",
      },
      sequential: {
        0: 0,
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        9: 9,
        10: 10,
        "-1": "?",
        "-2": "Coffee",
      },
      "playing-cards": {
        0: "Ace",
        1: 2,
        2: 3,
        3: 5,
        4: 8,
        5: "King",
        "-1": "?",
        "-2": "Coffee",
      },
      "t-shirt": {
        0: "XS",
        1: "S",
        2: "M",
        3: "L",
        4: "XL",
        5: "XXL",
        "-1": "?",
        "-2": "Coffee",
      },
    };
    if (board.deck === "custom-deck") {
      voteMap = {
        ...voteMap,
        "custom-deck": {
          ...Object.keys(board.cards).reduce(
            (acc, card) => ({ ...acc, ["" + card]: board.cards[card].text }),
            {}
          ),
          "-1": "?",
          "-2": "Coffee",
        },
      };
    }

    console.log(`>>> Vote [${userName}]: ${voteMap[board.deck][vote]}`);
  }

  // Stories
  if (board && !!payload.includes("/stories/") && !!data.started_at) {
    const storyId = getStoryId(payload);
    const storyName = board.stories[storyId]?.text;

    console.log(
      `>>> Story [${Number(storyId) + 1}/${
        Object.keys(board.stories).length
      }]: ${storyName}`
    );
  }

  return msg;
};

const wsSend = function (data, url, wsObject) {
  // console.debug(">>> Sending message to " + url + " : " + data);
  return data;
};

function MutableMessageEvent(o) {
  this.bubbles = o.bubbles || false;
  this.cancelBubble = o.cancelBubble || false;
  this.cancelable = o.cancelable || false;
  this.currentTarget = o.currentTarget || null;
  this.data = o.data || null;
  this.defaultPrevented = o.defaultPrevented || false;
  this.eventPhase = o.eventPhase || 0;
  this.lastEventId = o.lastEventId || "";
  this.origin = o.origin || "";
  this.path = o.path || new Array(0);
  this.ports = o.parts || new Array(0);
  this.returnValue = o.returnValue || true;
  this.source = o.source || null;
  this.srcElement = o.srcElement || null;
  this.target = o.target || null;
  this.timeStamp = o.timeStamp || null;
  this.type = o.type || "message";
  this.__proto__ = o.__proto__ || MessageEvent.__proto__;
}

const _WS = unsafeWindow.WebSocket;
unsafeWindow.WebSocket = function (url, protocols) {
  let WSObject = {};
  this.url = url;
  this.protocols = protocols;
  if (!this.protocols) {
    WSObject = new _WS(url);
  } else {
    WSObject = new _WS(url, protocols);
  }

  const _send = WSObject.send;
  WSObject.send = function (data) {
    arguments[0] = wsSend(data, WSObject.url, WSObject) || data;
    _send.apply(this, arguments);
  };

  WSObject._addEventListener = WSObject.addEventListener;
  WSObject.addEventListener = function () {
    const eventThis = this;
    if (arguments[0] === "message") {
      arguments[1] = (function (userFunc) {
        return function instrumentAddEventListener() {
          arguments[0] = wsReceive(
            new MutableMessageEvent(arguments[0]),
            WSObject.url,
            WSObject
          );
          if (arguments[0] === null) return;
          userFunc.apply(eventThis, arguments);
        };
      })(arguments[1]);
    }
    return WSObject._addEventListener.apply(this, arguments);
  };

  Object.defineProperty(WSObject, "onmessage", {
    set: function () {
      const eventThis = this;
      const userFunc = arguments[0];
      const onMessageHandler = function () {
        arguments[0] = wsReceive(
          new MutableMessageEvent(arguments[0]),
          WSObject.url,
          WSObject
        );
        if (arguments[0] === null) return;
        userFunc.apply(eventThis, arguments);
      };
      WSObject._addEventListener.apply(this, [
        "message",
        onMessageHandler,
        false,
      ]);
    },
  });

  return WSObject;
};