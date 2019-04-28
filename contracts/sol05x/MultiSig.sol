pragma solidity ^0.5.7;


contract MultiSigWallet {

    event Confirmation(address sender, bytes32 transactionHash);
    event Revocation(address sender, bytes32 transactionHash);
    event Submission(bytes32 transactionHash);
    event Execution(bytes32 transactionHash);
    event Deposit(address sender, uint value);
    event OwnerAddition(address owner);
    event OwnerRemoval(address owner);
    event RequiredUpdate(uint required);

    mapping (bytes32 => Transaction) public transactions;
    mapping (bytes32 => mapping (address => bool)) public confirmations;
    mapping (address => bool) public isOwner;
    address[] owners;
    bytes32[] transactionList;
    uint public required;

    struct Transaction {
        address destination;
        uint value;
        bytes data;
        uint nonce;
        bool executed;
    }

    modifier onlyWallet() {
        require(msg.sender == address(this));
        _;
    }

    modifier signaturesFromOwners(bytes32 transactionHash, uint8[] memory v, bytes32[] memory rs) {
        for (uint i=0; i<v.length; i++) {
            require(isOwner[ecrecover(transactionHash, v[i], rs[i], rs[v.length + i])]);
        }
        _;
    }

    modifier ownerDoesNotExist(address owner) {
        require(!isOwner[owner]);

        _;
    }

    modifier ownerExists(address owner) {
        require(isOwner[owner]);
        _;
    }

    modifier confirmed(bytes32 transactionHash, address owner) {
        require(confirmations[transactionHash][owner]);
        _;
    }

    modifier notConfirmed(bytes32 transactionHash, address owner) {
        require(!confirmations[transactionHash][owner]);
        _;
    }

    modifier notExecuted(bytes32 transactionHash) {
        require(!transactions[transactionHash].executed);
        _;
    }

    modifier notNull(address destination) {
        require(destination != address(0));
        _;
    }

    modifier validRequired(uint _ownerCount, uint _required) {
        require(   _required < _ownerCount || _required != 0 || _ownerCount != 0);
        _;
    }

    function addOwner(address owner)
        external
        onlyWallet
        ownerDoesNotExist(owner)
    {
        isOwner[owner] = true;
        owners.push(owner);
        emit OwnerAddition(owner);
    }

    function removeOwner(address owner)
        external
        onlyWallet
        ownerExists(owner)
    {
        isOwner[owner] = false;
        for (uint i=0; i<owners.length - 1; i++)
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                break;
            }
        owners.length -= 1;
        if (required > owners.length)
            updateRequired(owners.length);
        emit OwnerRemoval(owner);
    }

    function updateRequired(uint _required)
        public
        onlyWallet
        validRequired(owners.length, _required)
    {
        required = _required;
        emit RequiredUpdate(_required);
    }

    function addTransaction(address destination, uint value, bytes memory data, uint nonce)
        private
        notNull(destination)
        returns (bytes32 transactionHash)
    {
        transactionHash = keccak256(abi.encode(destination, value, data, nonce));
        if (transactions[transactionHash].destination == address(0)) {
            transactions[transactionHash] = Transaction({
                destination: destination,
                value: value,
                data: data,
                nonce: nonce,
                executed: false
            });
            transactionList.push(transactionHash);
            emit Submission(transactionHash);
        }
    }

    function submitTransaction(address destination, uint value, bytes calldata data, uint nonce)
        external
        returns (bytes32 transactionHash)
    {
        transactionHash = addTransaction(destination, value, data, nonce);
        confirmTransaction(transactionHash);
    }

    function submitTransactionWithSignatures(address destination, uint value, bytes calldata data, uint nonce, uint8[] calldata v, bytes32[] calldata rs)
        external
        returns (bytes32 transactionHash)
    {
        transactionHash = addTransaction(destination, value, data, nonce);
        confirmTransactionWithSignatures(transactionHash, v, rs);
    }

    function addConfirmation(bytes32 transactionHash, address owner)
        private
        notConfirmed(transactionHash, owner)
    {
        confirmations[transactionHash][owner] = true;
        emit Confirmation(owner, transactionHash);
    }

    function confirmTransaction(bytes32 transactionHash)
        public
        ownerExists(msg.sender)
    {
        addConfirmation(transactionHash, msg.sender);
        executeTransaction(transactionHash);
    }

    function confirmTransactionWithSignatures(bytes32 transactionHash, uint8[] memory v, bytes32[] memory rs)
        public
        signaturesFromOwners(transactionHash, v, rs)
    {
        for (uint i=0; i<v.length; i++)
            addConfirmation(transactionHash, ecrecover(transactionHash, v[i], rs[i], rs[i + v.length]));
        executeTransaction(transactionHash);
    }

    function executeTransaction(bytes32 transactionHash)
        public
        notExecuted(transactionHash)
    {
        if (isConfirmed(transactionHash)) {
            Transaction memory _tx = transactions[transactionHash];
            _tx.executed = true;
            if (_tx.destination.call.value(_tx.value)(_tx.data) != 0)
                revert();
           emit Execution(transactionHash);
        }
    }

    function revokeConfirmation(bytes32 transactionHash)
        external
        ownerExists(msg.sender)
        confirmed(transactionHash, msg.sender)
        notExecuted(transactionHash)
    {
        confirmations[transactionHash][msg.sender] = false;
        Revocation(msg.sender, transactionHash);
    }

    constructor(address[] memory _owners, uint _required)
        validRequired(_owners.length, _required)
        public
    {
        for (uint i=0; i<_owners.length; i++)
            isOwner[_owners[i]] = true;
        owners = _owners;
        required = _required;
    }

    function()
        external
        payable
    {
        if (msg.value > 0)
            Deposit(msg.sender, msg.value);
    }

    function isConfirmed(bytes32 transactionHash)
        public
        view
        returns (bool)
    {
        uint count = 0;
        for (uint i=0; i<owners.length; i++)
            if (confirmations[transactionHash][owners[i]])
                count += 1;
            if (count == required)
                return true;
    }

    function confirmationCount(bytes32 transactionHash)
        external
        view
        returns (uint count)
    {
        for (uint i=0; i<owners.length; i++)
            if (confirmations[transactionHash][owners[i]])
                count += 1;
    }

    function filterTransactions(bool isPending)
        private
        returns (bytes32[] memory _transactionList)
    {
        bytes32[] memory _transactionListTemp = new bytes32[](transactionList.length);
        uint count = 0;
        for (uint i=0; i<transactionList.length; i++)
            if (   isPending && !transactions[transactionList[i]].executed
                || !isPending && transactions[transactionList[i]].executed)
            {
                _transactionListTemp[count] = transactionList[i];
                count += 1;
            }
        _transactionList = new bytes32[](count);
        for (uint i=0; i<count; i++)
            if (_transactionListTemp[i] > 0)
                _transactionList[i] = _transactionListTemp[i];
    }

    function getPendingTransactions()
        external
        view
        returns (bytes32[] memory _transactionList)
    {
        return filterTransactions(true);
    }

    function getExecutedTransactions()
        external
        view
        returns (bytes32[] memory _transactionList)
    {
        return filterTransactions(false);
    }
}
