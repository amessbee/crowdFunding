import React, { useState, useEffect } from "react";
import { ethers } from "ethers";    
import { Container, Row, Col, Button, Form, Table, Alert } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import { contractAddress, contractABI } from './contractABI';

const { providers } = ethers;


const App = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const [proposalType, setProposalType] = useState("changeParameter");
  const [newOwner, setNewOwner] = useState("");
  const [newPercentage, setNewPercentage] = useState(0);
  const [newNumConfirmations, setNewNumConfirmations] = useState(0);
  const [votingByWeight, setVotingByWeight] = useState(false);

  useEffect(() => {
    const loadProvider = async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      setProvider(provider);
      const signer = await provider.getSigner();
      setSigner(signer);
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      setContract(contract);
      loadProposals(contract);
      loadTransactions(contract);
    };
    loadProvider();
  }, []);

  const loadProposals = async (contract) => {
    const proposalCount = await contract.getProposalCount();
    const loadedProposals = [];
    for (let i = 0; i < proposalCount; i++) {
      const proposal = await contract.getProposal(i);
      loadedProposals.push({ ...proposal, id: i });
    }
    setProposals(loadedProposals);
  };

  const loadTransactions = async (contract) => {
    const transactionCount = await contract.getTransactionCount();
    const loadedTransactions = [];
    for (let i = 0; i < transactionCount; i++) {
      const transaction = await contract.getTransaction(i);
      loadedTransactions.push({ ...transaction, id: i });
    }
    setTransactions(loadedTransactions);
  };

  const handleVoteProposal = async (proposalId) => {
    try {
      const tx = await contract.confirmProposal(proposalId);
      await tx.wait();
      setAlertMessage("Vote on proposal successful!");
      loadProposals(contract);
    } catch (error) {
      setAlertMessage("Error voting on proposal.");
    }
  };

  const handleExecuteProposal = async (proposalId) => {
    try {
      const tx = await contract.executeProposal(proposalId);
      await tx.wait();
      setAlertMessage("Proposal executed successfully!");
      loadProposals(contract);
    } catch (error) {
      setAlertMessage("Error executing proposal.");
    }
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    try {
      const tx = await contract.submitProposal(
        proposalType,
        newOwner || ethers.ZeroAddress,
        newPercentage,
        newNumConfirmations,
        votingByWeight
      );
      await tx.wait();
      setAlertMessage("Proposal submitted successfully!");
      loadProposals(contract);
    } catch (error) {
      setAlertMessage("Error submitting proposal.");
    }
  };

  const handleVoteTransaction = async (txId) => {
    try {
      const tx = await contract.confirmTransaction(txId);
      await tx.wait();
      setAlertMessage("Transaction vote successful!");
      loadTransactions(contract);
    } catch (error) {
      setAlertMessage("Error voting on transaction.");
    }
  };

  const handleExecuteTransaction = async (txId) => {
    try {
      const tx = await contract.executeTransaction(txId);
      await tx.wait();
      setAlertMessage("Transaction executed successfully!");
      loadTransactions(contract);
    } catch (error) {
      setAlertMessage("Error executing transaction.");
    }
  };

  return (
    <Container>
      <h1 className="mt-4">FundMe Dashboard</h1>
      {alertMessage && <Alert variant="info">{alertMessage}</Alert>}

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
                    {proposal.proposalType === "addOwner" ? `Add Owner: ${proposal.newOwner}` : ""}
                    {proposal.proposalType === "removeOwner" ? `Remove Owner: ${proposal.newOwner}` : ""}
                    {proposal.proposalType === "changeParameter"
                      ? `New Percentage: ${proposal.newPercentageConfirmationsRequired}, New Num Confirmations: ${proposal.newNumConfirmationsRequired}`
                      : ""}
                  </td>
                  <td>{proposal.numConfirmations}</td>
                  <td>
                    <Button onClick={() => handleVoteProposal(proposal.id)} variant="primary" className="mr-2">
                      Vote
                    </Button>
                    <Button onClick={() => handleExecuteProposal(proposal.id)} variant="success">
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
              <Form.Control as="select" value={proposalType} onChange={(e) => setProposalType(e.target.value)}>
                <option value="changeParameter">Change Parameter</option>
                <option value="addOwner">Add Owner</option>
                <option value="removeOwner">Remove Owner</option>
              </Form.Control>
            </Form.Group>

            {proposalType === "addOwner" || proposalType === "removeOwner" ? (
              <Form.Group>
                <Form.Label>Owner Address</Form.Label>
                <Form.Control
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="Enter Owner Address"
                />
              </Form.Group>
            ) : null}

            {proposalType === "changeParameter" ? (
              <>
                <Form.Group>
                  <Form.Label>New Percentage Confirmations Required</Form.Label>
                  <Form.Control
                    type="number"
                    value={newPercentage}
                    onChange={(e) => setNewPercentage(e.target.value)}
                    placeholder="Enter new percentage"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>New Num Confirmations Required</Form.Label>
                  <Form.Control
                    type="number"
                    value={newNumConfirmations}
                    onChange={(e) => setNewNumConfirmations(e.target.value)}
                    placeholder="Enter new confirmations"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    label="Voting by Weight"
                    checked={votingByWeight}
                    onChange={(e) => setVotingByWeight(e.target.checked)}
                  />
                </Form.Group>
              </>
            ) : null}

            <Button variant="primary" type="submit">
              Submit Proposal
            </Button>
          </Form>
        </Col>
      </Row>

      <Row className="my-4">
        <Col>
          <h3>Active Transactions</h3>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>To</th>
                <th>Value</th>
                <th>Confirmations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.to}</td>
                  <td>{ethers.formatEther(tx.value)} ETH</td>
                  <td>{tx.numConfirmations}</td>
                  <td>
                    <Button onClick={() => handleVoteTransaction(tx.id)} variant="primary" className="mr-2">
                      Vote
                    </Button>
                    <Button onClick={() => handleExecuteTransaction(tx.id)} variant="success">
                      Execute
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
};

export default App;
