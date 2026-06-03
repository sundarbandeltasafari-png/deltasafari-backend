const mailJetConf = require('../MailConfig');
const twilioConfig = require('../twilioConfig');

const sendOtp = (toEmail, toName, otp, type) => {
    if(validateEmail(toEmail)){
        const subject = type == 'reset' ? `Reset Password OTP for ${process.env.APP_NAME} is ` : type == 'login-otp' ? `Login OTP for ${process.env.APP_NAME} is ` : `Register OTP for ${process.env.APP_NAME} is `;
        const html = type == 'reset' ? otpPasswordHtml(subject, otp) : otpRegisterHtml(subject, otp);
        mailJetConf(toEmail, toName, subject, html).then((result) => {
            return true;
        }).catch((err) => {
            return false;
        });
    }else if(isValidPhoneNumber(toEmail)){
        const subject = type == 'reset' ? `Reset Password OTP for ${process.env.APP_NAME} is ${otp} ` : `Register OTP for ${process.env.APP_NAME} is ${otp} `;
        twilioConfig(toEmail, subject).then((res)=>{
            return true;
        }).catch((err)=>{
            return false;
        })
    }
}

const otpRegisterHtml = (subject, otp)=>{
    var otpInnerHtml = '';
    otp.toString().split('').forEach((item)=>{ otpInnerHtml += `<div class="box-otp"><h2 style=" font-size: 2rem;">${item}</h2></div>`});
    return `  <section class="otp-page" style=" text-align: center; padding: 50px 0;max-width: 550px; margin: auto; ">
        <div class="container" style="padding: 30px 20px;  border-radius: 10px; border: 1px solid #efefef;">
            <div class="heading">
                <h1 style="font-size: 2rem; line-height: 39px;">${subject}</h1>
            </div>
            <div class="paragraph">
                <p style=" font-size: 16px; line-height: 20px;white-space: wrap;">Welcome to Cuzysolve — your trusted AI-powered question-solving platform! </p>
                <p>To complete your registration, please verify your email address using the OTP below:</p>
            </div>
            <div class="otp-box-body" style="   background-color: rgb(230, 231, 232);   border-radius: 10px;  width: 80%; margin: 25px 0; margin: auto;">
                <div class="otp-inner-flex" style=" display: flex; min-height: 40px; width: fit-content; margin: auto; justify-content: center; gap: 20px; align-items: center;">
                    ${otpInnerHtml}
                </div>
            </div>
            <!--  -->
            <div class="paragraph">
                <p>If you didn’t request this, please ignore this email.</p>
            </div>
            <div class="footer-box">
                <div class="paragraph-footer">
                    <p style="  border-top: #a0a0a0cc 1px solid;  padding-top: 20px;">Thanks for joining Cuzysolve — where solving questions becomes easy!</p>
                </div>

                <!-- social box -->
                <div class="social-box-flex" style="  display: flex; justify-content: center;align-items: center;  gap: 10px;">
                    <div class="social-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="30px" height="30px" x="0" y="0" viewBox="0 0 512 512"
                            style="enable-background:new 0 0 512 512" xml:space="preserve" class="">
                            <g>
                                <path
                                    d="M133.408 346.261c95.35 37.211 176.493 44.459 268.445-13.461-.674 1.011-18.863 27.958-66.695 41.768 10.105 13.811 23.916 29.642 23.916 29.642 30.653 0 60.632-8.758 86.568-25.6 20.211-13.474 31.663-36.716 29.305-60.968-4.042-41.432-13.811-81.853-28.968-120.589-19.2-50.526-65.347-85.558-118.905-90.611-4.716-.337-8.084-.337-10.105-.337l-5.389 5.389c61.642 17.516 92.295 44.8 92.968 45.811-94.653-47.832-206.484-48.505-301.811-2.021 0 0 30.316-29.979 97.347-45.811l-4.042-4.042c-7.074 0-13.811.674-20.884 1.684-49.516 8.421-90.947 42.442-108.8 89.263-15.495 40.421-25.6 82.863-29.305 125.979-2.021 22.905 8.758 45.474 27.621 58.611 24.926 16.505 54.568 25.263 84.547 25.263 0 0 12.126-15.832 24.253-29.979-45.474-13.474-64-40.421-64.337-41.432l8.558 4.37a172.042 172.042 0 0 0 15.713 7.071zm52.866-29.293c-21.895-.674-39.074-19.2-38.4-41.432.674-20.884 17.516-37.726 38.4-38.4 21.895.674 39.074 19.2 38.4 41.432-1.011 20.885-17.516 37.727-38.4 38.4zm137.431 0c-21.895-.674-39.074-19.2-38.4-41.432.674-20.884 17.516-37.726 38.4-38.4 21.895.674 39.074 19.2 38.4 41.432-.673 20.885-17.516 37.727-38.4 38.4z"
                                    fill="#c7c7c7" opacity="1" data-original="#000000" class=""></path>
                            </g>
                        </svg>

                    </div>
                    <div class="social-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="25px" height="25px" x="0" y="0" viewBox="0 0 24 24"
                            style="enable-background:new 0 0 512 512" xml:space="preserve" class="">
                            <g>
                                <path
                                    d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.298-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.209.96-.262 1.98-.392 3-.398 1.02.006 2.04.136 3 .398 2.28-1.525 3.285-1.209 3.285-1.209.645 1.624.24 2.823.12 3.121.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.182 0 1.578-.015 2.846-.015 3.229 0 .309.21.678.825.56C20.565 21.917 24 17.495 24 12.292 24 5.78 18.627.5 12 .5z"
                                    fill="#c7c7c7" opacity="1" data-original="#000000" class=""></path>
                            </g>
                        </svg>

                    </div>
                    <div class="social-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="25px" height="25px" x="0" y="0" viewBox="0 0 512 512"
                            style="enable-background:new 0 0 512 512" xml:space="preserve" class="">
                            <g>
                                <path fill="#c7c7c7"
                                    d="M486 392.599C486 443.97 443.97 486 392.599 486H119.401C68.03 486 26 443.97 26 392.599V119.401C26 68.031 68.03 26 119.401 26h273.198C443.97 26 486 68.031 486 119.401z"
                                    opacity="1" data-original="#41464a" class=""></path>
                                <path fill="#ffffff"
                                    d="m290.425 233.064 110.65-137.91h-32.05l-94.62 117.94-94.63-117.94H74.125l147.45 183.78-110.66 137.92h32.05l94.63-117.95 94.64 117.95h105.65zm-164.2-112.911h41.55l218 271.7h-41.55z"
                                    opacity="1" data-original="#f0f0f1" class=""></path>
                            </g>
                        </svg>
                    </div>
                    <div class="social-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="25px" height="25px" x="0" y="0" viewBox="0 0 100 100"
                            style="enable-background:new 0 0 512 512" xml:space="preserve" class="">
                            <g>
                                <path
                                    d="M45.795 57.557 2.638 26.167l-.138.07v47.5a9.5 9.5 0 0 0 9.5 9.5h76a9.5 9.5 0 0 0 9.5-9.5V26.124l-.025-.013-43.27 31.447a7.15 7.15 0 0 1-8.41-.001z"
                                    fill="#c7c7c7" opacity="1" data-original="#000000" class=""></path>
                                <path
                                    d="m54.206 45.827 38.329-27.874c-1.343-.734-2.888-1.19-4.535-1.19H12c-1.647 0-3.167.456-4.535 1.19l38.33 27.874a7.15 7.15 0 0 0 8.41 0z"
                                    fill="#c7c7c7" opacity="1" data-original="#000000" class=""></path>
                            </g>
                        </svg>
                    </div>
                </div>
                <div class="copy-rights">
                    <p>&copy;Logoto.All rights reserved.</p>
                </div>
            </div>
        </div>
    </section>`
}
const otpPasswordHtml = (subject, otp)=>{
    var otpInnerHtml = '';
    otp.toString().split('').forEach((item)=>{ otpInnerHtml += `<div class="box-otp"><h2 style=" font-size: 2rem;">${item}</h2></div>`});
    return `  <section class="otp-page" style=" text-align: center; padding: 50px 0;max-width: 550px; margin: auto; ">
        <div class="container" style="padding: 30px 20px;  border-radius: 10px; border: 1px solid #efefef;">
            <div class="heading">
                <h1 style="font-size: 2rem; line-height: 39px;">${subject}</h1>
            </div>
            <div class="paragraph">
                <p style=" font-size: 16px; line-height: 20px;white-space: wrap;">We received a request to reset your password for your Cuzysolve account.</p>
                <p>To proceed, please verify your identity using the OTP below:</p>
            </div>
            <div class="otp-box-body" style="   background-color: rgb(230, 231, 232);   border-radius: 10px;  width: 80%; margin: 25px 0; margin: auto;">
                <div class="otp-inner-flex" style=" display: flex; min-height: 40px; width: fit-content; margin: auto; justify-content: center; gap: 20px; align-items: center;">
                    ${otpInnerHtml}
                </div>
            </div>
            <!--  -->
            <div class="paragraph">
                <p>After submit OTP, you can set a new password and regain access to your account.</p>
            </div>
            <div class="footer-box">
                <div class="paragraph-footer">
                    <p style="border-top: #a0a0a0cc 1px solid;  padding-top: 20px;">If you didn’t request a password reset, please ignore this email — your account will remain secure.</p>
                </div>

                <!-- social box -->
                <div class="social-box-flex" style="  display: flex; justify-content: center;align-items: center;  gap: 10px;">
                    <div class="social-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="30px" height="30px" x="0" y="0" viewBox="0 0 512 512"
                            style="enable-background:new 0 0 512 512" xml:space="preserve" class="">
                            <g>
                                <path
                                    d="M133.408 346.261c95.35 37.211 176.493 44.459 268.445-13.461-.674 1.011-18.863 27.958-66.695 41.768 10.105 13.811 23.916 29.642 23.916 29.642 30.653 0 60.632-8.758 86.568-25.6 20.211-13.474 31.663-36.716 29.305-60.968-4.042-41.432-13.811-81.853-28.968-120.589-19.2-50.526-65.347-85.558-118.905-90.611-4.716-.337-8.084-.337-10.105-.337l-5.389 5.389c61.642 17.516 92.295 44.8 92.968 45.811-94.653-47.832-206.484-48.505-301.811-2.021 0 0 30.316-29.979 97.347-45.811l-4.042-4.042c-7.074 0-13.811.674-20.884 1.684-49.516 8.421-90.947 42.442-108.8 89.263-15.495 40.421-25.6 82.863-29.305 125.979-2.021 22.905 8.758 45.474 27.621 58.611 24.926 16.505 54.568 25.263 84.547 25.263 0 0 12.126-15.832 24.253-29.979-45.474-13.474-64-40.421-64.337-41.432l8.558 4.37a172.042 172.042 0 0 0 15.713 7.071zm52.866-29.293c-21.895-.674-39.074-19.2-38.4-41.432.674-20.884 17.516-37.726 38.4-38.4 21.895.674 39.074 19.2 38.4 41.432-1.011 20.885-17.516 37.727-38.4 38.4zm137.431 0c-21.895-.674-39.074-19.2-38.4-41.432.674-20.884 17.516-37.726 38.4-38.4 21.895.674 39.074 19.2 38.4 41.432-.673 20.885-17.516 37.727-38.4 38.4z"
                                    fill="#c7c7c7" opacity="1" data-original="#000000" class=""></path>
                            </g>
                        </svg>

                    </div>
                    <div class="social-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="25px" height="25px" x="0" y="0" viewBox="0 0 24 24"
                            style="enable-background:new 0 0 512 512" xml:space="preserve" class="">
                            <g>
                                <path
                                    d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.298-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.209.96-.262 1.98-.392 3-.398 1.02.006 2.04.136 3 .398 2.28-1.525 3.285-1.209 3.285-1.209.645 1.624.24 2.823.12 3.121.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.182 0 1.578-.015 2.846-.015 3.229 0 .309.21.678.825.56C20.565 21.917 24 17.495 24 12.292 24 5.78 18.627.5 12 .5z"
                                    fill="#c7c7c7" opacity="1" data-original="#000000" class=""></path>
                            </g>
                        </svg>

                    </div>
                    <div class="social-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="25px" height="25px" x="0" y="0" viewBox="0 0 512 512"
                            style="enable-background:new 0 0 512 512" xml:space="preserve" class="">
                            <g>
                                <path fill="#c7c7c7"
                                    d="M486 392.599C486 443.97 443.97 486 392.599 486H119.401C68.03 486 26 443.97 26 392.599V119.401C26 68.031 68.03 26 119.401 26h273.198C443.97 26 486 68.031 486 119.401z"
                                    opacity="1" data-original="#41464a" class=""></path>
                                <path fill="#ffffff"
                                    d="m290.425 233.064 110.65-137.91h-32.05l-94.62 117.94-94.63-117.94H74.125l147.45 183.78-110.66 137.92h32.05l94.63-117.95 94.64 117.95h105.65zm-164.2-112.911h41.55l218 271.7h-41.55z"
                                    opacity="1" data-original="#f0f0f1" class=""></path>
                            </g>
                        </svg>
                    </div>
                    <div class="social-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="25px" height="25px" x="0" y="0" viewBox="0 0 100 100"
                            style="enable-background:new 0 0 512 512" xml:space="preserve" class="">
                            <g>
                                <path
                                    d="M45.795 57.557 2.638 26.167l-.138.07v47.5a9.5 9.5 0 0 0 9.5 9.5h76a9.5 9.5 0 0 0 9.5-9.5V26.124l-.025-.013-43.27 31.447a7.15 7.15 0 0 1-8.41-.001z"
                                    fill="#c7c7c7" opacity="1" data-original="#000000" class=""></path>
                                <path
                                    d="m54.206 45.827 38.329-27.874c-1.343-.734-2.888-1.19-4.535-1.19H12c-1.647 0-3.167.456-4.535 1.19l38.33 27.874a7.15 7.15 0 0 0 8.41 0z"
                                    fill="#c7c7c7" opacity="1" data-original="#000000" class=""></path>
                            </g>
                        </svg>
                    </div>
                </div>
                <div class="copy-rights">
                    <p>&copy;Logoto.All rights reserved.</p>
                </div>
            </div>
        </div>
    </section>`
}

function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function isValidPhoneNumber(phone) {
  const regex = /^\d{10}$/;
  return regex.test(phone);
}

function generateReferralCode(length=8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = {sendOtp, validateEmail, isValidPhoneNumber, generateReferralCode }