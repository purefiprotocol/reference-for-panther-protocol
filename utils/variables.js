const BASE_URL = 'https://stage.issuer.app.purefi.io';

const SENDER = '0x592157ab4c6fadc849fa23dfb5e2615459d1e4e5';
const RECEIVER = '0x0000000000000000000000000000000000000000';

const ISSUER_PUBLIC_KEY = [
  new Uint8Array([
    249, 243, 115, 223, 54, 127, 193,
    99, 194, 199, 141, 87, 250, 138,
    219, 226, 40, 110, 139, 211, 223,
    109, 75, 209, 53, 246, 120, 255,
    217, 129, 180, 41
  ]),
  new Uint8Array([
    88, 142, 94, 222, 156, 192, 121, 80,
    108, 249, 218, 225, 179, 24, 66, 148,
    188, 177, 180, 29, 184, 132, 216, 90,
    38, 204, 46, 184, 53, 251, 88, 14
  ])
];

module.exports = {
  SENDER,
  RECEIVER,
  BASE_URL,
  ISSUER_PUBLIC_KEY
};