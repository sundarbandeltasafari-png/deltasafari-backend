const bodyParser = require('body-parser')
const express = require('express')
const cookieParser = require('cookie-parser');
const http = require('http');
const app = express()
const server = http.createServer(app);
const path = require('path')
const port = 3002
const cors = require('cors')

// Initialize Socket.io Server for Real-Time Admin Chat
const { initSocketServer } = require('./socket/chatSocket');
initSocketServer(server);

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

app.use(cors({
    origin: '*'
}))

app.use(cookieParser());
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve files from the "uploads" folder
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath, {
    fallthrough: true // Allows Express to pass to next route if file is missing on disk
}));

console.log("Checking Absolute Static Path:", path.resolve(__dirname, 'uploads'));
const fs = require('fs');
console.log("Does folder exist?:", fs.existsSync(path.resolve(__dirname, 'uploads')));

const whatsappWebhookRoute = require('./route/whatsappWebhookRoute');
const adminWhatsappRoute = require('./route/admin/adminWhatsappRoute');
const crmFollowupRoute = require('./route/admin/crmFollowupRoute');
const whatsappMarketingRoute = require('./route/admin/whatsappMarketingRoute');
const peakDatesRoute = require('./route/admin/peakDatesRoute');
const invoiceRoute = require('./route/admin/invoiceRoute');
const taskRoute = require('./route/admin/taskRoute');
const noticeRoute = require('./route/admin/noticeRoute');
const chatRoute = require('./route/admin/chatRoute');
const bookingUsersRoute = require('./route/admin/bookingUsersRoute');

// Frontend
app.get('/', async (req, res) => {
    res.send("Server Started")
})
const { razorpayWebhook } = require('./controller/service/packageControler');
app.post('/webhook/razorpay', razorpayWebhook);
app.post('/razorpay-webhook', razorpayWebhook);

// WhatsApp Business Cloud API Webhooks
app.use('/webhook/whatsapp', whatsappWebhookRoute);
app.use('/api/whatsapp-webhook', whatsappWebhookRoute);
app.use('/webhook/whatsapp.php', whatsappWebhookRoute);

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
app.use('/admin/whatsapp', adminWhatsappRoute)
app.use('/admin/crm/followups', crmFollowupRoute)
app.use('/admin/whatsapp/followups', crmFollowupRoute)
app.use('/admin/whatsapp/marketing', whatsappMarketingRoute)
app.use('/admin/crm/marketing', whatsappMarketingRoute)
app.use('/admin/crm/peak-dates', peakDatesRoute)
app.use('/admin/peak-dates', peakDatesRoute)
app.use('/admin/crm/invoices', invoiceRoute)
app.use('/admin/invoices', invoiceRoute)
app.use('/admin/crm/tasks', taskRoute)
app.use('/admin/tasks', taskRoute)
app.use('/admin/crm/notices', noticeRoute)
app.use('/admin/notices', noticeRoute)
app.use('/admin/crm/chat', chatRoute)
app.use('/admin/chat', chatRoute)
app.use('/admin/crm/booking-users', bookingUsersRoute)
app.use('/admin/booking-users', bookingUsersRoute)

// 404
app.use('/{*path}', (req, res) => {
    res.status(404).json({ status: false, msg: 'Page Not Found!' });
});
app.use(errorHandler)

server.listen(port, () => {
    console.log(`Delta Safari Server with Socket.io listening on port ${port}!`)
})
