# Troubleshooting

Currently the dApp is not able to perform certain transactions of Edge with Metamask - everywhere else it
should work fine. At times, you may need to add/readd an account to Metamask to work if you see the below
or similar error:

```sh
Error sending funds: could not coalesce error (error={ "code": -32603, "message": "Internal JSON-RPC error." }, payload={ "id": 24, "jsonrpc": "2.0", "method": "eth_sendTransaction", "params": [ { "from": "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc", "gas": "0x1114b", "to": "0xa513e6e4b8f2a923d98304ec87f64353c4d5c853", "value": "0xa688906bd8b00000" } ] }, code=UNKNOWN_ERROR, version=6.13.2)
```

