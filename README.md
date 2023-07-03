# Example for Panther Protocol

This is a bare-bones application example

The entire application is contained within the `index.js` file.

# Quick start

## Scrips

```bash
# install package
$ yarn
# run
$ yarn start <rule> <privateKey>
$ yarn start:type1 --privateKey=***
$ yarn start:type2 --privateKey=***
```

# REST API

The REST API to the example app is described below. To get PUREFI-API-KEY contact support

## Check rule

### The only supported rule is

`631040090`

```TEXT
Satisfy this rule an address either has to
have AML risk that does not exceed lower threshold or
have AML risk score between lower and upper thresholds and have bound KYC pass.
```

### Request type 2

`POST /v4/rule`

    curl -i -H 'Accept: application/json'
    https://stage.issuer.app.purefi.io/v4/rule
    {
      amount: string                // Amount is expected to be decimals in hex string format
      token: string                 // Token address
      ruleId: string                // '631050090'
      sender: string                // From address
      chainId: string               // 80001
      receiver: string              // To address
    }

### Request type 1

`POST /v4/rule`

    curl -i -H 'Accept: application/json'
    https://stage.issuer.app.purefi.io/v4/rule
    {
      ruleId: string                // "777"
      sender: string                // From address
      receiver: string              // To address
      chainId: string               // 80001
    }

### Response

    Status: 200 OK
    Content-Type: application/json
    {
      signature: number[],
      message: number[],
    }

    Status: 400 Bad Request
    Content-Type: application/json
    {
      message: 'Limit deposit customer',
      errorCode: 150,
      details: null
    }

    Status: 400 Bad Request
    Content-Type: application/json
    {
      message: 'AML risk score exceeds limit',
      errorCode: 140,
      details: null
    }

    Status: 400 Bad Request
    Content-Type: application/json
    {
    	message: 'AML risk score exceeds limit, but you are welcome to verify your identity and proceed once you've finished',
    	errorCode: 130,
    	details: null
    }

    Status: 400 Bad Request
    Content-Type: application/json
    {
    	message: 'The sender address is not equal to the signature address',
    	errorCode: 20,
    	details: {}
    }

    Status: 400 Bad Request
    Content-Type: application/json
    {
    	message: 'The sender address is not equal to the signature address',
    	errorCode: 20,
    	details: {}
    }

    Status: 400 Bad Request
    Content-Type: application/json
    {
    	"message": "Unsupported payload format provided",
    	"errorCode": 20,
    	"details": []
    }

### Test request data

#### Success

    {
    	sender: "0xe821a0441c795c10d114d186b758fbf8495f259a",
    	ruleId: "631050090",
    	amount: "0x056bc75e2d63100000",
    	receiver: "0x2c6900b24221de2b4a45c8c89482fff96ffb7e55",
    	token: "0xe3a59d5e33c6540e18aaa46bf98917ac3158db0d",
    	chainId: 80001
    }

    {
      sender: "0x1ccf9d9b43e0390718512103e3713602fa42fb53",
      ruleId: "777",
      chainId: "80001",
    }

#### Error required kyc

    {
    	sender: "0x44448c9bb6805d7c44602854c352f718de389c16",
    	ruleId: "631050090",
    	amount: "0x056bc75e2d63100000",
    	receiver: "0xad585afee404a055b41e0927d475a744da3ec791",
    	token: "0xe3a59d5e33c6540e18aaa46bf98917ac3158db0d",
    	chainId: 80001
    }

#### Error required kyc

    {
    	sender: "0x2c6900b24221de2b4a45c8c89482fff96ffb7e55",
    	ruleId: "631050090",
    	amount: "0x056bc75e2d63100000",
    	receiver: "0xad585afee404a055b41e0927d475a744da3ec791",
    	token: "0xe3a59d5e33c6540e18aaa46bf98917ac3158db0d",
    	chainId: 80001
    }
