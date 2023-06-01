const { create } = require("axios");
const { Scalar } = require("ffjavascript");
const { buildEddsa } = require("circomlibjs");
const { Wallet, AbiCoder, JsonRpcProvider, solidityPacked, getBytes } = require("ethers");

const args = process.argv.slice(2);

const clientPrivateKey = args
  .find((arg) => arg.startsWith("--privateKey="))
  ?.replace("--privateKey=", "")

if(!clientPrivateKey) {
  throw new Error('Invalid client private key')
}

const provider = new JsonRpcProvider(
  'https://matic-mumbai.chainstacklabs.com',
  {
    chainId: 80001,
    name: 'polygon-mumbai',
  },
);

const baseURL = 'https://stage.issuer.app.purefi.io';
const issuerPublicKey = [
  new Uint8Array([
    249, 243, 115, 223,  54, 127, 193,
     99, 194, 199, 141,  87, 250, 138,
    219, 226,  40, 110, 139, 211, 223,
    109,  75, 209,  53, 246, 120, 255,
    217, 129, 180,  41
  ]),
  new Uint8Array([
    88, 142,  94, 222, 156, 192, 121,  80,
   108, 249, 218, 225, 179,  24,  66, 148,
   188, 177, 180,  29, 184, 132, 216,  90,
    38, 204,  46, 184,  53, 251,  88,  14
  ])
];

const dataType2 = {
  sender: "0x6738A0F6E68219111189827c87EbCAD653677bAe",
  ruleId: "631050090",
  amount: "0x056bc75e2d63100000",
  receiver: "0x712415609e1727F25637a03B08C5c5Bab10911fb",
  token: "0xe2a59d5e33c6540e18aaa46bf98917ac3158db0d",
  chainId: "80001"
};

const signer = new Wallet(clientPrivateKey, provider);

const postRule = async () => {
  const message = JSON.stringify(dataType2);
  const signature = await signer.signMessage(message);

  const instance = create({
    baseURL
  });

  try {
    const res = await instance.post('/v4/rule', {
      message,
      signature,
      signType: 'babyJubJub',
    });

    return res.data;
  } catch(err) {
    console.log(err);
  }
};

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
  console.log(start, offset, message.slice(start, start + offset));
  return uint8ArrayToBigInt(
    new Uint8Array(message.slice(start, start + offset)),
  );
}

const validSignature = async (timestamp, signature, purefiPackage, issuerPublicKey) => {
  const eddsa = await buildEddsa();
  
  const message = getBytes(
    solidityPacked(["uint64", "bytes"], [timestamp, purefiPackage])
  );
  
  const _timestamp = extractBigInt(message, 0, 8); // start: 0, offset: 8 bytes
  const _pkgType = extractBigInt(message, 39, 1); // start: 8, offset: 1 byte
  const _ruleId = extractBigInt(message, 40, 32); // start: 40, offset: 32 bytes
  const _sessionIdHex = extractBigInt(message, 72, 31); // start: 72, offset: 32 bytes
  const _sender = extractBigInt(message, 116, 20); // start: 104, offset: 20 bytes (address)
  const _receiver = extractBigInt(message, 148, 20); // start: 136, offset: 20 bytes (address)
  const _token = extractBigInt(message, 180, 20); // start: 168, offset: 20 bytes (address)
  const _amount = extractBigInt(message, 200, 32); // start: 200, offset: 32 bytes
  
  const messageHash = eddsa.poseidon([
    _pkgType,
    _timestamp,
    _sender,
    _receiver,
    _token,
    _sessionIdHex,
    _ruleId,
    _amount,
  ]);

  const pSignature = getBytes(signature);

  const uSignature = eddsa.unpackSignature(pSignature);
  
  const isValid = eddsa.verifyPoseidon(messageHash, uSignature, issuerPublicKey);

  return isValid;
} 


const run = async  () => {
  const purefiData = await postRule();

  console.log('Result:', purefiData);

  const abiCoder = AbiCoder.defaultAbiCoder();
  const [timestamp, signature, purefiPackage] = abiCoder.decode(["uint64", "bytes", "bytes"], purefiData)

  const [packageType, ruleId, sessionIdHex, sender, receiver, token, amount] = abiCoder.decode([
    "uint8",
    "uint256",
    "uint256",
    "address",
    "address",
    "address",
    "uint256",
  ], purefiPackage);

  console.log('purefiPackage:', {
    packageType: Number(packageType), 
    ruleId: Number(ruleId), 
    sessionIdHex: Number(sessionIdHex), 
    sender, 
    receiver, 
    token, 
    amount: Number(amount)
  })

  const isValid = await validSignature(timestamp, signature, purefiPackage, issuerPublicKey);

  console.log('isValid:', isValid);
}

run();