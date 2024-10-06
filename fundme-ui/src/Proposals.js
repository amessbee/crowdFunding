import React, { useState, useEffect } from "react";
import { Table, Button, Row, Col, Form, Tabs, Tab } from "react-bootstrap";
import { ethers } from "ethers";

const Proposals = ({ contract, showAlertMessage, contractParameters }) => {
  const [proposals, setProposals] = useState([]);
  const [activeTab, setActiveTab] = useState("addOwner");
  const [newOwner, setNewOwner] = useState("");
  const [newNumConfirmations, setNewNumConfirmations] = useState("");
  const [newWeightConfirmations, setNewWeightConfirmations] = useState("");
  const [votingByWeight, setVotingByWeight] = useState(false);
  const [owners, setOwners] = useState([]);  // To store the list of owners

  useEffect(() => {
    if (contract) {
      loadProposals();
      loadOwners();  // Load owners on component mount
    }
  }, [contract]);

  const loadProposals = async () => {
    const proposalCount = await contract.getProposalCount();
    const loadedProposals = [];

    for (let i = 0; i < proposalCount; i++) {
      const proposal = await contract.getProposal(i);
      // Map the proposal data
      const mappedProposal = {
        id: i,
        proposalType: proposal.proposalType || proposal[0],
        newOwner: proposal.newOwner || proposal[1],
        newPercentageConfirmationsRequired: proposal.newPercentageConfirmationsRequired || proposal[2],
        newNumConfirmationsRequired: proposal.newNumConfirmationsRequired || proposal[3],
        newVotingByWeight: proposal.newVotingByWeight || proposal[4],
        numConfirmations: proposal.numConfirmations || proposal[5],
        weight: proposal.weight || proposal[6],
        executed: proposal.executed || proposal[7],
      };

      loadedProposals.push(mappedProposal);
    }
    setProposals(loadedProposals);
  };

  const loadOwners = async () => {
    try {
      const ownersList = await contract.getOwners();  // Fetch the list of owners from the contract
      setOwners(ownersList);  // Store owners in state
    } catch (error) {
      showAlertMessage("Error loading owners.");
    }
  };

  const handleVoteProposal = async (proposalId) => {
    try {
      const tx = await contract.confirmProposal(proposalId);
      await tx.wait();
      showAlertMessage("Vote on proposal successful!");
      loadProposals();
    } catch (error) {
      showAlertMessage("Error voting on proposal " + proposalId );
    }
  };

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

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    try {
      let proposalNewOwner = ethers.ZeroAddress;
      let proposalNewPercentage = 0;
      let proposalNewNumConfirmations = 0;
      let proposalVotingByWeight = votingByWeight;

      if (activeTab === "addOwner") {
        proposalNewOwner = newOwner;
      } else if (activeTab === "removeOwner") {
        proposalNewOwner = newOwner;
      } else if (activeTab === "changeVotingMethod") {
        proposalVotingByWeight = votingByWeight;
      } else if (activeTab === "changePassingNumConfirmations") {
        proposalNewNumConfirmations = newNumConfirmations;
      } else if (activeTab === "changePassingWeightConfirmations") {
        proposalNewPercentage = newWeightConfirmations;
      }

      const tx = await contract.submitProposal(
        activeTab,
        proposalNewOwner,
        proposalNewPercentage,
        proposalNewNumConfirmations,
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
                <th>Confirmations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <tr key={proposal.id} style={{ color: proposal.executed ? 'green' : 'black' }}>
                  <td>{proposal.proposalType}</td>
                  <td>
                    {proposal.proposalType === "addOwner" &&
                      `Add Member: ${proposal.newOwner}`}
                    {proposal.proposalType === "removeOwner" &&
                      `Remove Member: ${proposal.newOwner}`}
                    {proposal.proposalType === "changeVotingMethod" &&
                      `Voting Method: ${proposal.newVotingByWeight ? "Voting by Weight" : "Voting by Count"}`}
                    {proposal.proposalType === "changePassingNumConfirmations" &&
                      `Required Confirmations: ${proposal.newNumConfirmationsRequired}`}
                    {proposal.proposalType === "changePassingWeightConfirmations" &&
                      `Required Weight: ${proposal.newPercentageConfirmationsRequired}`}
                  </td>
                  <td>{proposal.numConfirmations.toString()}</td>
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
            <Tab eventKey="addOwner" title="Add a New Member">
              <Form onSubmit={handleSubmitProposal}>
                <Form.Group>
                  <Form.Label>New Committee Member Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="Enter new committee member address"
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-3">
                  Submit Proposal
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="removeOwner" title="Remove a Member">
              <Form onSubmit={handleSubmitProposal}>
                <Form.Group>
                  <Form.Label>Select Committee Member to Remove</Form.Label>
                  <Form.Control
                    as="select"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                  >
                    {owners.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
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

            <Tab eventKey="changePassingNumConfirmations" title="Voting Count Req.">
              <Form onSubmit={handleSubmitProposal}>
                <Form.Group>
                  <Form.Label>New minimum Count of Votes Required</Form.Label>
                  <Form.Control
                    type="text"
                    value={newNumConfirmations}
                    onChange={(e) => setNewNumConfirmations(e.target.value)}
                    placeholder="Enter number of votes"
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-3">
                  Submit Proposal
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="changePassingWeightConfirmations" title="Voting Weight Req.">
              <Form onSubmit={handleSubmitProposal}>
                <Form.Group>
                  <Form.Label>New Minimum Weight of Votes Required</Form.Label>
                  <Form.Control
                    type="text"
                    value={newWeightConfirmations}
                    onChange={(e) => setNewWeightConfirmations(e.target.value)}
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
