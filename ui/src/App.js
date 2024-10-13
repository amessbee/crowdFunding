/**
 * App.js
 * 
 * This file contains the main component for the FundMe Contract Dashboard application.
 * It uses React and ethers.js to interact with an Ethereum smart contract.
 * The application allows users to donate funds to the contract, view transactions, and manage proposals.
 * 
 * Dependencies:
 * - React: A JavaScript library for building user interfaces.
 * - ethers: A library for interacting with the Ethereum blockchain.
 * - react-bootstrap: A library for using Bootstrap components in React.
 * - react-transition-group: A library for managing component transitions.
 * - bootstrap: A CSS framework for building responsive web applications.
 * 
 * Components:
 * - Proposals: Manages and displays proposals for the FundMe committee.
 * - Transactions: Displays transactions related to the contract.
 * - SendEth: Allows users to send Ether to the contract.
 * 
 * The application also handles connecting to the Ethereum provider, managing contract state, and displaying alerts.
 */

import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { Container, Tabs, Tab, Alert, Collapse } from "react-bootstrap";
import { CSSTransition } from 'react-transition-group';
import 'bootstrap/dist/css/bootstrap.min.css';
import Proposals from './Proposals';
import Transactions from './Transactions';
import SendEth from './SendEth';
import { contractAddress, contractABI } from './contractABI';
import './App.css'; // Import the CSS file for transitions

const App = () => {
  // State variables
  const [provider, setProvider] = useState(null); // Ethereum provider
  const [signer, setSigner] = useState(null); // Signer for transactions
  const [contract, setContract] = useState(null); // Smart contract instance
  const [alertMessage, setAlertMessage] = useState(""); // Alert message
  const [showAlert, setShowAlert] = useState(false); // Alert visibility
  const alertTimeoutRef = useRef(null); // Reference for alert timeout
  const [contractBalance, setContractBalance] = useState(0); // Contract balance
  const [key, setKey] = useState("proposals"); // Active tab key

  // Function to request account access from the user
  // const requestAccount = async () => {
  //   if (window.ethereum) {
  //     try {
  //       const accounts = await window.ethereum.request({
  //         method: "eth_requestAccounts",
  //       });
  //       console.log(accounts);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }
  // };

  // Function to update the contract balance
  const updateContractBalance = async (contract) => {
    try {
      const balance = await contract.getBalance();
      setContractBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Failed to update contract balance:", error);
      showAlertMessage(`Failed to update contract balance: ${error.message}`);
    }
  };

  // Effect to load the Ethereum provider and contract on component mount
  useEffect(() => {
    const loadProvider = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        setProvider(provider);
        const signer = await provider.getSigner();
        setSigner(signer);
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(contract);
        updateContractBalance(contract);
      } catch (error) {
        console.error("Failed to load provider:", error);
        showAlertMessage(`Failed to load provider: ${error.message}`);
      }
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
    loadProvider();
    return () => {
      // Clear timeout on component unmount
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  // Function to show an alert message
  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);

    // Clear any existing timeout
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    // Hide the alert after 5 seconds
    alertTimeoutRef.current = setTimeout(() => {
      setShowAlert(false);
    }, 5000);
  };

  return (
    <Container>
      <h1 className="mt-4 text-center">FundMe Contract Dashboard</h1>
      <Collapse in={showAlert}>
        <div>
          <CSSTransition
            in={showAlert}
            timeout={3000}
            classNames="alert-transition"
            unmountOnExit
          >
            <Alert
              variant="info"
              onClose={() => setShowAlert(false)}
              dismissible
            >
              {alertMessage}
            </Alert>
          </CSSTransition>
        </div>
      </Collapse>

      <Tabs
        id="controlled-tab-example"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
      >
        <Tab eventKey="sendEth" title="Donate Funds to the Contract">
          <SendEth
            provider={provider}
            contract={contract}
            signer={signer}
            contractBalance={contractBalance}
            updateContractBalance={updateContractBalance}
            showAlertMessage={showAlertMessage}
          />
        </Tab>

        <Tab eventKey="transactions" title="Projects in Need">
          <Transactions contract={contract} showAlertMessage={showAlertMessage} />
        </Tab>

        <Tab eventKey="proposals" title="FundMe Committee Admin Proposals">
          <Proposals contract={contract} showAlertMessage={showAlertMessage} />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default App;
