import { storagePrefix } from '@/lib/brand';

const ADMIN_TOKEN_KEY = `${storagePrefix}_admin_token`;
const ADMIN_AUTH_EVENT = 'client-store-admin-auth';

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAdminToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }
  return data;
}

const compressImageToDataUrl = (file, maxSize = 1000, quality = 0.78) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

export const adminAuth = {
  tokenKey: ADMIN_TOKEN_KEY,

  getToken: getAdminToken,

  getSession: async () => {
    const token = getAdminToken();
    if (!token) return null;
    try {
      const { user } = await apiFetch('/api/auth');
      return { user };
    } catch {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      return null;
    }
  },

  login: async ({ email, password }) => {
    const { token, user } = await apiFetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
    return { user };
  },

  logout: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
  },
};

export { ADMIN_AUTH_EVENT };

export const categoryStore = {
  list: () => apiFetch('/api/categories'),

  add: ({ name, icon }) =>
    apiFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), icon }),
    }),

  update: (oldName, { name, icon }) =>
    apiFetch('/api/categories', {
      method: 'PUT',
      body: JSON.stringify({ oldName, name: name.trim(), icon }),
    }),

  delete: (name) =>
    apiFetch('/api/categories', {
      method: 'DELETE',
      body: JSON.stringify({ name }),
    }),
};

export const base44 = {
  entities: {
    Product: {
      list: () => apiFetch('/api/products'),

      get: async (id) => {
        const products = await apiFetch('/api/products');
        const product = products.find((item) => item.id === id);
        if (!product) throw new Error('Product not found');
        return product;
      },

      create: (productData) =>
        apiFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(productData),
        }),

      update: (id, productData) =>
        apiFetch('/api/products', {
          method: 'PUT',
          body: JSON.stringify({ id, data: productData }),
        }),

      delete: (id) =>
        apiFetch('/api/products', {
          method: 'DELETE',
          body: JSON.stringify({ id }),
        }),
    },

    Order: {
      list: () => apiFetch('/api/orders'),

      track: ({ phone, id }) => {
        const params = new URLSearchParams();
        if (phone) params.set('phone', phone);
        if (id) params.set('id', id);
        return apiFetch(`/api/orders?${params.toString()}`);
      },

      create: (orderData) =>
        apiFetch('/api/orders', {
          method: 'POST',
          body: JSON.stringify(orderData),
        }),

      updateStatus: (id, status) =>
        apiFetch('/api/orders', {
          method: 'PUT',
          body: JSON.stringify({ id, status }),
        }),

      delete: (id) =>
        apiFetch('/api/orders', {
          method: 'DELETE',
          body: JSON.stringify({ id }),
        }),
    },
  },

  analytics: {
    summary: (days = 30) => apiFetch(`/api/events?days=${days}`),
  },

  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const dataUrl = await compressImageToDataUrl(file);
        return apiFetch('/api/upload', {
          method: 'POST',
          body: JSON.stringify({ file: dataUrl }),
        });
      },
    },
  },
};
