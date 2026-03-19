const PDFDocument = require('pdfkit');

/**
 * Generates a themed PDF invoice for an order.
 * @param {Object} order - The order document from MongoDB (populated with branch and items).
 * @param {Stream} dataStream - The response stream to pipe the PDF into.
 */
const generateInvoice = (order, dataStream) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Brown Theme Colors
    const COLOR_BG = '#fdfaf7';      // Light Cream
    const COLOR_PRIMARY = '#5C4033'; // Website Primary Brown
    const COLOR_ACCENT = '#A08C7D';  // Website Accent Brown
    const COLOR_BORDER = '#E8D8C3';  // Website Border Brown

    doc.pipe(dataStream);

    // --- BACKGROUND ---
    doc
      .rect(0, 0, 600, 1000)
      .fill(COLOR_BG);

    // --- HEADER ---
    doc
      .rect(0, 0, 600, 150)
      .fill(COLOR_PRIMARY);

    // Draw Coffee Cup Icon (Vector)
    doc
      .save()
      .translate(50, 40)
      .scale(2)
      .path('M17 8h1a4 4 0 1 1 0 8h-1')
      .path('M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z')
      .path('M6 2v2M10 2v2M14 2v2')
      .lineWidth(1.5)
      .strokeColor('#FFFFFF')
      .stroke()
      .restore();

    doc
      .fillColor('#FFFFFF')
      .fontSize(32)
      .font('Helvetica-Bold')
      .text('OPTIMIST.', 115, 45, { characterSpacing: 2 });

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('BETTER COFFEE. BETTER MOOD.', 115, 85, { characterSpacing: 1.5 });

    doc
      .fontSize(12)
      .text('TAX INVOICE', 450, 65, { align: 'right' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`#${order._id.toString().toUpperCase()}`, 450, 85, { align: 'right' });

    // --- BRANCH & INFO ---
    doc
      .fillColor(COLOR_PRIMARY)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('LOCATION', 50, 180, { characterSpacing: 1 })
      .font('Helvetica')
      .fontSize(12)
      .text(order.branch ? order.branch.name.toUpperCase() : 'OPTIMIST COFFEE', 50, 195)
      .fontSize(9)
      .text(order.branch ? order.branch.address : 'Store Pickup', 50, 212, { width: 200 });

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('BILL TO', 350, 180, { characterSpacing: 1 })
      .font('Helvetica')
      .fontSize(12)
      .text(order.user ? `${order.user.name || 'CUSTOMER'}`.toUpperCase() : 'CUSTOMER', 350, 195)
      .fontSize(9)
      .text(order.shippingAddress ? `${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''}` : 'In-Store', 350, 212);

    // --- TABLE HEADER ---
    doc
      .rect(50, 260, 500, 25)
      .fill(COLOR_PRIMARY);

    doc
      .fillColor('#FFFFFF')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('ITEM', 60, 270)
      .text('QTY', 300, 270)
      .text('PRICE', 380, 270)
      .text('TOTAL', 480, 270, { align: 'right' });

    // --- ITEMS ---
    let yPos = 300;
    doc.fillColor(COLOR_PRIMARY).font('Helvetica');

    order.orderItems.forEach(item => {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(item.name.toUpperCase(), 60, yPos)
        .fontSize(8)
        .font('Helvetica')
        .text(`${item.variant?.name || 'REGULAR'}`, 60, yPos + 12, { opacity: 0.6 });

      doc.text(item.quantity.toString(), 300, yPos);
      doc.text(`$${item.priceAtPurchase.toFixed(2)}`, 380, yPos);
      doc.text(`$${(item.priceAtPurchase * item.quantity).toFixed(2)}`, 480, yPos, { align: 'right' });

      yPos += 40;
      
      // Horizontal Line
      doc
        .moveTo(50, yPos - 15)
        .lineTo(550, yPos - 15)
        .lineWidth(0.5)
        .strokeColor(COLOR_BORDER)
        .stroke();
    });

    // --- SUMMARY ---
    yPos += 20;
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('SUBTOTAL', 350, yPos)
      .font('Helvetica')
      .text(`$${order.subtotal.toFixed(2)}`, 480, yPos, { align: 'right' });

    yPos += 20;
    doc
      .font('Helvetica-Bold')
      .text('TAX (10%)', 350, yPos)
      .font('Helvetica')
      .text(`$${order.tax.toFixed(2)}`, 480, yPos, { align: 'right' });

    yPos += 20;
    doc
      .font('Helvetica-Bold')
      .text('DELIVERY FEE', 350, yPos)
      .font('Helvetica')
      .text(`$${order.deliveryFee.toFixed(2)}`, 480, yPos, { align: 'right' });

    yPos += 30;
    doc
      .rect(340, yPos - 10, 210, 40)
      .fill(COLOR_PRIMARY);

    doc
      .fillColor('#FFFFFF')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('TOTAL', 350, yPos + 5)
      .text(`$${order.totalPrice.toFixed(2)}`, 480, yPos + 5, { align: 'right' });

    // --- FOOTER ---
    doc
      .fillColor(COLOR_ACCENT)
      .fontSize(8)
      .text('THANK YOU FOR YOUR BUSINESS. STAY OPTIMISTIC.', 50, 750, { align: 'center', characterSpacing: 2 });

    doc.end();
};

module.exports = generateInvoice;
