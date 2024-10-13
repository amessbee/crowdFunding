/**
 * SendEth Component
 * 
 * This React component allows users to send ETH to a specified contract address.
 * It includes a form where users can input the amount of ETH they wish to send.
 * The component validates the input, checks the signer's balance, and sends the transaction.
 * It also displays the current balance of the contract and shows alert messages for success or error.
 */

import React, { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import { ethers } from "ethers";

const SendEth = ({
  provider, // The Ethereum provider
  contract, // The contract object
  signer, // The signer object
  contractBalance, // The current balance of the contract
  updateContractBalance, // Function to update the contract balance
  showAlertMessage, // Function to show alert messages
  }) => {
  
  const [ethAmount, setEthAmount] = useState(10); // State to store the amount of ETH to send

  // Function to handle the form submission
  const handleSendEth = async (e) => {
  e.preventDefault(); // Prevent the default form submission behavior
  console.log("contract", contract);
  
  try {
    // Validate the ETH amount
    if (!ethAmount || isNaN(ethAmount) || parseFloat(ethAmount) <= 0) {
    showAlertMessage('Please enter a valid amount of ETH to send.');
    return;
    }

    // Validate the contract address
    if (!ethers.isAddress(contract.target)) {
    showAlertMessage('Invalid contract address.');
    return;
    }

    // Get the signer's balance
    const balance = await provider.getBalance(await signer.getAddress());
    console.log("Metamask account balance : ", balance);
    const ethAmountInWei = ethers.parseEther(ethAmount.toString()); // Convert ETH amount to Wei

    // Send the transaction
    const tx = await signer.sendTransaction({
    to: contract.target, // The contract address
    value: ethAmountInWei, // The amount of ETH to send in Wei
    });
    await tx.wait(); // Wait for the transaction to be mined
    showAlertMessage(`Sent ${ethAmount} ETH to the CrowdFunding!`); // Show success message
    setEthAmount(10); // Reset the ETH amount input
    updateContractBalance(contract); // Update the contract balance
  } catch (error) {
    console.error('Error sending funds:', error); // Log the error
    showAlertMessage(`Error sending funds: ${error.message}`); // Show error message
  }
  };

  return (
  <Row className="my-4">
    <Col>
    <h3>Donate Funds to CrowdFunding</h3>
    <p>Current CrowdFunding Contract Balance: {contractBalance} ETH!!</p>
    <Form onSubmit={handleSendEth}>
      <Form.Group>
      <Form.Label>Amount of ETH to donate</Form.Label>
      <Form.Control
        type="number"
        value={ethAmount}
        onChange={(e) => setEthAmount(e.target.value)} // Update the ETH amount state
        placeholder="Enter amount in ETH"
      />
      </Form.Group>
      <Form.Group className="mt-3">
      <Button variant="primary" type="submit">
        Send ETH
      </Button>
      </Form.Group>
    </Form>
    </Col>
  </Row>
  );
};

export default SendEth;
