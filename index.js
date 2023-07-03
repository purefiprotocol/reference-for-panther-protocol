const {
  Wallet,
  AbiCoder,
  solidityPacked,
} = require("ethers");
const { create } = require("axios");
const { Scalar } = require("ffjavascript");

const { MUMBAI_PROVIDER } = require('./utils/providers');
const { extractBigInt, validSignature } = require('./utils/helpers');
const { SENDER, BASE_URL, RECEIVER, ISSUER_PUBLIC_KEY } = require('./utils/variables');

const rule = process.argv[2];
const privateKey = process.argv[3];

const validRule = !['91', '92', '777'].includes(rule);
const validPrivateKey = privateKey?.length !== 64;

if(validRule) {
  throw new Error('Invalid rule. Rule should be equal to: 91 or 92');
}

if(validPrivateKey) {
  throw new Error('Invalid private key');
}

const signer = new Wallet(privateKey, MUMBAI_PROVIDER);

const data = {
  ruleId: rule,
  sender: SENDER,
  chainId: "80001",
  receiver: RECEIVER,
};

const postRule = async () => {
  const message = JSON.stringify(data);
  const signature = await signer.signMessage(message);

  const instance = create({ baseURL: BASE_URL });

  try {
    const res = await instance.post('/v4/rule', {
      message,
      signature,
      signType: 'babyJubJub',
    });

    return res.data;
  } catch(err) {
    const errMsg = JSON.stringify(err.response.data);
    throw new Error(errMsg);
  }
};

const run = async () => {
  const purefiData = await postRule();
  const abiCoder = AbiCoder.defaultAbiCoder();

  console.log('Result:', purefiData);

  const [timestamp, signature, purefiPackage] =
    abiCoder.decode(["uint64", "bytes", "bytes"], purefiData);
  const [packageType, ruleId, sessionIdHex, sender] =
    abiCoder.decode(["uint8", "uint256", "uint256", "address"], purefiPackage);

  console.log('purefiPackage:', {
    sender,
    ruleId: Number(ruleId),
    packageType: Number(packageType),
    sessionIdHex: Number(sessionIdHex),
  })

  const isValid = await validSignature(timestamp, signature, purefiPackage, ISSUER_PUBLIC_KEY);

  console.log('isValid:', isValid);
}

run();