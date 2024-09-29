// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Fundme {
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event SubmitProposal(uint256 indexed proposalId, string proposalType);
    event ConfirmProposal(address indexed owner, uint256 indexed proposalId);
    event ExecuteProposal(uint256 indexed proposalId);

    address[] public owners;
    mapping(address => bool) public isOwner;
    mapping(address => uint256) public contributionsOf;
    uint256 public totalContributions;
    uint256 public percentageConfirmationsRequired;
    uint256 public numConfirmationsRequired;
    bool public votingByWeight;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
        uint256 weight;
    }

    struct Proposal {
        string proposalType; // "addOwner", "removeOwner", "changeParameter"
        address newOwner; // If adding/removing an owner
        uint256 newPercentageConfirmationsRequired;
        uint256 newNumConfirmationsRequired;
        bool newVotingByWeight;
        uint256 numConfirmations;
        uint256 weight;
        bool executed;
    }

    // mapping from tx index => owner => bool
    mapping(uint256 => mapping(address => bool)) public isConfirmed;
    mapping(uint256 => mapping(address => bool)) public isProposalConfirmed;

    Transaction[] public transactions;
    Proposal[] public proposals;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }

    modifier proposalExists(uint256 _proposalId) {
        require(_proposalId < proposals.length, "proposal does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "tx already confirmed");
        _;
    }

    modifier notProposalExecuted(uint256 _proposalId) {
        require(!proposals[_proposalId].executed, "proposal already executed");
        _;
    }

    modifier notProposalConfirmed(uint256 _proposalId) {
        require(!isProposalConfirmed[_proposalId][msg.sender], "proposal already confirmed");
        _;
    }

    constructor(address[] memory _owners, uint256 _numConfirmationsRequired, uint256 _percentageConfirmationsRequired, bool _votingByWeight) {
        require(_owners.length > 0, "owners required");
        require(
            _percentageConfirmationsRequired > 0 && _percentageConfirmationsRequired <= 100,
            "invalid number of required percentage confirmations"
        );
        require(
            _numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length,
            "invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
        percentageConfirmationsRequired = _percentageConfirmationsRequired;
        votingByWeight = _votingByWeight;
    }

    receive() external payable {
        if (isOwner[msg.sender]) {
            contributionsOf[msg.sender] += msg.value;
            totalContributions += msg.value;
        }
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }
    
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function submitTransaction(address _to, uint256 _value, bytes memory _data) public onlyOwner {
        uint256 txIndex = transactions.length;
        transactions.push(Transaction({to: _to, value: _value, data: _data, executed: false, numConfirmations: 0, weight: 0}));
        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    function confirmTransaction(uint256 _txIndex) public onlyOwner txExists(_txIndex) notExecuted(_txIndex) notConfirmed(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        transaction.weight += contributionsOf[msg.sender];
        isConfirmed[_txIndex][msg.sender] = true;
        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint256 _txIndex) public onlyOwner txExists(_txIndex) notExecuted(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];
        if (votingByWeight) {
            require(transaction.weight > totalContributions * percentageConfirmationsRequired / 100, "cannot execute tx");
        } else {
            require(transaction.numConfirmations >= numConfirmationsRequired, "cannot execute tx");
        }
        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "tx failed");
        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function revokeConfirmation(uint256 _txIndex) public onlyOwner txExists(_txIndex) notExecuted(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];
        require(isConfirmed[_txIndex][msg.sender], "tx not confirmed");
        transaction.numConfirmations -= 1;
        transaction.weight -= contributionsOf[msg.sender];
        isConfirmed[_txIndex][msg.sender] = false;
        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    // New functionality: Propose to change parameters or owners
    function submitProposal(
        string memory proposalType,
        address _newOwner,
        uint256 _newPercentageConfirmationsRequired,
        uint256 _newNumConfirmationsRequired,
        bool _newVotingByWeight
    ) public onlyOwner {
        proposals.push(
            Proposal({
                proposalType: proposalType,
                newOwner: _newOwner,
                newPercentageConfirmationsRequired: _newPercentageConfirmationsRequired,
                newNumConfirmationsRequired: _newNumConfirmationsRequired,
                newVotingByWeight: _newVotingByWeight,
                numConfirmations: 0,
                weight: 0,
                executed: false
            })
        );
        emit SubmitProposal(proposals.length - 1, proposalType);
    }

    function confirmProposal(uint256 _proposalId) public onlyOwner proposalExists(_proposalId) notProposalExecuted(_proposalId) notProposalConfirmed(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        proposal.numConfirmations += 1;
        proposal.weight += contributionsOf[msg.sender];
        isProposalConfirmed[_proposalId][msg.sender] = true;
        emit ConfirmProposal(msg.sender, _proposalId);
    }

    function executeProposal(uint256 _proposalId) public onlyOwner proposalExists(_proposalId) notProposalExecuted(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];

        if (votingByWeight) {
            require(proposal.weight > totalContributions * percentageConfirmationsRequired / 100, "cannot execute proposal");
        } else {
            require(proposal.numConfirmations >= numConfirmationsRequired, "cannot execute proposal");
        }

        if (keccak256(bytes(proposal.proposalType)) == keccak256("addOwner")) {
            require(!isOwner[proposal.newOwner], "owner already exists");
            isOwner[proposal.newOwner] = true;
            owners.push(proposal.newOwner);
        } else if (keccak256(bytes(proposal.proposalType)) == keccak256("removeOwner")) {
            require(isOwner[proposal.newOwner], "owner does not exist");
            isOwner[proposal.newOwner] = false;
            // Remove the owner from the owners array
            for (uint256 i = 0; i < owners.length; i++) {
                if (owners[i] == proposal.newOwner) {
                    owners[i] = owners[owners.length - 1];
                    owners.pop();
                    break;
                }
            }
        } else if (keccak256(bytes(proposal.proposalType)) == keccak256("changeParameter")) {
            percentageConfirmationsRequired = proposal.newPercentageConfirmationsRequired;
            numConfirmationsRequired = proposal.newNumConfirmationsRequired;
            votingByWeight = proposal.newVotingByWeight;
        }

        proposal.executed = true;
        emit ExecuteProposal(_proposalId);
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 _txIndex) public view returns (address to, uint256 value, bytes memory data, bool executed, uint256 numConfirmations, uint256 weight) {
        Transaction storage transaction = transactions[_txIndex];
        return (transaction.to, transaction.value, transaction.data, transaction.executed, transaction.numConfirmations, transaction.weight);
    }

    function getProposal(uint256 _proposalId) public view returns (string memory proposalType, address newOwner, uint256 newPercentageConfirmationsRequired, uint256 newNumConfirmationsRequired, uint256 numConfirmations, bool newVotingByWeight, bool executed) {
        Proposal storage proposal = proposals[_proposalId];
        return (proposal.proposalType, proposal.newOwner, proposal.newPercentageConfirmationsRequired, proposal.newNumConfirmationsRequired, proposal.numConfirmations, proposal.newVotingByWeight, proposal.executed);
    }

    function getProposalCount() public view returns (uint256) {
        return proposals.length;
    }
}
