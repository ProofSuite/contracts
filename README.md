# Proof Token Sale Smart Contracts
Public Repository for the proof token sale smart contracts



### Contracts
The ProofToken and TokenSale contracts are inspired by open-zeppelin standard and audited contracts.

The Proof Tokens are based on the `StandardToken` and `MintableToken` ERC20 contracts. Additional functionality is heavily inspired by the `MinimeToken` (https://github.com/Giveth/minime/blob/master/contracts/MiniMeToken.sol)

The TokenSale contract is inspired by the open-zeppelin `Crowdsale` contract with additional functionality mixed in.


### Presale and Initial Token Allocations
295,297 tokens have already been issued during the presale. These tokens will be imported before the first presale

### Development and Testing Environment Setup

#### Requirements :
- OSX or Linux (Windows setup is likely possible but not covered in this guide)
- Node (version 8.5.0 required for the testing environment)
- testrpc / geth 


#### Testing Environment Setup : 

- Clone the repository and install dependencies

``` 
git clone https://github.com/ProofSuite/ProofPresaleContract.git
cd ProofPresaleContract
npm install
```

- Install the latest version of truffle
```
npm install -g truffle
```

- Compile contracts
```
truffle compile
```

- Initialize testrpc (or geth)

```
testrpc
```

- Migrate contracts to chosen network

```
truffle migrate --network development
```

- Make sure you are using the latest version of node

``` 
nvm install 8.5.0
nvm use 8.5.0
```


- Fill in `truffle.js` and `deploy_contracts.js` with appropriate wallet addresses. Unlock the corresponding accounts.

- Verify all tests are passing

```
truffle test
```

- You can interact with the contracts via the console

```
truffle console
```



