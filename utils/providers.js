const { JsonRpcProvider } = require("ethers");

const MUMBAI_PROVIDER = new JsonRpcProvider(
  'https://matic-mumbai.chainstacklabs.com',
  {
    chainId: 80001,
    name: 'polygon-mumbai',
  },
);

module.exports = {
  MUMBAI_PROVIDER
};