pragma solidity ^0.5.0;

import './Token.sol';
import './Ownable.sol';

contract TokenFactory {

    function createCloneToken(
        address _parentToken,
        uint _snapshotBlock,
        string memory _tokenName,
        string memory _tokenSymbol
        ) public returns (Token) {

        Token newToken = new Token(
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
