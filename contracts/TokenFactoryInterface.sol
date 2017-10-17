pragma solidity ^0.4.15;

import './ProofToken.sol';

contract TokenFactoryInterface {

    function createCloneToken(
        address _parentToken,
        uint _snapshotBlock,
        string _tokenName,
        string _tokenSymbol
      ) returns (ProofToken newToken);
}