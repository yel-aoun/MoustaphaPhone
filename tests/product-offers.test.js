import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductOffer } from '../src/lib/products.js';

test('a 65 to 60 MAD reduction shows 8 percent and 5 MAD saved', () => {
  assert.deepEqual(getProductOffer({ price: 60, original_price: 65 }), { percent: 8, savings: 5 });
});

test('currency strings and decimal savings are handled without floating point residue', () => {
  assert.deepEqual(getProductOffer({ price: '19.90', original_price: '24.95' }), { percent: 20, savings: 5.05 });
});

test('missing, invalid, unchanged and increased prices are not advertised as offers', () => {
  for (const product of [null, {}, { price: null, original_price: 100 }, { price: 0 },
    { price: -1, original_price: 100 }, { price: 10, original_price: 0 },
    { price: 100, original_price: 100 }, { price: 110, original_price: 100 },
    { price: 'invalid', original_price: 100 }, { price: 50, original_price: Infinity }]) {
    assert.equal(getProductOffer(product), null);
  }
});
