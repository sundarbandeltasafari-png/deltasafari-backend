const jwt = require('jsonwebtoken');
require('dotenv').config()

const secretkey = `${process.env.JWT_SECRET_KEY}`

function getToken(data) {
    try {
        const token = jwt.sign(data, secretkey);
        return {status: true, token: token};
    } catch (error) {
        return {status: false, msg: error.message}
    }
}

function validateToken(token) {
    try {
        const decoded = jwt.verify(token, secretkey);
         return {status: true, data: decoded};
    } catch (error) {
        return {status: false, msg: error.message}
    }
}


module.exports = { getToken, validateToken }