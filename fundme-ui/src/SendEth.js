import React, { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import { ethers } from "ethers";

const SendEth = ({
    provider,
    contract,
    signer,
    contractBalance,
    updateContractBalance,
    showAlertMessage,
  }) => {
  
  const [ethAmount, setEthAmount] = useState(10);

  const handleSendEth = async (e) => {
    e.preventDefault();
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
      const ethAmountInWei = ethers.parseEther(ethAmount.toString());

      const tx = await signer.sendTransaction({
        to: contract.target,
        value: ethAmountInWei,
      });
      await tx.wait();
      showAlertMessage(`Sent ${ethAmount} ETH to the FundMe!`);
      setEthAmount(10);
      updateContractBalance(contract);
    } catch (error) {
      console.error('Error sending funds:', error);
      showAlertMessage(`Error sending funds: ${error.message}`);
    }
  };


  return (
    <Row className="my-4">
      <Col>
        <h3>Donate Funds to FundMe</h3>
        <p>Current FundMe Contract Balance: {contractBalance} ETH!!</p>
        <Form onSubmit={handleSendEth}>
          <Form.Group>
            <Form.Label>Amount of ETH to donate</Form.Label>
            <Form.Control
              type="number"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
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
