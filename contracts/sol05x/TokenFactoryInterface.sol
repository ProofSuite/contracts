pragma solidity ^0.5.7;

import './ProofToken.sol';

contract TokenFactoryInterface {

    function createCloneToken (
        address _parentToken,
        uint _snapshotBlock,
        string memory _tokenName,
        string memory _tokenSymbol
      ) public returns (ProofToken newToken);
}
