const { create } = require("axios");
const { Scalar } = require("ffjavascript");
const { buildEddsa } = require("circomlibjs");
const { Wallet, AbiCoder, JsonRpcProvider, solidityPacked, getBytes } = require("ethers");

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

const baseURL = 'http://localhost:5000';
const clientPrivateKey = '0c25287fba0ccfbdf242d749ee0709ceb185f17b6c9877b9bdd47cc7929cccb4';
const issuerPublicKey = [
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

const dataType2 = {
  sender: "0xe821a0441c795c10d114d186b758fbf8495f259a",
  ruleId: "631050090",
  amount: "0x056bc75e2d63100000",
  receiver: "0x2c6900b24221de2b4a45c8c89482fff96ffb7e55",
  token: "0xe2a59d5e33c6540e18aaa46bf98917ac3158db0d",
  skipCheckSignature: true,
  chainId: 56
};

const signer = new Wallet(clientPrivateKey, provider);

const postRule = async () => {
  const message = JSON.stringify(dataType2);
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

const validSignature = async (timestamp, signature, purefiPackage, issuerPublicKey) => {
  const eddsa = await buildEddsa();
  
  const messageData = solidityPacked(
    ["uint64", "bytes"],
    [timestamp, purefiPackage]
  );
  
  const message = getBytes(messageData);
  const msg = eddsa.babyJub.F.e(Scalar.fromRprLE(message, 0));
  const pSignature = getBytes(signature);

  const uSignature = eddsa.unpackSignature(pSignature);
  
  const isValid = eddsa.verifyPoseidon(msg, uSignature, issuerPublicKey);

  return isValid;
} 


const run = async  () => {
  const purefiData = await postRule();

  console.log('Result:', purefiData);

  const abiCoder = AbiCoder.defaultAbiCoder();
  const [timestamp, signature, purefiPackage] = abiCoder.decode(["uint64", "bytes", "bytes"], purefiData)
  
  const isValid = await validSignature(timestamp, signature, purefiPackage, issuerPublicKey);

  console.log('isValid:', isValid);
}

run();