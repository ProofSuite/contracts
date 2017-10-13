pragma solidity ^0.4.14;

import './ProofToken.sol';

contract TokenFactory {

    function createCloneToken(
        address _parentToken,
        uint _snapshotBlock,
        string _tokenName,
        string _tokenSymbol
        ) returns (ProofToken newToken)
    {
        newToken = new ProofToken(
            this,
            _parentToken,
            _snapshotBlock,
            _tokenName,
            _tokenSymbol
        );

        newToken.transferControl(msg.sender);
        return newToken;
    }
}