const { create } = require('axios');
const { buildEddsa } = require("circomlibjs");
const { Wallet, JsonRpcProvider } = require('ethers');

const args = process.argv.slice(2);

const apiKey = args
  .find((arg) => arg.startsWith("--apiKey="))
  ?.replace("--apiKey=", "")

if(!apiKey) {
  throw new Error('Invalid api key')
}

const provider = new JsonRpcProvider(
  "https://bsc-dataseed1.binance.org",
  {
    chainId: 56,
    name: "bsc-mainnet",
  }
);

const baseURL = 'https://business-backend.app.purefi.io';
const clientPrivateKey = 'bcd14c07de84a22922297480caf7544ff87dbe6c53c2455ec0f3cff9bcce3378';

const data = {
  sender: "0xe821a0441c795c10d114d186b758fbf8495f259a",
  ruleId: "631050090",
  amount: "0x056bc75e2d63100000",
  receiver: "0x2c6900b24221de2b4a45c8c89482fff96ffb7e55",
  token: "0xe2a59d5e33c6540e18aaa46bf98917ac3158db0d",
  skipCheckSignature: false,
  chainId: 56
};

const signer = new Wallet(clientPrivateKey, provider);

const postRule = async () => {
  const message = JSON.stringify(data);
  const signature = await signer.signMessage(message);

  const instance = create({
    baseURL,
    headers: {
      'PUREFI-API-KEY': apiKey,
    }
  });

  try {
    const res = await instance.post('/v3/rule', {
      message,
      signature,
      signatureType: 'eddsa_jubjub',
    });

    return res.data;
  } catch(err) {
    console.log(err);
  }
};

const validSignature = async (message, signature) => {
  const eddsa = await buildEddsa();
  
  const pubKey = [
    new Uint8Array([
      251,  86, 208, 224, 165,  72, 217,
      166, 211, 141, 255, 229, 214, 147,
       19, 195, 226, 172, 215, 167, 100,
      123, 117,  51,  26, 234,  85, 111,
      119,  73, 246,  14
    ]),
    new Uint8Array([
      195, 246, 45, 214,  94, 231, 2, 197,
      106, 156, 8, 129,  15, 127,  74, 101,
       76, 124,  81,  33, 209, 104, 179,  42,
      239, 254, 155, 190,  50, 120, 106,  10
    ])
  ];

  const msg = new Uint8Array(message);
  const pSignature = new Uint8Array(signature);
  const uSignature = eddsa.unpackSignature(pSignature);

  
  const isValid = eddsa.verifyPoseidon(msg, uSignature, pubKey);

  return isValid;
} 


const run = async  () => {
  const res = await postRule();

  console.log('Result:', res);

  const isValid = await validSignature(res.message, res.signature);

  console.log('isValid:', isValid);
}

run();