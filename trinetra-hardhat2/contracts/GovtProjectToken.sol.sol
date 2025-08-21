// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GovtProjectToken {

    // --- State Variables ---
    address public admin;

    string public name = "Govt Project Token";
    string public symbol = "GPT";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => bool) public isSigner;
    uint256 public requiredSignatures;

    // --- Data Structures for Approvals ---
    enum RequestStatus { Pending, Approved, Completed, Rejected }

    struct TransferRequest {
        uint256 id;
        address from;
        address to;
        uint256 amount;
        string billHash;
        RequestStatus status;
        uint256 approvalCount;
        mapping(address => bool) hasSigned;
    }
    
    // NEW: Struct for Burn Requests
    struct BurnRequest {
        uint256 id;
        address from;
        uint256 amount;
        string bankDetails; // User's bank info for off-chain payment
        RequestStatus status;
        uint256 approvalCount;
        mapping(address => bool) hasSigned;
    }

    mapping(uint256 => TransferRequest) public transferRequests;
    uint256 private _nextTransferRequestId = 1;

    // NEW: Mapping for Burn Requests
    mapping(uint256 => BurnRequest) public burnRequests;
    uint256 private _nextBurnRequestId = 1;

    // --- Events ---
    event TokensMinted(address indexed to, uint256 amount);
    event TransferRequestCreated(uint256 indexed requestId, address indexed from, address indexed to, uint256 amount, string billHash);
    event TransferApproved(uint256 indexed requestId, address indexed signer);
    event TransferCompleted(uint256 indexed requestId);
    
    // NEW: Events for Burning
    event BurnRequestCreated(uint256 indexed burnId, address indexed from, uint256 amount);
    event BurnRequestApproved(uint256 indexed burnId, address indexed from, uint256 amount, string bankDetails);

    // --- Constructor ---
    constructor(uint256 _initialSupply, uint256 _requiredSignaturesForApproval) {
        admin = msg.sender;
        requiredSignatures = _requiredSignaturesForApproval;

        uint256 initialAmount = _initialSupply * (10**decimals);
        totalSupply = initialAmount;
        balanceOf[admin] = initialAmount;
        emit TokensMinted(admin, initialAmount);
    }

    // --- Role Management ---
    function addSigner(address _signer) external {
        require(msg.sender == admin, "Only admin can add signers");
        isSigner[_signer] = true;
    }

    function removeSigner(address _signer) external {
        require(msg.sender == admin, "Only admin can remove signers");
        isSigner[_signer] = false;
    }
    
    // --- Transfer Functions ---
    function initiateTransfer(address _to, uint256 _amount, string calldata _billHash) external {
        require(_to != address(0), "Cannot transfer to zero address");
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");

        uint256 requestId = _nextTransferRequestId++;
        TransferRequest storage newRequest = transferRequests[requestId];
        newRequest.id = requestId;
        newRequest.from = msg.sender;
        newRequest.to = _to;
        newRequest.amount = _amount;
        newRequest.billHash = _billHash;
        newRequest.status = RequestStatus.Pending;
        emit TransferRequestCreated(requestId, msg.sender, _to, _amount, _billHash);
    }

    function approveTransfer(uint256 _requestId) external {
        require(isSigner[msg.sender], "Only signers can approve");
        TransferRequest storage request = transferRequests[_requestId];
        require(request.id != 0, "Request does not exist");
        require(request.status == RequestStatus.Pending, "Request is not pending");
        require(!request.hasSigned[msg.sender], "Signer has already approved");

        request.hasSigned[msg.sender] = true;
        request.approvalCount++;
        emit TransferApproved(_requestId, msg.sender);

        if (request.approvalCount >= requiredSignatures) {
            request.status = RequestStatus.Approved;
            address from = request.from;
            address to = request.to;
            uint256 amount = request.amount;
            require(balanceOf[from] >= amount, "Sender balance changed, transfer failed");
            balanceOf[from] -= amount;
            balanceOf[to] += amount;
            request.status = RequestStatus.Completed;
            emit TransferCompleted(_requestId);
        }
    }

    // --- NEW: Burn Functions ---

    /**
     * @dev User initiates a request to burn their tokens in exchange for real money.
     * @param _bankDetails The user's off-chain bank account info as a string.
     */
    function initiateBurn(uint256 _amount, string calldata _bankDetails) external {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance to burn");

        uint256 burnId = _nextBurnRequestId++;
        BurnRequest storage newBurnRequest = burnRequests[burnId];
        newBurnRequest.id = burnId;
        newBurnRequest.from = msg.sender;
        newBurnRequest.amount = _amount;
        newBurnRequest.bankDetails = _bankDetails;
        newBurnRequest.status = RequestStatus.Pending;

        emit BurnRequestCreated(burnId, msg.sender, _amount);
    }

    /**
     * @dev Signers approve the burn request. Once approved, tokens are destroyed
     * and an event is emitted for the off-chain service to process the payment.
     */
    function approveBurn(uint256 _burnId) external {
        require(isSigner[msg.sender], "Only signers can approve");
        BurnRequest storage request = burnRequests[_burnId];
        require(request.id != 0, "Burn request does not exist");
        require(request.status == RequestStatus.Pending, "Request is not pending");
        require(!request.hasSigned[msg.sender], "Signer has already approved");

        request.hasSigned[msg.sender] = true;
        request.approvalCount++;

        if (request.approvalCount >= requiredSignatures) {
            request.status = RequestStatus.Approved;
            
            address from = request.from;
            uint256 amount = request.amount;
            
            require(balanceOf[from] >= amount, "User balance changed, burn failed");

            // Burn the tokens
            balanceOf[from] -= amount;
            totalSupply -= amount;

            request.status = RequestStatus.Completed;
            
            // Emit the final event for the backend Oracle to catch
            emit BurnRequestApproved(request.id, from, amount, request.bankDetails);
        }
    }
}