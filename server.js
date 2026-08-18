const bodyParser = require('body-parser')
const express = require('express')
const cookieParser = require('cookie-parser');
const app = express()
const path = require('path')
const port = 3002
const cors = require('cors')

const authRoute = require('./route/authRoute');
const userRoute = require('./route/userRoute');
const serviceRoute = require('./route/serviceRoute');
const contactQueryRoute = require('./route/contactQueryRoute');

const adminAuthRoute = require('./route/admin/adminAuthRoute');
const adminUserRoute = require('./route/admin/adminUserRoute');
const adminServiceRoute = require('./route/admin/adminServiceRoute');
const adminPackageRoute = require('./route/admin/adminPackageRoute');
const adminSettingsRoute = require('./route/admin/adminSettingsRoute');
const adminContactQueryRoute = require('./route/admin/adminContactQueryRoute');

const errorHandler = require('./middleware/errorHandler');
const connection = require('./Connection');

connection.getConnection((err, conn) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log('Connected to MySQL Database via Pool!');
    conn.release(); // Return connection back to the pool
});

// var whitelist = ['http://example1.com', 'http://example2.com']
// var corsOptions = {
//     origin: function (origin, callback) {
//         if (whitelist.indexOf(origin) !== -1) {
//             callback(null, true)
//         } else {
//             callback(new Error('Not allowed by CORS'))
//         }
//     }
// }

app.use(cors({
    origin: '*'
}))

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve files from the "uploads" folder
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath, {
    fallthrough: true // Allows Express to pass to next route if file is missing on disk
}));

console.log("Checking Absolute Static Path:", path.resolve(__dirname, 'uploads'));
const fs = require('fs');
console.log("Does folder exist?:", fs.existsSync(path.resolve(__dirname, 'uploads')));

// Frontend
app.get('/', async (req, res) => {
    res.send("Server Started")
})
const { razorpayWebhook } = require('./controller/service/packageControler');
app.post('/webhook/razorpay', razorpayWebhook);
app.post('/razorpay-webhook', razorpayWebhook);

app.use('/auth', authRoute)
app.use('/user', userRoute)
app.use('/service', serviceRoute)
app.use('/contact-query', contactQueryRoute)
app.use('/contact-queries', contactQueryRoute)

// Admin
app.use('/admin', adminAuthRoute)
app.use('/admin/user', adminUserRoute)
app.use('/admin/service', adminServiceRoute)
app.use('/admin/package', adminPackageRoute)
app.use('/admin/settings', adminSettingsRoute)
app.use('/admin/contact-query', adminContactQueryRoute)
app.use('/admin/contact-queries', adminContactQueryRoute)

// 404
app.use('/{*path}', (req, res) => {
    res.status(404).json({ status: false, msg: 'Page Not Found!' });
});
app.use(errorHandler)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
})
