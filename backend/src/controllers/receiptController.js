const pool = require('../config/db');
const storageService = require('../services/storageService');

// GET /api/receipts/:id/url
exports.getReceiptUrl = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const r = await pool.query('SELECT * FROM receipts WHERE id = $1', [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Receipt not found' });
    const receipt = r.rows[0];
    if (String(receipt.user_id) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });

    // extract key from storage_url if possible
    const storageUrl = receipt.storage_url || '';
    let key = null;
    try {
      const marker = '.amazonaws.com/';
      const idx = storageUrl.indexOf(marker);
      if (idx !== -1) {
        key = decodeURIComponent(storageUrl.slice(idx + marker.length));
      } else if (storageUrl.startsWith('s3://')) {
        key = storageUrl.replace(/^s3:\/\/[\w-]+\//, '');
      }
    } catch (e) {
      console.error('Failed parsing storage_url', e.message || e);
    }

    if (!key) return res.status(400).json({ error: 'Unable to resolve object key' });

    const signed = await storageService.generatePresignedUrl(key, 60);
    res.json({ url: signed, filename: receipt.filename });
  } catch (e) {
    console.error('getReceiptUrl error', e.message || e);
    res.status(500).json({ error: 'Server error' });
  }
};
