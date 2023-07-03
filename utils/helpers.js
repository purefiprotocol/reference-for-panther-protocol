const {
  getBytes,
  solidityPacked,
} = require("ethers");
const { buildEddsa } = require("circomlibjs");

const bufferToBigInt = (buf) => {
  const hex = buf.toString('hex');
  if (hex.length === 0) {
    return BigInt(0);
  }
  return BigInt(`0x${hex}`);
};

function uint8ArrayToBigInt(uint8Array) {
  return bufferToBigInt(Buffer.from(uint8Array));
}

function extractBigInt(message, start, offset = 32) {
  return uint8ArrayToBigInt(
    new Uint8Array(message.slice(start, start + offset)),
  );
}

const validSignature = async (
  timestamp,
  signature,
  purefiPackage,
  issuerPublicKey
) => {
  const eddsa = await buildEddsa();
  
  const message = getBytes(
    solidityPacked(["uint64", "bytes"], [timestamp, purefiPackage])
  );
  
  const _timestamp = extractBigInt(message, 0, 8);
  const _pkgType = extractBigInt(message, 39, 1);
  const _ruleId = extractBigInt(message, 40, 32);
  const _sessionIdHex = extractBigInt(message, 72, 31);
  const _sender = extractBigInt(message, 116, 20);
  const _receiver = extractBigInt(message, 148, 20);

  const messageHash = eddsa.poseidon([
    _pkgType,
    _timestamp,
    _sender,
    _receiver,
    _sessionIdHex,
    _ruleId,
  ]);
  
  const pSignature = getBytes(signature);
  
  const uSignature = eddsa.unpackSignature(pSignature);
  
  const isValid = eddsa.verifyPoseidon(messageHash, uSignature, issuerPublicKey);

  return isValid;
}

module.exports = {
  extractBigInt,
  validSignature,
};