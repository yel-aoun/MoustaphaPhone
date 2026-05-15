import crypto from 'node:crypto';
import { requireAdmin } from './_lib/auth.js';
import { handleOptions, readJson, sendError, sendJson } from './_lib/http.js';

function signCloudinary(params, apiSecret) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(payload + apiSecret).digest('hex');
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');
    if (!requireAdmin(req, res)) return;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return sendError(res, 500, 'Cloudinary environment variables are missing');
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(cloudName)) {
      return sendError(res, 500, 'CLOUDINARY_CLOUD_NAME must be the lowercase cloud name from your Cloudinary dashboard');
    }

    const { file, folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'client-store-products' } = await readJson(req);
    if (!file || typeof file !== 'string') return sendError(res, 400, 'Image file is required');

    const timestamp = Math.floor(Date.now() / 1000);
    const params = { folder, timestamp };
    const signature = signCloudinary(params, apiSecret);
    const form = new FormData();
    form.set('file', file);
    form.set('folder', folder);
    form.set('timestamp', String(timestamp));
    form.set('api_key', apiKey);
    form.set('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    const result = await response.json();
    if (!response.ok) {
      return sendError(res, 502, result.error?.message || 'Cloudinary upload failed');
    }

    return sendJson(res, 200, {
      file_url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Upload failed');
  }
}
