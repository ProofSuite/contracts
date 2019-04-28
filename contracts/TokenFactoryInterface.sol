pragma solidity ^0.5.0;

import './Token.sol';

contract TokenFactoryInterface {

    function createCloneToken (
        address _parentToken,
        uint _snapshotBlock,
        string memory _tokenName,
        string memory _tokenSymbol
      ) public returns (Token newToken);
}
