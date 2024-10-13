/**
 * Projects.js
 * 
 * This component handles the display and interaction with project projects in a crowdfunding application.
 * It allows users to view active projects, vote on them, execute them, and submit new projects.
 * 
 * Dependencies:
 * - React: For building the UI components.
 * - react-bootstrap: For UI components like Table, Button, Row, Col, and Form.
 * - ethers: For interacting with the Ethereum blockchain.
 */

import React, { useState, useEffect } from "react";
import { Table, Button, Row, Col, Form } from "react-bootstrap";
import { ethers } from "ethers";

const Projects = ({ contract, showAlertMessage }) => {
  // State to store the list of projects
  const [projects, setProjects] = useState([]);
  // State to store the address to which the new project will be sent
  const [toAddress, setToAddress] = useState("");
  // State to store the value of the new project
  const [value, setValue] = useState("");

  // Effect to load projects when the contract is available
  useEffect(() => {
    if (contract) {
      loadProjects();
    }
  }, [contract]);

  // Function to load projects from the contract
  const loadProjects = async () => {
    try {
      const projectCount = await contract.getProjectCount();
      const loadedProjects = [];
      for (let i = 0; i < projectCount; i++) {
        const [to, value, data, executed, numApprovals, weight] = await contract.getProject(i);
        loadedProjects.push({ id: i, to, value, data, executed, numApprovals, weight });
        console.log("weight ", weight);
      }
      setProjects(loadedProjects);
    } catch (error) {
      showAlertMessage("Error loading projects.");
      console.error("Error loading projects:", error);
    }
  };

  // Function to handle voting on a project
  const handleVoteProject = async (txId) => {
    try {
      const tx = await contract.approveProject(txId);
      await tx.wait();
      showAlertMessage("Project vote successful!");
      loadProjects();
    } catch (error) {
      showAlertMessage("Error voting on project.");
    }
  };

  // Function to handle executing a project
  const handleExecuteProject = async (txId) => {
    try {
      const tx = await contract.executeProject(txId);
      await tx.wait();
      showAlertMessage("Project executed successfully!");
      loadProjects();
    } catch (error) {
      showAlertMessage("Error executing project.");
    }
  };

  // Function to handle submitting a new project
  const handleSubmitProject = async (e) => {
    e.preventDefault();
    try {
      const tx = await contract.submitProject(toAddress, ethers.parseEther(value), ethers.toUtf8Bytes("Project 51"));
      await tx.wait();
      showAlertMessage("Project submitted successfully!");
      loadProjects();
    } catch (error) {
      showAlertMessage("Error submitting project.");
      console.error("Error submitting project:", error);
      console.log("toAddress", toAddress);
      console.log("value", value);
    }
  };

  return (
    <>
      <Row className="my-4">
        <Col>
          <h3>Active Projects</h3>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>To</th>
                <th>Value</th>
                <th>Votes</th>
                <th>Weight</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((tx) => (
                <tr key={tx.id} style={{ color: tx.executed ? 'green' : 'black' }}>
                  <td>{tx.to}</td>
                  <td>{ethers.formatEther(tx.value)} ETH</td>
                  <td>{tx.numApprovals.toString()}</td>
                  <td>{ethers.formatEther(tx.weight)}</td>
                  <td>
                    <Button
                      onClick={() => handleVoteProject(tx.id)}
                      variant="primary"
                      className="me-2"
                      disabled={tx.executed}
                    >
                      Vote
                    </Button>
                    <Button
                      onClick={() => handleExecuteProject(tx.id)}
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
          <h3>Champion a New Project</h3>
          <Form onSubmit={handleSubmitProject}>
            <Form.Group>
              <Form.Label>To Address</Form.Label>
              <Form.Control
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="Enter beneficiary address"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Project Demand (in ETH)</Form.Label>
              <Form.Control
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter value"
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="mt-3">
              Submit Project
            </Button>
          </Form>
        </Col>
      </Row>
    </>
  );
};

export default Projects;
