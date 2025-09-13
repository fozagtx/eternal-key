// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InheritanceSystem
 * @dev A comprehensive crypto inheritance system with deadman switch mechanism
 */
contract InheritanceSystem is ReentrancyGuard, Pausable, Ownable {
    
    struct Inheritance {
        address beneficiary;           // Address that will receive the inheritance
        uint256 amount;               // Amount of STT tokens in the inheritance
        uint256 deadmanDuration;      // Duration in seconds for deadman switch
        uint256 lastCheckIn;          // Timestamp of last check-in
        string message;               // Message to beneficiary
        bool exists;                  // Whether this inheritance exists
        bool executed;                // Whether inheritance has been executed
    }
    
    // Mapping from owner address to their inheritance
    mapping(address => Inheritance) public inheritances;
    
    // Minimum and maximum deadman switch durations
    uint256 public constant MIN_DEADMAN_DURATION = 1 days;
    uint256 public constant MAX_DEADMAN_DURATION = 365 days;
    
    // Events
    event InheritanceCreated(
        address indexed owner,
        address indexed beneficiary,
        uint256 deadmanDuration,
        string message
    );
    
    event FundsDeposited(
        address indexed owner,
        uint256 amount,
        uint256 totalAmount
    );
    
    event FundsWithdrawn(
        address indexed owner,
        uint256 amount,
        uint256 remainingAmount
    );
    
    event CheckInPerformed(
        address indexed owner,
        uint256 timestamp
    );
    
    event BeneficiaryUpdated(
        address indexed owner,
        address indexed oldBeneficiary,
        address indexed newBeneficiary
    );
    
    event DeadmanSwitchUpdated(
        address indexed owner,
        uint256 oldDuration,
        uint256 newDuration
    );
    
    event InheritanceExecuted(
        address indexed owner,
        address indexed beneficiary,
        uint256 amount,
        string message
    );
    
    modifier onlyInheritanceOwner() {
        require(inheritances[msg.sender].exists, "Inheritance does not exist");
        require(!inheritances[msg.sender].executed, "Inheritance already executed");
        _;
    }
    
    modifier validDuration(uint256 duration) {
        require(
            duration >= MIN_DEADMAN_DURATION && duration <= MAX_DEADMAN_DURATION,
            "Invalid deadman switch duration"
        );
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Creates a new inheritance with beneficiary and deadman switch
     * @param beneficiary Address of the beneficiary
     * @param deadmanDuration Duration for deadman switch in seconds
     * @param message Message to be sent to beneficiary
     */
    function createInheritance(
        address beneficiary,
        uint256 deadmanDuration,
        string memory message
    ) external payable validDuration(deadmanDuration) whenNotPaused {
        require(beneficiary != address(0), "Invalid beneficiary address");
        require(beneficiary != msg.sender, "Cannot set self as beneficiary");
        require(!inheritances[msg.sender].exists, "Inheritance already exists");
        
        inheritances[msg.sender] = Inheritance({
            beneficiary: beneficiary,
            amount: msg.value,
            deadmanDuration: deadmanDuration,
            lastCheckIn: block.timestamp,
            message: message,
            exists: true,
            executed: false
        });
        
        emit InheritanceCreated(msg.sender, beneficiary, deadmanDuration, message);
        
        if (msg.value > 0) {
            emit FundsDeposited(msg.sender, msg.value, msg.value);
        }
    }
    
    /**
     * @dev Deposits additional funds to existing inheritance
     */
    function depositFunds() external payable onlyInheritanceOwner whenNotPaused {
        require(msg.value > 0, "Must deposit some amount");
        
        inheritances[msg.sender].amount += msg.value;
        
        emit FundsDeposited(msg.sender, msg.value, inheritances[msg.sender].amount);
    }
    
    /**
     * @dev Withdraws funds from inheritance (only owner can do this)
     * @param amount Amount to withdraw
     */
    function withdrawFunds(uint256 amount) external onlyInheritanceOwner nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(inheritances[msg.sender].amount >= amount, "Insufficient balance");
        
        inheritances[msg.sender].amount -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(msg.sender, amount, inheritances[msg.sender].amount);
    }
    
    /**
     * @dev Resets the deadman switch by updating last check-in time
     */
    function checkIn() external onlyInheritanceOwner whenNotPaused {
        inheritances[msg.sender].lastCheckIn = block.timestamp;
        
        emit CheckInPerformed(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Updates the beneficiary address
     * @param newBeneficiary New beneficiary address
     */
    function updateBeneficiary(address newBeneficiary) external onlyInheritanceOwner whenNotPaused {
        require(newBeneficiary != address(0), "Invalid beneficiary address");
        require(newBeneficiary != msg.sender, "Cannot set self as beneficiary");
        
        address oldBeneficiary = inheritances[msg.sender].beneficiary;
        inheritances[msg.sender].beneficiary = newBeneficiary;
        
        emit BeneficiaryUpdated(msg.sender, oldBeneficiary, newBeneficiary);
    }
    
    /**
     * @dev Updates the deadman switch duration
     * @param newDuration New duration in seconds
     */
    function updateDeadmanSwitch(uint256 newDuration) external onlyInheritanceOwner validDuration(newDuration) whenNotPaused {
        uint256 oldDuration = inheritances[msg.sender].deadmanDuration;
        inheritances[msg.sender].deadmanDuration = newDuration;
        
        emit DeadmanSwitchUpdated(msg.sender, oldDuration, newDuration);
    }
    
    /**
     * @dev Executes inheritance (only beneficiary can call this after deadman switch triggers)
     * @param owner Address of the inheritance owner
     */
    function executeInheritance(address owner) external nonReentrant whenNotPaused {
        Inheritance storage inheritance = inheritances[owner];
        
        require(inheritance.exists, "Inheritance does not exist");
        require(!inheritance.executed, "Inheritance already executed");
        require(msg.sender == inheritance.beneficiary, "Only beneficiary can execute");
        require(isDeadmanSwitchTriggered(owner), "Deadman switch not triggered");
        require(inheritance.amount > 0, "No funds to inherit");
        
        uint256 amount = inheritance.amount;
        string memory message = inheritance.message;
        
        inheritance.executed = true;
        inheritance.amount = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit InheritanceExecuted(owner, msg.sender, amount, message);
    }
    
    /**
     * @dev Checks if deadman switch is triggered for a specific owner
     * @param owner Address of the inheritance owner
     * @return bool Whether the deadman switch is triggered
     */
    function isDeadmanSwitchTriggered(address owner) public view returns (bool) {
        Inheritance memory inheritance = inheritances[owner];
        
        if (!inheritance.exists || inheritance.executed) {
            return false;
        }
        
        return (block.timestamp >= inheritance.lastCheckIn + inheritance.deadmanDuration);
    }
    
    /**
     * @dev Gets complete inheritance details for an owner
     * @param owner Address of the inheritance owner
     * @return Inheritance struct with all details
     */
    function getInheritanceDetails(address owner) external view returns (Inheritance memory) {
        return inheritances[owner];
    }
    
    /**
     * @dev Gets time remaining until deadman switch triggers
     * @param owner Address of the inheritance owner
     * @return uint256 Seconds remaining (0 if already triggered)
     */
    function getTimeUntilTrigger(address owner) external view returns (uint256) {
        Inheritance memory inheritance = inheritances[owner];
        
        if (!inheritance.exists || inheritance.executed) {
            return 0;
        }
        
        uint256 triggerTime = inheritance.lastCheckIn + inheritance.deadmanDuration;
        
        if (block.timestamp >= triggerTime) {
            return 0;
        }
        
        return triggerTime - block.timestamp;
    }
    
    /**
     * @dev Gets list of inheritances where msg.sender is beneficiary
     * @return owners Array of owner addresses where msg.sender is beneficiary
     */
    function getInheritancesAsBeneficiary() external view returns (address[] memory) {
        // Note: This is a simplified version. In production, you'd want to maintain
        // a mapping of beneficiary => owner[] for efficiency
        address[] memory allOwners = new address[](0);
        // This would need to be implemented with additional data structures
        // for gas efficiency in a production environment
        return allOwners;
    }
    
    /**
     * @dev Emergency pause function (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause function (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal function (only contract owner, only when paused)
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
    
    /**
     * @dev Allows the contract to receive STT tokens
     */
    receive() external payable {
        // Contract can receive STT tokens
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        // Contract can receive STT tokens
    }
}