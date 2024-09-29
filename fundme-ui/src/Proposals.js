import React, { useState, useEffect } from "react";
import { Table, Button, Row, Col, Form } from "react-bootstrap";
import { ethers } from "ethers";

const Proposals = ({ contract, showAlertMessage, contractParameters }) => {
  const [proposals, setProposals] = useState([]);
  const [proposalType, setProposalType] = useState("changeParameter");
  const [newOwner, setNewOwner] = useState("");
  const [selectedParameter, setSelectedParameter] = useState("newPercentageConfirmationsRequired");
  const [newParameterValue, setNewParameterValue] = useState("");
  const [votingByWeight, setVotingByWeight] = useState(false);  // Will be handled by dropdown
  const [currentParameterValue, setCurrentParameterValue] = useState("");
  const [owners, setOwners] = useState([]);  // To store the list of owners

  useEffect(() => {
    if (contract) {
      loadProposals();
      loadOwners();  // Load owners on component mount
    }
  }, [contract]);

  useEffect(() => {
    if (contractParameters && selectedParameter) {
      setCurrentParameterValue(contractParameters[selectedParameter]);
    }
  }, [selectedParameter, contractParameters]);

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
        newParameterValue: proposal.newParameterValue || proposal[2],
        votingByWeight: proposal.votingByWeight || proposal[3],
        numConfirmations: proposal.numConfirmations || proposal[4],
        executed: proposal.executed || proposal[5],
      };

      loadedProposals.push(mappedProposal);
    }
    setProposals(loadedProposals);
  };

  const loadOwners = async () => {
    try {
      const ownersList = await contract.owners();  // Fetch the list of owners from the contract
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
      showAlertMessage("Error voting on proposal.");
    }
  };

  const handleExecuteProposal = async (proposalId) => {
    try {
      const tx = await contract.executeProposal(proposalId);
      await tx.wait();
      showAlertMessage("Proposal executed successfully!");
      loadProposals();
    } catch (error) {
      showAlertMessage("Error executing proposal.");
    }
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    try {
      // Prepare parameters based on proposal type
      let proposalNewOwner = ethers.ZeroAddress; // Default empty address for Ethers v6
      let proposalNewPercentage = 0;  // Default to 0 for other proposal types
      let proposalNewNumConfirmations = 0;  // Default to 0 for other proposal types
      let proposalVotingByWeight = votingByWeight;  // Dropdown value for voting method

      if (proposalType === "addOwner" || proposalType === "removeOwner") {
        proposalNewOwner = newOwner;
      } else if (proposalType === "changeParameter") {
        proposalNewPercentage = newParameterValue;  // Input for percentage confirmations
        proposalNewNumConfirmations = newParameterValue;  // Input for number of confirmations
      }

      // Call contract function
      const tx = await contract.submitProposal(
        proposalType,
        proposalNewOwner,
        proposalNewPercentage,
        proposalNewNumConfirmations,
        proposalVotingByWeight
      );
      
      await tx.wait();
      showAlertMessage("Proposal submitted successfully!");
      loadProposals();  // Reload proposals after successful submission
    } catch (error) {
      console.error(error);
      showAlertMessage("Error submitting proposal.");
    }
  };

  return (
    <>
      <Row className="my-4">
        <Col>
          <h3>Active Proposals</h3>
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
                <tr key={proposal.id}>
                  <td>{proposal.proposalType}</td>
                  <td>
                    {proposal.proposalType === "addOwner" &&
                      `Add Owner: ${proposal.newOwner}`}
                    {proposal.proposalType === "removeOwner" &&
                      `Remove Owner: ${proposal.newOwner}`}
                    {proposal.proposalType === "changeParameter" &&
                      `Parameter: ${selectedParameter}, New Value: ${proposal.newParameterValue}, Voting Method: ${proposal.votingByWeight ? "Voting by Weight" : "Voting by Count"}`}
                  </td>
                  <td>{proposal.numConfirmations.toString()}</td>
                  <td>
                    <Button
                      onClick={() => handleVoteProposal(proposal.id)}
                      variant="primary"
                      className="me-2"
                    >
                      Vote
                    </Button>
                    <Button
                      onClick={() => handleExecuteProposal(proposal.id)}
                      variant="success"
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
          <h3>Submit a New Proposal</h3>
          <Form onSubmit={handleSubmitProposal}>
            <Form.Group>
              <Form.Label>Proposal Type</Form.Label>
              <Form.Control
                as="select"
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
              >
                <option value="changeParameter">Change Parameter</option>
                <option value="addOwner">Add Owner</option>
                <option value="removeOwner">Remove Owner</option>
              </Form.Control>
            </Form.Group>

            {proposalType === "changeParameter" && (
              <>
                <Form.Group>
                  <Form.Label>Choose Parameter to Change</Form.Label>
                  <Form.Control
                    as="select"
                    value={selectedParameter}
                    onChange={(e) => setSelectedParameter(e.target.value)}
                  >
                    <option value="newPercentageConfirmationsRequired">
                      Percentage Confirmations Required
                    </option>
                    <option value="newNumConfirmationsRequired">
                      Num Confirmations Required
                    </option>
                    <option value="votingMethod">Voting Method</option>  {/* New option added */}
                  </Form.Control>
                </Form.Group>

                <Form.Group>
                  <Form.Label>Current Value: {currentParameterValue}</Form.Label>
                </Form.Group>

                {/* Only show new value input if not changing the voting method */}
                {selectedParameter !== "votingMethod" && (
                  <Form.Group>
                    <Form.Label>New Value</Form.Label>
                    <Form.Control
                      type="text"
                      value={newParameterValue}
                      onChange={(e) => setNewParameterValue(e.target.value)}
                      placeholder="Enter new value"
                    />
                  </Form.Group>
                )}

                {/* Voting method dropdown */}
                {selectedParameter === "votingMethod" && (
                  <Form.Group>
                    <Form.Label>Select Voting Method</Form.Label>
                    <Form.Control
                      as="select"
                      value={votingByWeight ? "weight" : "count"}
                      onChange={(e) => setVotingByWeight(e.target.value === "weight")}
                    >
                      <option value="count">Voting by Count</option>
                      <option value="weight">Voting by Weight</option>
                    </Form.Control>
                  </Form.Group>
                )}
              </>
            )}

            {proposalType === "addOwner" && (
              <Form.Group>
                <Form.Label>New Owner Address</Form.Label>
                <Form.Control
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="Enter new owner address"
                />
              </Form.Group>
            )}

            {proposalType === "removeOwner" && (
              <Form.Group>
                <Form.Label>Select Owner to Remove</Form.Label>
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
            )}

            <Button variant="primary" type="submit">
              Submit Proposal
            </Button>
          </Form>
        </Col>
      </Row>
    </>
  );
};

export default Proposals;
