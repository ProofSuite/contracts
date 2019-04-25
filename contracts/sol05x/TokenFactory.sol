pragma solidity ^0.5.7;

import './ProofToken.sol';
import './Ownable.sol';

contract TokenFactory {

    function createCloneToken(
        address _parentToken,
        uint _snapshotBlock,
        string memory _tokenName,
        string memory _tokenSymbol
        ) public returns (ProofToken) {

        ProofToken newToken = new ProofToken(
            address(this),
            _parentToken,
            _snapshotBlock,
            _tokenName,
            _tokenSymbol
        );

        newToken.transferControl(msg.sender);
        return newToken;
    }
}
