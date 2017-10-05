pragma solidity ^0.4.13;

import './ProofToken.sol';

contract TokenFactoryInterface {

    function createCloneToken(
        address _parentToken,
        uint _snapshotBlock,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol,
        bool _transfersEnabled
      ) returns (ProofToken);
}