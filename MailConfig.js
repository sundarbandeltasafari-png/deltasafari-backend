const dotenv = require('dotenv');
dotenv.config();
const Mailjet = require('node-mailjet');
const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE,
);

module.exports = function mailJetConf(toEmail, toName, subject, html) {
    return mailjet
        .post('send', { version: 'v3.1' })
        .request({
            Messages: [
                {
                    From: {
                        Email: process.env.MJ_FROM_EMAIL, // Sender's validated email address
                        Name: process.env.MJ_FROM_NAME,
                    },
                    To: [
                        {
                            Email: toEmail, // Recipient's email address
                            Name: toName,
                        },
                    ],
                    Subject: subject,
                    HtmlPart: html,
                },
            ],
        });
}

// const sgMail = require('@sendgrid/mail')
// sgMail.setApiKey(process.env.SENDGRID_API_KEY)
// // sgMail.setDataResidency('eu'); 
// // uncomment the above line if you are sending mail using a regional EU subuser


// module.exports = function mailJetConf(toEmail, toName, subject, html) {
//     const msg = {
//         to: 'kaushik.codeulas@gmail.com', // Change to your recipient
//         from: 'kaushik@codeulas.com', // Change to your verified sender
//         subject: 'Sending with SendGrid is Fun',
//         text: 'and easy to do anywhere, even with Node.js',
//         html: '<strong>and easy to do anywhere, even with Node.js</strong>',
//     }
//     return sgMail
//         .send(msg)
//         .then(() => {
//             console.log('Email sent')
//         })
//         .catch((error) => {
//             console.error(error)
//         })
// }
