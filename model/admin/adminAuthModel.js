const connection = require('../../Connection');
const md5 = require('md5');

function getParticularUser(email) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user_master WHERE admin = 1 AND (email = ? OR phone = ?)', [email, email], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database: " + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    });
}

function getParticularUserById(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user_master WHERE id = ?', [id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database: " + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    });
}

function getLoginUser(email, password) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user_master WHERE password = ? AND admin = 1 AND (email = ? OR phone = ?)', [password, email, email], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database: " + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    });
}

function setUser(details, email) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE user_master SET ? WHERE email = ? OR phone = ?', [details, email, email], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database: " + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    });
}

function setUserByOtp(details, email, otp) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE user_master SET ? WHERE otp = ? AND admin = 1 AND (email = ? OR phone = ?)', [details, otp, email, email], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database: " + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    });
}

function getOTPUser(email, otp) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user_master WHERE otp = ? AND admin = 1 AND (email = ? OR phone = ?)', [otp, email, email], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database: " + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    });
}

function getTokenUser(id, email) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user_master WHERE id = ? AND (email = ? OR phone = ?)', [id, email, email], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database: " + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    });
}

module.exports = { getParticularUser, getLoginUser, getOTPUser, setUser, setUserByOtp, getTokenUser, getParticularUserById };