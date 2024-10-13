/**
 * Proposals Component
 * 
 * This component is responsible for displaying and managing proposals related to the administration of a crowdfunding contract.
 * It allows users to view active proposals, vote on them, and execute them if they have passed. Additionally, it provides 
 * functionality to submit new proposals for adding/removing members, changing voting methods, and modifying approval requirements.
 * 
 * Props:
 * - contract: The smart contract instance to interact with.
 * - showAlertMessage: Function to display alert messages.
 * - contractParameters: Additional parameters for the contract (not used in this code).
 * 
 * State:
 * - proposals: List of proposals fetched from the contract.
 * - activeTab: Currently active tab in the proposal submission form.
 * - newMember: Address of the new member to be added or removed.
 * - newNumApprovals: New number of approvals required for a proposal to pass.
 * - newWeightApprovals: New weight of approvals required for a proposal to pass.
 * - votingByWeight: Boolean indicating if voting is by weight or count.
 * - members: List of current members fetched from the contract.
 */

import React, { useState, useEffect } from "react";
import { Table, Button, Row, Col, Form, Tabs, Tab } from "react-bootstrap";
import { ethers } from "ethers";

const Proposals = ({ contract, showAlertMessage, contractParameters }) => {
  const [proposals, setProposals] = useState([]);
  const [activeTab, setActiveTab] = useState("addMember");
  const [newMember, setNewMember] = useState("");
  const [newNumApprovals, setNewNumApprovals] = useState("");
  const [newWeightApprovals, setNewWeightApprovals] = useState("");
  const [votingByWeight, setVotingByWeight] = useState(false);
  const [members, setMembers] = useState([]);  // To store the list of members

  // Load proposals and members when the contract is available
  useEffect(() => {
    if (contract) {
      loadProposals();
      loadMembers();  // Load members on component mount
    }
  }, [contract]);

  // Fetch proposals from the contract
  const loadProposals = async () => {
    const proposalCount = await contract.getProposalCount();
    const loadedProposals = [];

    for (let i = 0; i < proposalCount; i++) {
      const proposal = await contract.getProposal(i);
      // Map the proposal data
      const mappedProposal = {
        id: i,
        proposalType: proposal.proposalType || proposal[0],
        newMember: proposal.newMember || proposal[1],
        newPercentageApprovalsRequired: proposal.newPercentageApprovalsRequired || proposal[2],
        newNumApprovalsRequired: proposal.newNumApprovalsRequired || proposal[3],
        newVotingByWeight: proposal.newVotingByWeight || proposal[4],
        numApprovals: proposal.numApprovals || proposal[5],
        weight: proposal.weight || proposal[6],
        executed: proposal.executed || proposal[7],
      };

      loadedProposals.push(mappedProposal);
    }
    setProposals(loadedProposals);
  };

  // Fetch the list of members from the contract
  const loadMembers = async () => {
    try {
      const membersList = await contract.getMembers();
      setMembers(membersList);
    } catch (error) {
      showAlertMessage("Error loading members.");
    }
  };

  // Handle voting on a proposal
  const handleVoteProposal = async (proposalId) => {
    try {
      const tx = await contract.approveProposal(proposalId);
      await tx.wait();
      showAlertMessage("Vote on proposal successful!");
      loadProposals();
    } catch (error) {
      showAlertMessage("Error voting on proposal " + proposalId );
    }
  };

  // Handle executing a proposal
  const handleExecuteProposal = async (proposalId) => {
    try {
      const tx = await contract.executeProposal(proposalId);
      await tx.wait();
      showAlertMessage("Proposal executed successfully!");
      loadProposals();
    } catch (error) {
      showAlertMessage("Error executing proposal " + proposalId );
      console.log(error);
    }
  };

  // Handle submitting a new proposal
  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    try {
      let proposalNewMember = ethers.ZeroAddress;
      let proposalNewPercentage = 0;
      let proposalNewNumApprovals = 0;
      let proposalVotingByWeight = votingByWeight;

      // Determine the type of proposal and set the appropriate values
      if (activeTab === "addMember") {
        proposalNewMember = newMember;
      } else if (activeTab === "removeMember") {
        proposalNewMember = newMember;
      } else if (activeTab === "changeVotingMethod") {
        proposalVotingByWeight = votingByWeight;
      } else if (activeTab === "changePassingNumApprovals") {
        proposalNewNumApprovals = newNumApprovals;
      } else if (activeTab === "changePassingWeightApprovals") {
        proposalNewPercentage = newWeightApprovals;
      }

      // Submit the proposal to the contract
      const tx = await contract.submitProposal(
        activeTab,
        proposalNewMember,
        proposalNewPercentage,
        proposalNewNumApprovals,
        proposalVotingByWeight
      );
      
      await tx.wait();
      showAlertMessage("Proposal submitted successfully!");
      loadProposals();
    } catch (error) {
      console.error(error);
      showAlertMessage("Error submitting proposal " );
    }
  };

  return (
    <>
      <Row className="my-4">
        <Col>
          <h3>Active Admin Proposals</h3>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Proposal Type</th>
                <th>Details</th>
                <th>Approvals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <tr key={proposal.id} style={{ color: proposal.executed ? 'green' : 'black' }}>
                  <td>{proposal.proposalType}</td>
                  <td>
                    {proposal.proposalType === "addMember" &&
                      `Add Member: ${proposal.newMember}`}
                    {proposal.proposalType === "removeMember" &&
                      `Remove Member: ${proposal.newMember}`}
                    {proposal.proposalType === "changeVotingMethod" &&
                      `Voting Method: ${proposal.newVotingByWeight ? "Voting by Weight" : "Voting by Count"}`}
                    {proposal.proposalType === "changePassingNumApprovals" &&
                      `Required Approvals: ${proposal.newNumApprovalsRequired}`}
                    {proposal.proposalType === "changePassingWeightApprovals" &&
                      `Required Weight: ${proposal.newPercentageApprovalsRequired}`}
                  </td>
                  <td>{proposal.numApprovals.toString()}</td>
                  <td>
                    <Button
                      onClick={() => handleVoteProposal(proposal.id)}
                      variant="primary"
                      className="me-2"
                      disabled={proposal.executed}
                    >
                      Vote
                    </Button>
                    <Button
                      onClick={() => handleExecuteProposal(proposal.id)}
                      variant="success"
                      disabled={proposal.executed}
                    >
                      Execute
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      <Row className="my-4">
        <Col>
        <h3>Submit a New Admin Proposal</h3>
          <Tabs activeKey={activeTab} onSelect={(tab) => setActiveTab(tab)} className="mb-3">
            <Tab eventKey="addMember" title="Add a New Member">
              <Form onSubmit={handleSubmitProposal}>
                <Form.Group>
                  <Form.Label>New Committee Member Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    placeholder="Enter new committee member address"
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-3">
                  Submit Proposal
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="removeMember" title="Remove a Member">
              <Form onSubmit={handleSubmitProposal}>
                <Form.Group>
                  <Form.Label>Select Committee Member to Remove</Form.Label>
                  <Form.Control
                    as="select"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                  >
                    {members.map((member) => (
                      <option key={member} value={member}>
                        {member}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-3">
                  Submit Proposal
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="changeVotingMethod" title="Voting Scheme">
              <Form onSubmit={handleSubmitProposal}>
                <Form.Group>
                  <Form.Label>Select Voting Method</Form.Label>
                  <Form.Control
                    as="select"
                    value={votingByWeight ? "weight" : "count"}
                    onChange={(e) => {console.log(e.target.value); setVotingByWeight(e.target.value === "weight"); console.log(votingByWeight);}}
                  >
                    <option value="count">Voting by Count</option>
                    <option value="weight">Voting by Weight</option>
                  </Form.Control>
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-3">
                  Submit Proposal
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="changePassingNumApprovals" title="Voting Count Req.">
              <Form onSubmit={handleSubmitProposal}>
                <Form.Group>
                  <Form.Label>New minimum Count of Votes Required</Form.Label>
                  <Form.Control
                    type="text"
                    value={newNumApprovals}
                    onChange={(e) => setNewNumApprovals(e.target.value)}
                    placeholder="Enter number of votes"
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-3">
                  Submit Proposal
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="changePassingWeightApprovals" title="Voting Weight Req.">
              <Form onSubmit={handleSubmitProposal}>
                <Form.Group>
                  <Form.Label>New Minimum Weight of Votes Required</Form.Label>
                  <Form.Control
                    type="text"
                    value={newWeightApprovals}
                    onChange={(e) => setNewWeightApprovals(e.target.value)}
                    placeholder="Enter minimum weight required"
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-3">
                  Submit Proposal
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="changeAutoExecution" title="Execution Method">
              <Form onSubmit={handleSubmitProposal}>
                <Form.Group>
                  <Form.Label>Select Execution Method</Form.Label>
                  <Form.Control
                    as="select"
                    value={votingByWeight ? "auto" : "onRequest"}
                    onChange={(e) => {console.log(e.target.value); setVotingByWeight(e.target.value === "weight"); console.log(votingByWeight);}}
                  >
                    <option value="auto">Auto-execute on Passing Vote</option>
                    <option value="onRequest">Execute at Request Only</option>
                  </Form.Control>
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-3">
                  Submit Proposal
                </Button>
              </Form>
            </Tab>

            
          </Tabs>
        </Col>
      </Row>
    </>
  );
};

export default Proposals;
