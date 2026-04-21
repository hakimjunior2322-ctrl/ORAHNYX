const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// IN-MEMORY DATABASE (à remplacer par PostgreSQL)
let reservations = [];
let calendarSlots = [];
let products = [
    { id: 1, name: 'Sérum Luxe', price: 45, category: 'serums', stock: 50 },
    { id: 2, name: 'Crème Corps', price: 38, category: 'serums', stock: 50 },
    { id: 3, name: 'Masque Nettoyant', price: 32, category: 'serums', stock: 50 },
    { id: 4, name: 'Vernis Premium', price: 18, category: 'ongles', stock: 100 },
    { id: 5, name: 'Huile Capillaire', price: 28, category: 'cheveux', stock: 50 },
    { id: 6, name: 'Kit Beauté Glow', price: 85, category: 'kits', stock: 25 }
];

let packs = [
    { id: 1, name: 'Essentiel', duration: 30, price: 55 },
    { id: 2, name: 'Premium', duration: 90, price: 120 },
    { id: 3, name: 'Signature', duration: 120, price: 250 }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ====================
// CALENDAR & SLOTS
// ====================

// GET creneaux disponibles pour une date
app.get('/api/calendar/available/:date', (req, res) => {
    const { date } = req.params;
    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    
    // Filtrer les créneaux déjà réservés
    const bookedTimes = reservations
        .filter(r => r.date === date)
        .map(r => r.time);
    
    const available = timeSlots.filter(time => !bookedTimes.includes(time));
    
    res.json({ date, available, booked: bookedTimes });
});

// GET tous les créneaux du calendrier
app.get('/api/calendar/slots', (req, res) => {
    res.json({ slots: calendarSlots });
});

// POST - Ajouter des créneaux (admin)
app.post('/api/calendar/slots', (req, res) => {
    const { date, times } = req.body;
    
    if (!date || !times) {
        return res.status(400).json({ error: 'Missing date or times' });
    }

    const slot = { date, times, id: Date.now() };
    calendarSlots.push(slot);
    
    res.json({ success: true, slot });
});

// ====================
// RESERVATIONS
// ====================

// POST - Créer une réservation
app.post('/api/reservations/create', async (req, res) => {
    try {
        const { clientName, clientEmail, clientPhone, date, time, packId, products, totalPrice } = req.body;

        if (!clientName || !clientEmail || !date || !time || !packId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const pack = packs.find(p => p.id === packId);
        const reservation = {
            id: Date.now(),
            clientName,
            clientEmail,
            clientPhone,
            date,
            time,
            pack: pack.name,
            packPrice: pack.price,
            products: products || [],
            totalPrice,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        reservations.push(reservation);

        // Envoyer email de confirmation
        await sendConfirmationEmail(clientEmail, clientName, reservation);

        res.json({ success: true, reservation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Toutes les réservations (admin)
app.get('/api/reservations', (req, res) => {
    res.json({ reservations });
});

// GET - Réservations pour une date (pour le calendrier admin)
app.get('/api/reservations/date/:date', (req, res) => {
    const { date } = req.params;
    const dateReservations = reservations.filter(r => r.date === date);
    res.json({ date, reservations: dateReservations, count: dateReservations.length });
});

// GET - Une réservation spécifique
app.get('/api/reservations/:id', (req, res) => {
    const { id } = req.params;
    const reservation = reservations.find(r => r.id === parseInt(id));
    
    if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json({ reservation });
});

// DELETE - Annuler une réservation (admin)
app.delete('/api/reservations/:id', (req, res) => {
    const { id } = req.params;
    const index = reservations.findIndex(r => r.id === parseInt(id));
    
    if (index === -1) {
        return res.status(404).json({ error: 'Reservation not found' });
    }

    const deleted = reservations.splice(index, 1);
    res.json({ success: true, deleted: deleted[0] });
});

// ====================
// PRODUCTS
// ====================

// GET - Tous les produits
app.get('/api/products', (req, res) => {
    res.json({ products });
});

// GET - Produits par catégorie
app.get('/api/products/category/:cat', (req, res) => {
    const { cat } = req.params;
    const filtered = products.filter(p => p.category === cat);
    res.json({ category: cat, products: filtered });
});

// POST - Ajouter un produit (admin)
app.post('/api/products', (req, res) => {
    const { name, price, category, stock } = req.body;
    
    if (!name || !price || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const product = {
        id: Math.max(...products.map(p => p.id), 0) + 1,
        name,
        price,
        category,
        stock: stock || 0
    };

    products.push(product);
    res.json({ success: true, product });
});

// PUT - Mettre à jour produit (admin)
app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, price, category, stock } = req.body;
    
    const product = products.find(p => p.id === parseInt(id));
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (category) product.category = category;
    if (stock !== undefined) product.stock = stock;

    res.json({ success: true, product });
});

// ====================
// PACKS
// ====================

// GET - Tous les packs
app.get('/api/packs', (req, res) => {
    res.json({ packs });
});

// POST - Ajouter un pack (admin)
app.post('/api/packs', (req, res) => {
    const { name, duration, price } = req.body;
    
    if (!name || !duration || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const pack = {
        id: Math.max(...packs.map(p => p.id), 0) + 1,
        name,
        duration,
        price
    };

    packs.push(pack);
    res.json({ success: true, pack });
});

// ====================
// EMAIL
// ====================

const RESEND_API_KEY = process.env.RESEND_API_KEY;

app.post('/api/send-email', async (req, res) => {
    try {
        const { to, subject, html, reply_to } = req.body;

        if (!RESEND_API_KEY) {
            return res.status(500).json({ success: false, error: 'RESEND_API_KEY not configured' });
        }

        if (!to || !subject || !html) {
            return res.status(400).json({ success: false, error: 'Missing required fields: to, subject, html' });
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev',
                to: to,
                subject: subject,
                html: html,
                reply_to: reply_to || 'contact@salon.ae'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ Email sent to ${to}`);
            res.json({ success: true, data: data });
        } else {
            console.error('RESEND error:', data);
            res.status(response.status).json({ success: false, error: data.message || 'Failed to send email' });
        }
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Email de confirmation réservation
async function sendConfirmationEmail(email, name, reservation) {
    const productsHtml = reservation.products.length > 0 
        ? `<div style="margin: 15px 0;"><strong>Produits:</strong><br/>${reservation.products.map(p => `${p.name} (${p.price}€)`).join('<br/>')}</div>`
        : '';

    const html = `
        <html>
        <body style="font-family: Arial; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 8px;">
                <h2 style="color: #8b7355;">Réservation confirmée! ✅</h2>
                
                <p>Bonjour ${name},</p>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Date:</strong> ${reservation.date}</p>
                    <p><strong>Heure:</strong> ${reservation.time}</p>
                    <p><strong>Prestation:</strong> ${reservation.pack} (${reservation.packPrice}€)</p>
                    ${productsHtml}
                    <p style="border-top: 2px solid #8b7355; padding-top: 15px; margin-top: 15px;">
                        <strong>Total: ${reservation.totalPrice}€</strong>
                    </p>
                </div>

                <p>Merci de votre réservation! À bientôt au Salon Premium. ✨</p>
                
                <p style="color: #999; font-size: 12px;">
                    Salon Premium • Dubaï<br/>
                    +971 4 123 456 789
                </p>
            </div>
        </body>
        </html>
    `;

    try {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev',
                to: email,
                subject: `Confirmation de réservation - Salon Premium (${reservation.date} ${reservation.time})`,
                html: html
            })
        });
        console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error('Failed to send confirmation email:', error);
    }
}

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
