// ==UserScript==
// @name         Fourth Open VPN auto login
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Fourth Open VPN auto login
// @author       :bashtata-na-terminala:
// @match        https://login.microsoftonline.com/*/saml2
// @match        https://login.microsoftonline.com/*/login
// @match        https://login.microsoftonline.com/common/DeviceAuthTls/reprocess
// @match        https://login.microsoftonline.com/common/SAS/ProcessAuth
// @run-at       document-start
// ==/UserScript==

(() => {

    // EDIT /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    const email = ''; // leave '' if you have autofill on your browser
    const password = '';   // leave '' if you have autofill on your browser
    const secretKey = 'pw7kpzhkzxbyy7zc'; // you MUST replace this one with yours
    // Add new TOTP from here: https://mysignins.microsoft.com/security-info
    //   > Add sign-in method > Authenticator app > I want to use a different authenticator app > Next > Can't scan image? > Secret key
    //												> Scan the QR code with Google Authenticator > Next > Enter the code from Google Authenticator
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    console.log('Fourth Open VPN auto login');

    const validate = (input) => input.dispatchEvent(new Event('input', { bubbles: true }));
    const isLocation = (str) => document.location.pathname.includes(str);
    const waitValue = (element) => new Promise((resolve) => {
        const checkValue = () => element.value ? resolve() : setTimeout(checkValue, 100);
        checkValue();
    });
    const getInput = (type, value) => new Promise((resolve) => {
        const selector = `input[type="${type}"]${value ? `[value="${value}"]` : ''}`;
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        const observer = new MutationObserver((mutations) => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
    const loadScript = () => new Promise((resolve) => {
        console.log('loadScript');
        const script = document.createElement('script');
        script.addEventListener('load', () => {
            console.log('loadScript loaded');
            resolve();
        });
        script.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/otpauth/9.1.5/otpauth.umd.min.js');
        document.head.appendChild(script);
        console.log('loadScript done');
    });

    document.addEventListener("DOMContentLoaded", async () => {
        // STEP 1
        if (isLocation('saml2')) {
            console.log('STEP 1/3 (email, password)');
            const emailInput = await getInput('email');
            const submitEmailButton = await getInput('submit', 'Next');
            email && (emailInput.value = email);
            await waitValue(emailInput);
            validate(emailInput);
            submitEmailButton.click();

            const passwordInput = await getInput('password');
            password && (passwordInput.value = password);
            await waitValue(passwordInput);
            validate(passwordInput);
            const submitPasswordButton = await getInput('submit', 'Sign in');
            submitPasswordButton.click();
            console.log('STEP 1/3 done');
        }

        // STEP 2
        if (isLocation('reprocess') || isLocation('login')) {
            console.log('STEP 2/3 (code)');
            await loadScript();
            const codeInput = await getInput('tel');
            codeInput.value = new OTPAuth.TOTP({ secret: secretKey }).generate();
            validate(codeInput);
            const submitCodeButton = await getInput('submit');
            submitCodeButton.click();
            console.log('STEP 2/3 done');
        }

        // STEP 3
        if (isLocation('ProcessAuth')) {
            console.log('STEP 3/3 (remember)');
            const submitYesButton = await getInput('submit');
            submitYesButton.click();
            console.log('STEP 3/3 done');
        }
    });
})();
