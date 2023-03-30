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