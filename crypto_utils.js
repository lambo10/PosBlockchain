import crypto from 'crypto';

export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return { publicKey, privateKey };
}

export function sign(privateKey, data) {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();

  return sign.sign(privateKey, 'hex');
}

export function verify(publicKey, data, signature) {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  verify.end();

  return verify.verify(publicKey, signature, 'hex');
}
