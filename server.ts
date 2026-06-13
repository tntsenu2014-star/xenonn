import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { 
  initDatabase, 
  getList, 
  getDocById, 
  insertDoc, 
  updateDocById, 
  deleteDocById,
  makeId 
} from './server/mongodb.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQL/Fallback database connection on server bootup in background
  initDatabase().catch(err => {
    console.error("Database connection initialization failed in background:", err);
  });

  // Use body-parser with increased limits for large uploads (base64 payment slips/avatars)
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(express.json({ limit: '50mb' }));

  // === File Upload and Serving Routes (MongoDB durable backup) ===
  app.post('/api/upload', async (req, res) => {
    try {
      const { fileName, mimeType, data } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'No file data received' });
      }
      const id = 'img_' + makeId();
      await insertDoc('uploads', {
        id,
        fileName: fileName || 'upload.bin',
        mimeType: mimeType || 'application/octet-stream',
        data: data, // base64 representation
        createdAt: Date.now()
      });
      res.status(201).json({ url: `/api/uploads/${id}` });
    } catch (err: any) {
      console.error('File upload API error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/uploads/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const record = await getDocById('uploads', id);
      if (!record || !record.data) {
        return res.status(404).send('Not Found');
      }
      
      let cleanData = record.data;
      if (cleanData.includes(';base64,')) {
        cleanData = cleanData.split(';base64,')[1];
      }
      
      const buffer = Buffer.from(cleanData, 'base64');
      res.setHeader('Content-Type', record.mimeType || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(buffer);
    } catch (err) {
      console.error('File serving error:', err);
      res.status(500).send('Error');
    }
  });

  // === Express API Database Proxy Routes ===

  // Get list of records from table (optionally filter with query strings)
  app.get('/api/db/:table', async (req, res) => {
    try {
      const table = req.params.table;
      let list = await getList(table);
      
      // Basic query parameter filtering (e.g., ?isActive=true)
      for (const [key, val] of Object.entries(req.query)) {
        list = list.filter(item => {
          const itemVal = item[key];
          if (typeof itemVal === 'boolean') {
            return String(itemVal) === val;
          }
          return String(itemVal) === String(val);
        });
      }
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get a specific document by ID
  app.get('/api/db/:table/:id', async (req, res) => {
    try {
      const { table, id } = req.params;
      const doc = await getDocById(table, id);
      if (!doc) {
        return res.status(404).json({ error: `Document ${id} not found in ${table}` });
      }
      res.json(doc);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create a record
  app.post('/api/db/:table', async (req, res) => {
    try {
      const table = req.params.table;
      const id = await insertDoc(table, req.body);
      res.status(201).json({ id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update a record by ID
  app.put('/api/db/:table/:id', async (req, res) => {
    try {
      const { table, id } = req.params;
      await updateDocById(table, id, req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a record by ID
  app.delete('/api/db/:table/:id', async (req, res) => {
    try {
      const { table, id } = req.params;
      await deleteDocById(table, id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PayHere Hash Generation
  app.post('/api/payhere-hash', (req, res) => {
    const { orderId, amount, currency } = req.body;
    
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_SECRET;

    if (!merchantId || !merchantSecret) {
      return res.status(500).json({ error: 'PayHere credentials not configured on server' });
    }

    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const amountFormatted = Number(amount).toFixed(2);
    
    const hash = crypto.createHash('md5')
      .update(merchantId + orderId + amountFormatted + currency + hashedSecret)
      .digest('hex')
      .toUpperCase();

    res.json({ hash, merchantId });
  });

  // PayHere Payment Notification (IPN)
  app.post('/api/payhere-notify', async (req, res) => {
    const { 
      merchant_id, 
      order_id, 
      payhere_amount, 
      payhere_currency, 
      status_code, 
      md5sig,
      payment_id 
    } = req.body;

    const merchantSecret = process.env.PAYHERE_SECRET;
    
    if (!merchantSecret) {
      console.error("PayHere Secret missing in environment");
      return res.status(500).send("Error");
    }

    // Verify signature
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const localSig = crypto.createHash('md5')
      .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret)
      .digest('hex')
      .toUpperCase();

    if (localSig !== md5sig) {
      console.error("PayHere signature mismatch!", { order_id, md5sig, localSig });
      return res.status(400).send("Invalid signature");
    }

    // Status codes: 2 is success
    if (status_code === '2') {
      console.log(`Payment successful for Order: ${order_id}, Amount: ${payhere_amount}`);
      
      try {
        // Identify if it's a regular order or account order
        const isAccountOrder = order_id.startsWith('acc_') || order_id.includes('_acc_');
        const collectionName = isAccountOrder ? 'accountOrders' : 'orders';
        const cleanOrderId = isAccountOrder ? order_id.replace('acc_', '') : order_id;

        const orderDoc = await getDocById(collectionName, cleanOrderId);
        
        if (orderDoc) {
          await updateDocById(collectionName, cleanOrderId, {
            status: 'confirmed',
            payherePaymentId: payment_id,
            updatedAt: Date.now()
          });
          console.log(`Order ${order_id} updated to confirmed status in SQL Database.`);
          
          // Create in-app notification of confirmation
          await insertDoc('notifications', {
            title: 'Payment Confirmed',
            message: `Order #${cleanOrderId} has been successfully paid via PayHere!`,
            type: 'success',
            target: 'admin',
            createdAt: Date.now()
          });
        } else {
          console.warn(`Order ${order_id} not found in collection ${collectionName}`);
        }
      } catch (err) {
        console.error("Failed to update SQL database after PayHere notification:", err);
      }
    } else {
      console.log(`Payment status for Order ${order_id}: ${status_code}`);
    }

    res.status(200).send("OK");
  });

  // Email Notification Route
  app.post('/api/notify-order', async (req, res) => {
    const { orderId, customerName, packageName, amount, type } = req.body;
    
    const resendKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!resendKey || !adminEmail) {
      console.warn('RESEND_API_KEY or ADMIN_EMAIL not set. Skipping email notification.');
      return res.status(200).json({ status: 'skipped', message: 'Email config missing' });
    }

    try {
      const resend = new Resend(resendKey);
      
      const subject = type === 'ACCOUNT' 
        ? `New Account Purchase: ${packageName}`
        : `New Order Received: ${packageName}`;
        
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">${subject}</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Package/Account:</strong> ${packageName}</p>
          <p><strong>Amount:</strong> LKR ${amount.toLocaleString()}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated notification from your Diamond Store.</p>
        </div>
      `;

      await resend.emails.send({
        from: 'Diamond Store <onboarding@resend.dev>',
        to: adminEmail,
        subject: subject,
        html: html,
      });

      console.log(`Email notification sent for order ${orderId}`);
      res.json({ status: 'success' });
    } catch (error) {
      console.error('Failed to send email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
