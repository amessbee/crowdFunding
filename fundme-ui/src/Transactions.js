import React, { useState, useEffect } from "react";
import { Table, Button, Row, Col } from "react-bootstrap";
import { ethers } from "ethers";

const Transactions = ({ contract, showAlertMessage }) => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (contract) {
      loadTransactions();
    }
  }, [contract]);

  const loadTransactions = async () => {
    const transactionCount = await contract.getTransactionCount();
    const loadedTransactions = [];
    for (let i = 0; i < transactionCount; i++) {
      const transaction = await contract.getTransaction(i);
      loadedTransactions.push({ ...transaction, id: i });
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

  return (
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
  );
};

export default Transactions;
