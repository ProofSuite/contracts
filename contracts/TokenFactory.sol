pragma solidity ^0.4.13;

import './ProofToken.sol';

contract TokenFactory {

    function createCloneToken(
        address _parentToken,
        uint _snapshotBlock,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol,
        bool _transfersEnabled
        ) returns (ProofToken)
    {
        ProofToken newToken = new ProofToken(
            this,
            _parentToken,
            _snapshotBlock,
            _tokenName,
            _decimalUnits,
            _tokenSymbol,
            _transfersEnabled
            );


        newToken.transferControl(msg.sender);
        return newToken;
    }
}