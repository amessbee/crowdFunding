import React, { useState, useEffect } from "react";
import { Table, Button, Row, Col, Form } from "react-bootstrap";
import { ethers } from "ethers";

const Transactions = ({ contract, showAlertMessage }) => {
  const [transactions, setTransactions] = useState([]);
  const [toAddress, setToAddress] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (contract) {
      loadTransactions();
    }
  }, [contract]);

  const loadTransactions = async () => {
    const transactionCount = await contract.getTransactionCount();
    const loadedTransactions = [];
    for (let i = 0; i < transactionCount; i++) {
      const [to, value, data, executed, numConfirmations, weight] = await contract.getTransaction(i);
      loadedTransactions.push({ id: i, to, value, data, executed, numConfirmations, weight });
    }
    setTransactions(loadedTransactions);
  };

  const handleVoteTransaction = async (txId) => {
    try {
      const tx = await contract.confirmTransaction(txId);
      await tx.wait();
      showAlertMessage("Transaction vote successful!");
      loadTransactions();
    } catch (error) {
      showAlertMessage("Error voting on transaction.");
    }
  };

  const handleExecuteTransaction = async (txId) => {
    try {
      const tx = await contract.executeTransaction(txId);
      await tx.wait();
      showAlertMessage("Transaction executed successfully!");
      loadTransactions();
    } catch (error) {
      showAlertMessage("Error executing transaction.");
    }
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    try {
      const tx = await contract.submitTransaction(toAddress, ethers.parseEther(value), ethers.toUtf8Bytes("Project 51"));
      await tx.wait();
      showAlertMessage("Transaction submitted successfully!");
      loadTransactions();
    } catch (error) {
      showAlertMessage("Error submitting transaction.");
      console.error("Error submitting transaction:", error);
      console.log("toAddress", toAddress);
        console.log("value", value);
    }
  };

  return (
    <>
      <Row className="my-4">
        <Col>
          <h3>Active Transactions</h3>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>To</th>
                <th>Value</th>
                <th>Confirmations</th>
                <th>Weight</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} style={{ color: tx.executed ? 'grey' : 'black' }}>
                  <td>{tx.to}</td>
                  <td>{ethers.formatEther(tx.value)} ETH</td>
                  <td>{tx.numConfirmations}</td>
                  <td>{tx.weight}</td>
                  <td>
                    <Button
                      onClick={() => handleVoteTransaction(tx.id)}
                      variant="primary"
                      className="me-2"
                      disabled={tx.executed}
                    >
                      Vote
                    </Button>
                    <Button
                      onClick={() => handleExecuteTransaction(tx.id)}
                      variant="success"
                      disabled={tx.executed}
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
          <h3>Submit a New Transaction</h3>
          <Form onSubmit={handleSubmitTransaction}>
            <Form.Group>
              <Form.Label>To Address</Form.Label>
              <Form.Control
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="Enter recipient address"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Value (in ETH)</Form.Label>
              <Form.Control
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter value"
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="mt-3">
              Submit Transaction
            </Button>
          </Form>
        </Col>
      </Row>
    </>
  );
};

export default Transactions;
