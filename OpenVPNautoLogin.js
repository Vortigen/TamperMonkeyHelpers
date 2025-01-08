// ==UserScript==
<<<<<<< HEAD
// @name         Fourth Open VPN auto login - 30.12.2024
// @namespace    http://tampermonkey.net/
// @version      2.0
=======
// @name         Fourth Open VPN auto login - 22.12.2024
// @namespace    http://tampermonkey.net/
// @version      1.9
>>>>>>> 55de73375b9563be904cd76844ad1509699966f2
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
  const secretKey = "";
  // Add TOTP from here, you must have only 2 methods: Password and TOTP -- https://mysignins.microsoft.com/security-info
  //   > Add sign-in method > Authenticator app > I want to use a different authenticator app > Can't scan image? > Secret key
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

  const getInput = (type, values = [null]) => {
    const selector = values
      .map(
        (value) => `input[type="${type}"]${value ? `[value="${value}"]` : ""}`
      )
      .join(",");
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

<<<<<<< HEAD
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

    // STEP 1 - email, password
    if (isLocation("saml2")) {
      console.log("STEP 1/4 (email, password)");
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
      submitEmailButton.click();

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
      submitPasswordButton.click();
      console.log("done");
    }

    // STEP 2 - code
    if (isLocation("reprocess") || isLocation("login")) {
      console.log("STEP 2/4 (code)");
      console.log("loading OTPAuth...");
      try {
        await loadScript();
      } catch {
        console.log("not happy :(");
        return;
      }
      console.log("waiting for code input...");
      const codeInput = await getInput("tel");
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
      submitCodeButton.click();
      console.log("done");
    }

    // STEP 3 - remember
    if (isLocation("ProcessAuth")) {
      console.log("STEP 3/4 (remember)");
      console.log("waiting for don't show checkbox...");
      const dontShow = await getInput("checkbox");
      console.log("don't show checkbox acquired, checking...");
      dontShow.checked = true;
      console.log("checked. waiting for submit...");
      const submitYesButton = await getInput("submit");
      console.log("submit acquired, clicking...");
      submitYesButton.click();
      console.log("done");
    }

    // STEP 4 - connected
    if (isLocation("connect")) {
      console.log("STEP 4/4 (connected)");
      console.log("waiting for connected header message...");
      const header = await getSelector("h1.header");
      console.log("connected header message acquired", {
        message: header.textContent,
      });
      if (header.textContent === "You’re connected!") {
        // not translated in bulgarian
        window.close();
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
=======
    const loadScript = () => new Promise((resolve, reject) => {
        const script = GM_addElement('script', {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/otpauth/9.1.5/otpauth.umd.min.js',
            type: 'text/javascript'
        });
        script.addEventListener('load', () => {
            if (!!unsafeWindow.OTPAuth) {
                console.log('OTPAuth loaded :)');
                return resolve();
            }
            console.log('OTPAuth NOT loaded :(');
            reject();
        });
        script.addEventListener('error', () => {
            console.log('OTPAuth script NOT loaded :(');
            reject();
        });
    });

    let checkDOMinterval;

    const doit = async () => {
        clearInterval(checkDOMinterval);

        // STEP 1 - email, password
        if (isLocation('saml2')) {
            console.log('STEP 1/4 (email, password)');
            const emailInput = await getInput('email');
            const submitEmailButton = await getInput('submit', ['Next', 'Напред']);
            email && (emailInput.value = email);
            await waitValue(emailInput);
            validate(emailInput);
            submitEmailButton.click();

            const passwordInput = await getInput('password');
            password && (passwordInput.value = password);
            await waitValue(passwordInput);
            validate(passwordInput);
            const submitPasswordButton = await getInput('submit', ['Sign in', 'Влизане']);
            submitPasswordButton.click();
            console.log('done');
        }

        // STEP 2 - code
        if (isLocation('reprocess') || isLocation('login')) {
            console.log('STEP 2/4 (code)');
            try {
                await loadScript();
            } catch {
                console.log('not happy :(');
                return;
            }
            const codeInput = await getInput('tel');
            codeInput.value = new unsafeWindow.OTPAuth.TOTP({ secret: secretKey }).generate();
            validate(codeInput);
            const submitCodeButton = await getInput('submit');
            submitCodeButton.click();
            console.log('done');
        }

        // STEP 3 - remember
        if (isLocation('ProcessAuth')) {
            console.log('STEP 3/4 (remember)');
            const submitYesButton = await getInput('submit');
            submitYesButton.click();
            console.log('done');
        }

        // STEP 4 - connected
        if (isLocation('connect')) {
            console.log('STEP 4/4 (connected)');
            setTimeout(() => {
                const msg = document.querySelector(".header")?.textContent;
                if (msg === 'You’re connected!') { // Bulgarian is not supported here
                    window.close();
                } else {
                    console.log('hmmmm, connected msg not found');
                }
            }, 4000);
            console.log('done');
        }
    };


    const checkDOM = async () => {
        if (document.readyState === "complete" || document.readyState === "loaded") {
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
>>>>>>> 55de73375b9563be904cd76844ad1509699966f2
})();
