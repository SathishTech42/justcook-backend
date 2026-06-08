require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const nodemailer = require('nodemailer');

// ── Email Notification Setup ──────────────────────────────
let emailTransporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });
    console.log('✅ Gmail email notifications enabled.');
} else {
    console.warn('⚠️ Gmail credentials not set. Email notifications disabled.');
}

async function sendOrderEmail(orderId, customer, items, total, paymentMethod) {
    if (!emailTransporter) return;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
    const itemsList = (items || []).map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.qty || i.quantity || 1}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${i.price}</td></tr>`).join('');
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#ff5a5f;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:24px;">🚨 New Order Received!</h1>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #eee;">
            <h2 style="color:#ff5a5f;">Order #${orderId}</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <tr><td style="padding:8px;font-weight:bold;">Customer:</td><td style="padding:8px;">${customer.name}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Phone:</td><td style="padding:8px;">${customer.phone}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Email:</td><td style="padding:8px;">${customer.email || 'N/A'}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Address:</td><td style="padding:8px;">${customer.address}, ${customer.city} - ${customer.pincode}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Payment:</td><td style="padding:8px;">${paymentMethod}</td></tr>
            </table>
            <h3>Items Ordered:</h3>
            <table style="width:100%;border-collapse:collapse;">
                <tr style="background:#f5f5f5;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;">Qty</th><th style="padding:8px;text-align:right;">Price</th></tr>
                ${itemsList}
            </table>
            <h2 style="text-align:right;color:#ff5a5f;">Total: ₹${total}</h2>
        </div>
        <div style="background:#f9f9f9;padding:16px;border-radius:0 0 12px 12px;text-align:center;color:#999;font-size:12px;">
            JustCook Admin Notification • <a href="https://www.justcook.co.in/pages/admin.html">Open Admin Panel</a>
        </div>
    </div>`;
    try {
        await emailTransporter.sendMail({
            from: `"JustCook Orders" <${process.env.GMAIL_USER}>`,
            to: adminEmail,
            subject: `🚨 New Order #${orderId} — ₹${total} from ${customer.name}`,
            html
        });
        console.log(`📧 Order notification email sent for ${orderId}`);
    } catch (err) {
        console.error('❌ Failed to send order email:', err.message);
    }
}

// WhatsApp is optional — if Chrome is not available, the server still runs fine
let sendWhatsAppMessage = async () => {}; // no-op fallback
try {
    const wa = require('./whatsappClient');
    sendWhatsAppMessage = wa.sendWhatsAppMessage;
    console.log('✅ WhatsApp client loaded.');
} catch (e) {
    console.warn('⚠️ WhatsApp client failed to load. Orders will work, but WhatsApp notifications are disabled.', e.message);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
const allowedOrigins = ['https://justcook.co.in', 'https://www.justcook.co.in', 'http://localhost:5500', 'http://localhost:3000'];
app.use(cors({
    origin: function(origin, callback){
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
            return callback(new Error('CORS policy violation'), false);
        }
        return callback(null, true);
    }
}));
app.use(express.json());

// Serve static frontend files from the parent 'justcook' directory
app.use(express.static(path.join(__dirname, '../')));

// Initialize Supabase Client (Service Role for admin privileges)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL') {
    console.warn('⚠️ Supabase URL and Key are not configured in .env file!');
}

const supabase = createClient(supabaseUrl || 'http://localhost', supabaseKey || 'dummy');

// ── API ENDPOINTS ──────────────────────────────────────────────

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'JustCook Backend is running!' });
});

// Place a new Order
app.post('/api/orders', async (req, res) => {
    try {
        const { customer, items, total, paymentMethod, paymentId, userId, userEmail } = req.body;

        const orderId = 'JC' + Math.floor(1000 + Math.random() * 9000);

        const { data, error } = await supabase
            .from('orders')
            .insert([{
                order_id: orderId,
                user_id: userId || 'guest',
                user_email: userEmail || 'guest',
                customer_info: customer,
                items: items,
                total: total,
                payment_method: paymentMethod,
                payment_id: paymentId,
                status: 'Pending'
            }])
            .select()
            .single();

        if (error) throw error;

        // Send Email to Admin
        sendOrderEmail(orderId, customer, items, total, paymentMethod);

        // Send WhatsApp Message to Admin
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
        if (adminPhone) {
            const msg = `🚨 *NEW ORDER RECEIVED!* 🚨
*Order ID:* ${orderId}
*Amount:* ₹${total}
*Customer:* ${customer.name}
*Phone:* ${customer.phone}
*Address:* ${customer.address}, ${customer.city} - ${customer.pincode}
*Status:* Paid (${paymentMethod})`;
            
            sendWhatsAppMessage(adminPhone, msg);
        }

        res.status(201).json({ success: true, orderId: orderId, docId: data.id });
    } catch (err) {
        console.error('Error placing order:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get All Orders (Admin)
app.get('/api/orders', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const mappedData = data.map(order => ({
            docId: order.id,
            id: order.order_id,
            userId: order.user_id,
            userEmail: order.user_email,
            customer: order.customer_info,
            items: order.items,
            total: order.total,
            paymentMethod: order.payment_method,
            paymentId: order.payment_id,
            status: order.status,
            createdAt: order.created_at
        }));

        res.json(mappedData);
    } catch (err) {
        console.error('Error fetching all orders:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get User's Orders
app.get('/api/orders/user/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Map data to match old Firebase structure
        const mappedData = data.map(order => ({
            docId: order.id,
            id: order.order_id,
            userId: order.user_id,
            userEmail: order.user_email,
            customer: order.customer_info,
            items: order.items,
            total: order.total,
            paymentMethod: order.payment_method,
            paymentId: order.payment_id,
            status: order.status,
            createdAt: order.created_at
        }));

        res.json(mappedData);
    } catch (err) {
        console.error('Error fetching user orders:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Order by ID
app.get('/api/orders/id/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', id.toUpperCase())
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
        if (!data) return res.json(null);

        const mappedData = {
            docId: data.id,
            id: data.order_id,
            userId: data.user_id,
            userEmail: data.user_email,
            customer: data.customer_info,
            items: data.items,
            total: data.total,
            paymentMethod: data.payment_method,
            paymentId: data.payment_id,
            status: data.status,
            createdAt: data.created_at
        };

        res.json(mappedData);
    } catch (err) {
        console.error('Error fetching order by ID:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Orders by Phone (Guest tracking)
app.get('/api/orders/phone/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_info->>phone', phone)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const mappedData = data.map(order => ({
            docId: order.id,
            id: order.order_id,
            customer: order.customer_info,
            items: order.items,
            total: order.total,
            status: order.status,
            createdAt: order.created_at
        }));

        res.json(mappedData);
    } catch (err) {
        console.error('Error fetching phone orders:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update Order Status
app.patch('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { error } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating status:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
