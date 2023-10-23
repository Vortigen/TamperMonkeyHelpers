// ==UserScript==
// @name         Fourth Open VPN auto login
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fourth Open VPN auto login
// @author       :bashtata-na-terminala:
// @match        https://login.microsoftonline.com/*/saml2
// @match        https://login.microsoftonline.com/common/DeviceAuthTls/reprocess
// @match        https://login.microsoftonline.com/common/SAS/ProcessAuth
// @run-at       document-start
// ==/UserScript==

(async function() {
    'use strict';

    // EDIT /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    const email = 'your.name@fourth.com';
    const password = '<your-password>';
    const secretKey = '0123456789abcdef';
    // Add new TOTP from here: https://mysignins.microsoft.com/security-info
    //   > Add sign-in method > Authenticator app > I want to use a different authenticator app > Can't scan image? > Secret key
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    console.log('Fourth Open VPN auto login');

    const wait = async (delay = 1) => await (new Promise((resolve) => setTimeout(resolve, delay * 1000)));
    const validate = (input) => input.dispatchEvent(new Event('input', { bubbles: true }));
    const isLocation = (str) => document.location.pathname.includes(str);
    const getInput = (type) => document.querySelectorAll(`input[type=${type}]`)?.[0];

    // STEP 1
    if (isLocation('saml2')) {
        await wait();

        const emailInput = getInput('email');
        const submitEmailButton = getInput('submit');

        if (emailInput) {
            emailInput.value = email;
            validate(emailInput);
            submitEmailButton.click();

            await wait();
            const passwordInput = getInput('password');
            passwordInput.value = password;
            validate(passwordInput);
            const submitPasswordButton = getInput('submit');
            submitPasswordButton.click();
            console.log('STEP 1/3 done.');
        } else {
            console.log('STEP 1/3 FAIL :(');
        }
    }

    // STEP 2
    if (isLocation('reprocess')) {
        const script = document.createElement('script');
        script.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/otpauth/9.1.5/otpauth.umd.min.js');
        document.head.appendChild(script);

        await wait(3);

        const codeInput = getInput('tel');
        if (codeInput) {
            codeInput.value = new OTPAuth.TOTP({ secret: secretKey }).generate();
            validate(codeInput);
            const submitCodeButton = getInput('submit');
            submitCodeButton.click();
            console.log('STEP 2/3 done.');
        } else {
            console.log('STEP 2/3 FAIL :(');
        }
    }

    // STEP 3
    if (isLocation('ProcessAuth')) {
        await wait();

        const submitYesButton = getInput('submit');
        if (submitYesButton) {
            submitYesButton.click();
            console.log('STEP 3/3 done.');
        } else {
            console.log('STEP 3/3 FAIL :(');
        }
    }
})();