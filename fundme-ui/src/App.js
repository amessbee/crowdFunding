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
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const alertTimeoutRef = useRef(null);
  const [contractBalance, setContractBalance] = useState(0);
  const [key, setKey] = useState("proposals");

  const requestAccount = async () => {
    if(window.ethereum){
        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            console.log(accounts)           
        } catch (error) {
            console.log(error)
        }
    }

};

  useEffect(() => {
    const loadProvider = async () => {
      // await requestAccount();
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

  const updateContractBalance = async (contract) => {
    try {
      const balance = await contract.getBalance();
      setContractBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Failed to update contract balance:", error);
      showAlertMessage(`Failed to update contract balance: ${error.message}`);
    }
  };

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
