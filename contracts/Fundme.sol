// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";

// This contract implements a decentralized crowdfunding platform where multiple memebers can submit, approve, and execute projects.
// The contract supports weighted voting based on contributions and allows for dynamic changes to the contract's parameters and members through proposals.

contract Fundme {
    // Events to log various actions within the contract
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitProject(
        address indexed member,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ApproveProject(address indexed member, uint256 indexed txIndex);
    event RevokeApproval(address indexed member, uint256 indexed txIndex);
    event ExecuteProject(address indexed member, uint256 indexed txIndex);
    event SubmitProposal(uint256 indexed proposalId, string proposalType);
    event ApproveProposal(address indexed member, uint256 indexed proposalId);
    event ExecuteProposal(uint256 indexed proposalId);

    // State variables
    address[] public members; // List of members
    mapping(address => bool) public isMember; // Mapping to check if an address is an member
    mapping(address => uint256) public contributionsOf; // Mapping to track contributions of each member
    uint256 public totalContributions; // Total contributions made by all members
    uint256 public percentageApprovalsRequired; // Percentage of approvals required for weighted voting
    uint256 public numApprovalsRequired; // Number of approvals required for non-weighted voting
    bool public votingByWeight; // Flag to determine if voting is by weight or count

    // Struct to represent a project
    struct Project {
        address to; // Address to which the project is paid
        uint256 value; // Value of the project
        bytes data; // Data payload of the project
        bool executed; // Flag to check if the project is executed
        uint256 numApprovals; // Number of approvals received
        uint256 weight; // Weight of the approvals received
    }

    // Struct to represent a proposal
    struct Proposal {
        string proposalType; // Type of proposal ("addMember", "removeMember", "changeParameter")
        address newMember; // New member address (if applicable)
        uint256 newPercentageApprovalsRequired; // New percentage of approvals required (if applicable)
        uint256 newNumApprovalsRequired; // New number of approvals required (if applicable)
        bool newVotingByWeight; // New voting by weight flag (if applicable)
        uint256 numApprovals; // Number of approvals received
        uint256 weight; // Weight of the approvals received
        bool executed; // Flag to check if the proposal is executed
    }

    // Mappings to track approvals of projects and proposals
    mapping(uint256 => mapping(address => bool)) public isApproveed;
    mapping(uint256 => mapping(address => bool)) public isProposalApproveed;

    // Arrays to store projects and proposals
    Project[] public projects;
    Proposal[] public proposals;

    // Modifiers to enforce various checks
    modifier onlyMember() {
        require(isMember[msg.sender], "not member");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < projects.length, "tx does not exist");
        _;
    }

    modifier proposalExists(uint256 _proposalId) {
        require(_proposalId < proposals.length, "proposal does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!projects[_txIndex].executed, "tx already executed");
        _;
    }

    modifier notApproveed(uint256 _txIndex) {
        require(!isApproveed[_txIndex][msg.sender], "tx already approved");
        _;
    }

    modifier notProposalExecuted(uint256 _proposalId) {
        require(!proposals[_proposalId].executed, "proposal already executed");
        _;
    }

    modifier notProposalApproveed(uint256 _proposalId) {
        require(!isProposalApproveed[_proposalId][msg.sender], "proposal already approved");
        _;
    }

    // Constructor to initialize the contract with initial members and parameters
    constructor(address[] memory _members, uint256 _numApprovalsRequired, uint256 _percentageApprovalsRequired, bool _votingByWeight) {
        require(_members.length > 0, "members required");
        require(
            _percentageApprovalsRequired >= 0 && _percentageApprovalsRequired <= 100,
            "invalid number of required percentage approvals"
        );
        require(
            _numApprovalsRequired >= 0 && _numApprovalsRequired <= _members.length,
            "invalid number of required approvals"
        );

        for (uint256 i = 0; i < _members.length; i++) {
            address member = _members[i];
            require(member != address(0), "invalid member");
            require(!isMember[member], "member not unique");

            isMember[member] = true;
            members.push(member);
        }

        numApprovalsRequired = _numApprovalsRequired;
        percentageApprovalsRequired = _percentageApprovalsRequired;
        votingByWeight = _votingByWeight;
    }

    // Fallback function to handle incoming ether
    receive() external payable {
        if (isMember[msg.sender]) {
            contributionsOf[msg.sender] += msg.value;
            totalContributions += msg.value;
        }
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }
    
    // Function to get the contract's balance
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Function to submit a new project
    function submitProject(address _to, uint256 _value, bytes memory _data) public onlyMember {
        uint256 txIndex = projects.length;
        projects.push(Project({to: _to, value: _value, data: _data, executed: false, numApprovals: 0, weight: 0}));
        emit SubmitProject(msg.sender, txIndex, _to, _value, _data);
    }

    // Function to approve a project
    function approveProject(uint256 _txIndex) public onlyMember txExists(_txIndex) notExecuted(_txIndex) notApproveed(_txIndex) {
        Project storage project = projects[_txIndex];
        project.numApprovals += 1;
        project.weight += contributionsOf[msg.sender];
        isApproveed[_txIndex][msg.sender] = true;
        emit ApproveProject(msg.sender, _txIndex);
    }

    // Function to execute a approved project
    function executeProject(uint256 _txIndex) public onlyMember txExists(_txIndex) notExecuted(_txIndex) {
        Project storage project = projects[_txIndex];
        if (votingByWeight) {
            require(project.weight > totalContributions * percentageApprovalsRequired / 100, "cannot execute tx - voting by weight");
            console.log("project.weight: %s", project.weight);
            console.log("totalContributions: %s", totalContributions);
            console.log("percentageApprovalsRequired: %s", percentageApprovalsRequired);

        } else {
            require(project.numApprovals >= numApprovalsRequired, "cannot execute tx - voting by count");
            console.log("project.numApprovals: %s", project.numApprovals);
            console.log("numApprovalsRequired: %s", numApprovalsRequired);

        }
        project.executed = true;
        (bool success, ) = project.to.call{value: project.value}(project.data);
        require(success, "tx failed");
        emit ExecuteProject(msg.sender, _txIndex);
    }

    // Function to revoke an approval for a project
    function revokeApproval(uint256 _txIndex) public onlyMember txExists(_txIndex) notExecuted(_txIndex) {
        Project storage project = projects[_txIndex];
        require(isApproveed[_txIndex][msg.sender], "tx not approved");
        project.numApprovals -= 1;
        project.weight -= contributionsOf[msg.sender];
        isApproveed[_txIndex][msg.sender] = false;
        emit RevokeApproval(msg.sender, _txIndex);
    }

    // Function to submit a new proposal
    function submitProposal(
        string memory proposalType,
        address _newMember,
        uint256 _newPercentageApprovalsRequired,
        uint256 _newNumApprovalsRequired,
        bool _newVotingByWeight
    ) public onlyMember {
        proposals.push(
            Proposal({
                proposalType: proposalType,
                newMember: _newMember,
                newPercentageApprovalsRequired: _newPercentageApprovalsRequired,
                newNumApprovalsRequired: _newNumApprovalsRequired,
                newVotingByWeight: _newVotingByWeight,
                numApprovals: 0,
                weight: 0,
                executed: false
            })
        );
        emit SubmitProposal(proposals.length - 1, proposalType);
    }

    // Function to approve a proposal
    function approveProposal(uint256 _proposalId) public onlyMember proposalExists(_proposalId) notProposalExecuted(_proposalId) notProposalApproveed(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        proposal.numApprovals += 1;
        proposal.weight += contributionsOf[msg.sender];
        isProposalApproveed[_proposalId][msg.sender] = true;
        emit ApproveProposal(msg.sender, _proposalId);
    }

    // Function to execute a approved proposal
    function executeProposal(uint256 _proposalId) public onlyMember proposalExists(_proposalId) notProposalExecuted(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];

        if (votingByWeight) {
            require(proposal.weight > totalContributions * percentageApprovalsRequired / 100, "cannot execute proposal - voting by weight");
        } else {
            require(proposal.numApprovals >= numApprovalsRequired, "cannot execute proposal - voting by count");
        }

        if (keccak256(bytes(proposal.proposalType)) == keccak256("addMember")) {
            require(!isMember[proposal.newMember], "member already exists");
            isMember[proposal.newMember] = true;
            members.push(proposal.newMember);
        } else if (keccak256(bytes(proposal.proposalType)) == keccak256("removeMember")) {
            require(isMember[proposal.newMember], "member does not exist");
            isMember[proposal.newMember] = false;
            // Remove the member from the members array
            for (uint256 i = 0; i < members.length; i++) {
                if (members[i] == proposal.newMember) {
                    members[i] = members[members.length - 1];
                    members.pop();
                    break;
                }
            }
        } else if (keccak256(bytes(proposal.proposalType)) == keccak256("changeParameter")) {
            percentageApprovalsRequired = proposal.newPercentageApprovalsRequired;
            numApprovalsRequired = proposal.newNumApprovalsRequired;
            votingByWeight = proposal.newVotingByWeight;
        }

        proposal.executed = true;
        emit ExecuteProposal(_proposalId);
    }

    // Function to get the list of members
    function getMembers() public view returns (address[] memory) {
        return members;
    }

    // Function to get the count of projects
    function getProjectCount() public view returns (uint256) {
        return projects.length;
    }

    // Function to get details of a specific project
    function getProject(uint256 _txIndex) public view returns (address to, uint256 value, bytes memory data, bool executed, uint256 numApprovals, uint256 weight) {
        Project storage project = projects[_txIndex];
        return (project.to, project.value, project.data, project.executed, project.numApprovals, project.weight);
    }

    // Function to get details of a specific proposal
    function getProposal(uint256 _proposalId) public view returns (string memory proposalType, address newMember, uint256 newPercentageApprovalsRequired, uint256 newNumApprovalsRequired, bool newVotingByWeight, uint256 numApprovals, uint256 weight, bool executed) {
        Proposal storage proposal = proposals[_proposalId];
        return (proposal.proposalType, proposal.newMember, proposal.newPercentageApprovalsRequired, proposal.newNumApprovalsRequired, proposal.newVotingByWeight, proposal.numApprovals, proposal.weight, proposal.executed);
    }

    // Function to get the count of proposals
    function getProposalCount() public view returns (uint256) {
        return proposals.length;
    }
}
