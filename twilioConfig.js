const dotenv = require('dotenv');
dotenv.config();
const accountSid = process.env.TW_ACCOUNT_SID;
const authToken = process.env.TW_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);


module.exports = function twilioConf(toNumber, body) {
    return client.messages
    .create({
        body: body,
        from: process.env.TW_FROM_NUMBER,
        to: `+91${toNumber}`
    })
    .then(message => console.log(message.sid)).catch((error)=>{
        console.log(error)
    });
}