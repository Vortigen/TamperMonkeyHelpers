// ==UserScript==
// @name         Fourth Open VPN auto login - 08.08.2025
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Fourth Open VPN auto login
// @author       :ako-iskate-moga-da-vi-napravq-demo:
// @match        https://login.microsoftonline.com/*/saml2*
// @match        https://login.microsoftonline.com/*/login*
// @match        https://login.microsoftonline.com/common/DeviceAuthTls/reprocess*
// @match        https://login.microsoftonline.com/common/SAS/ProcessAuth*
// @match        https://fourth.openvpn.com/connect*
// @grant        window.close
// @grant        unsafeWindow
// @grant        GM_addElement
// @run-at       document-start
// ==/UserScript==

(async () => {
  // EDIT /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const email = ""; // use empty for auto fill
  const password = ""; // use empty for auto fill
  const secretKey = '';
  // Add TOTP from here, you must have only 2 methods: Password and TOTP -- https://mysignins.microsoft.com/security-info
  //   > Add sign-in method > Authenticator app > I want to use a different authenticator app > Can't scan image? > Secret key
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const clickButtons = true;
  const closeWindow = true;

  console.log("Fourth Open VPN auto login");

  const validate = (input) =>
    input.dispatchEvent(new Event("input", { bubbles: true }));

  const isLocation = (str) => document.location.pathname.includes(str);

  const waitValue = (element) =>
    new Promise((resolve) => {
      const checkValue = () =>
        element.value ? resolve() : setTimeout(checkValue, 100);
      checkValue();
    });

  const getInput = (type, values = [null], otherSelector = null) => {
    const selector = values
      .map(
        (value) => `input[type="${type}"]${value ? `[value="${value}"]` : ""}`
      )
      .join(",") + (otherSelector ? ',' + otherSelector : '');
    return getSelector(selector);
  };

  const getSelector = (selector) =>
    new Promise((resolve) => {
      if (document.querySelector(selector)) {
        setTimeout(() => resolve(document.querySelector(selector), 0));
        return;
      }
      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          setTimeout(() => resolve(document.querySelector(selector), 0));
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });

  const loadScript = () =>
    new Promise((resolve, reject) => {
      const script = GM_addElement("script", {
        src: "https://cdnjs.cloudflare.com/ajax/libs/otpauth/9.1.5/otpauth.umd.min.js",
        type: "text/javascript",
      });
      script.addEventListener("load", () => {
        if (!!unsafeWindow.OTPAuth) {
          console.log("OTPAuth loaded :)");
          return resolve();
        }
        console.log("OTPAuth NOT loaded :(");
        reject();
      });
      script.addEventListener("error", () => {
        console.log("OTPAuth script NOT loaded :(");
        reject();
      });
    });

  let checkDOMinterval;

  const doit = async () => {
    clearInterval(checkDOMinterval);

    // SCREEN: email, password
    if (isLocation("saml2")) {
      console.log("SCREEN: email, password");
      console.log("waiting for email input...");
      const emailInput = await getInput("email");
      console.log("email input acquired", { emailInput });

      if (email) {
        console.log("email set by the user, auto filling", { email });
        emailInput.value = email;
      }
      console.log("waiting for email input value...");
      await waitValue(emailInput);
      console.log("email input value acquired", { email: emailInput.value });
      validate(emailInput);
      console.log("email input validated, waiting for submit...");
      const submitEmailButton = await getInput("submit", ["Next", "Напред"]);
      console.log("submit acquired, clicking...");
      clickButtons && submitEmailButton.click();

      console.log("waiting for password input...");
      const passwordInput = await getInput("password");
      console.log("password input acquired");
      if (password) {
        console.log("password set by the user, auto filling", {
          passwordLength: password.length,
        });
        passwordInput.value = password;
      }
      console.log("waiting for password input value...");
      await waitValue(passwordInput);
      console.log("password input value acquired", {
        passwordInputValueLength: passwordInput.value.length,
      });
      validate(passwordInput);
      console.log("password input validated, waiting for submit...");
      const submitPasswordButton = await getInput("submit", [
        "Sign in",
        "Влизане",
      ]);
      console.log("submit acquired, clicking...");
      clickButtons && submitPasswordButton.click();
      console.log("done");
    }

    // SCREEN: code
    if (isLocation("reprocess") || isLocation("login")) {
      console.log("SCREEN: code");
      console.log("loading OTPAuth...");
      try {
        await loadScript();
      } catch {
        console.log("not happy :(");
        return;
      }

      console.log("waiting for code input...");
      let codeInput = await getInput("tel", [null], '[data-value="PhoneAppOTP"],#appConfirmTitle');

      if (
          codeInput?.innerText?.includes('Do you trust fourth.com?') ||
          codeInput?.innerText?.includes('Имате ли доверие на fourth.com?')
      ) {
          console.log("do you trust confirmation acquired, waiting for submit...");
          const submitCodeButton = await getInput("submit");
          console.log("submit acquired, clicking...");
          clickButtons && submitCodeButton.click();
          codeInput = await getInput("tel");
      }

      if (
          codeInput?.innerText?.includes('Use a verification code') ||
          codeInput?.innerText?.includes('Използване на код за потвърждение')
      ) {
          console.log("use a verification code button acquired, clicking...");
          clickButtons && codeInput.click();
          codeInput = await getInput("tel");
      }

      console.log("code input acquired", codeInput);
      const newCode = new unsafeWindow.OTPAuth.TOTP({
        secret: secretKey,
      }).generate();
      console.log("generated new code", { newCode });
      codeInput.value = newCode;
      console.log("code input value", { codeInputValue: codeInput.value });
      validate(codeInput);
      console.log("code input validated, waiting for submit...");
      const submitCodeButton = await getInput("submit");
      console.log("submit acquired, clicking...");
      clickButtons && submitCodeButton.click();
      console.log("done");
    }

    // SCREEN: remember
    if (isLocation("ProcessAuth")) {
      console.log("SCREEN: remember");
      console.log("waiting for don't show checkbox...");
      const dontShow = await getInput("checkbox");
      console.log("don't show checkbox acquired, checking...");
      dontShow.checked = true;
      console.log("checked. waiting for submit...");
      const submitYesButton = await getInput("submit");
      console.log("submit acquired, clicking...");
      clickButtons && submitYesButton.click();
      console.log("done");
    }

    // SCREEN: connected
    if (isLocation("connect")) {
      console.log("SCREEN: connected");
      console.log("waiting for connected header message...");
      const header = await getSelector("span.header");
      console.log("connected header message acquired", {
        message: header.textContent,
      });
      if (header.textContent === "You’re connected!") {
        // not translated in bulgarian
        closeWindow && window.close();
      } else {
        console.log("hmmmm, connected header message is not found :(");
      }
      console.log("done");
    }
  };

  const checkDOM = async () => {
    if (
      document.readyState === "complete" ||
      document.readyState === "loaded"
    ) {
      console.log("DOM content already loaded, doing it...");
      await doit();
    } else {
      console.log("DOM content not loaded, listening for the event...");
      document.removeEventListener("DOMContentLoaded", doit);
      document.addEventListener("DOMContentLoaded", doit);
    }
  };

  checkDOMinterval = setInterval(checkDOM, 1000);
  checkDOM();
})();
