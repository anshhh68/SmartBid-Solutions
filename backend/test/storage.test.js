const test = require('node:test');
const assert = require('node:assert');
const { useCloudinary, getUploadStorage, getUploadedFileUrl } = require('../src/utils/storage');

const VARS = ['CLOUDINARY_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

function withEnv(env, fn) {
  const saved = Object.fromEntries(VARS.map(k => [k, process.env[k]]));
  VARS.forEach(k => delete process.env[k]);
  Object.assign(process.env, env);
  try { return fn(); } finally {
    VARS.forEach(k => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  }
}

test('disk storage and /uploads URL when Cloudinary vars are unset', async () => {
  await withEnv({}, async () => {
    assert.equal(useCloudinary(), false);
    assert.equal(getUploadStorage().constructor.name, 'DiskStorage');
    assert.equal(await getUploadedFileUrl({ filename: 'abc.pdf' }), '/uploads/abc.pdf');
  });
});

test('partial Cloudinary vars still use disk', () => {
  withEnv({ CLOUDINARY_CLOUD_NAME: 'x', CLOUDINARY_API_KEY: 'y' }, () => {
    assert.equal(useCloudinary(), false);
  });
});

test('Cloudinary selected when CLOUDINARY_URL or all three vars are set', () => {
  withEnv({ CLOUDINARY_URL: 'cloudinary://k:s@demo' }, () => assert.equal(useCloudinary(), true));
  withEnv({ CLOUDINARY_CLOUD_NAME: 'x', CLOUDINARY_API_KEY: 'y', CLOUDINARY_API_SECRET: 'z' }, () => {
    assert.equal(useCloudinary(), true);
    assert.equal(getUploadStorage().constructor.name, 'MemoryStorage');
  });
});
