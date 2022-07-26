// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TevaToken is ERC20, AccessControl {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    address private _owner;


    modifier onlyOwner() {
        require(_owner == msg.sender, "TevaToken: caller is not the owner");
        _;
    }

    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, msg.sender), "TevaToken: Caller is not a minter");
        _;
    }

    modifier onlyBurner() {
        require(hasRole(BURNER_ROLE, msg.sender), "TevaToken: Caller is not a burner");
        _;
    }

    /**
     * @dev Initializes the roles and grants the owner those roles.
     * Without parameters.
     */
    constructor() ERC20("Teva token", "TEVA") {
        _owner = msg.sender;
        _setupRole(OWNER_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(BURNER_ROLE, msg.sender);
        _setRoleAdmin(MINTER_ROLE, OWNER_ROLE);
        _setRoleAdmin(BURNER_ROLE, OWNER_ROLE);
    }

    /**
     * @dev Adds the minter role to the address.
     * Can only be called by the current owner.
     *
     * @param minter Minter address.
     */
    function addMinter(address minter) external onlyOwner {
        grantRole(MINTER_ROLE, minter);
    }

    /**
     * @dev Adds the burner role to the address.
     * Can only be called by the current owner.
     *
     * @param burner Burner address.
     */
    function addBurner(address burner) external onlyOwner {
        grantRole(BURNER_ROLE, burner);
    }

    /**
     * @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * @param account Recipient's account.
     * @param amount Amount to mint.
     */
    function mint(address account, uint256 amount) external onlyMinter returns (bool) {    
        _mint(account, amount);
        return true;
    }

     /**
     * @dev Destroys amount tokens from account, reducing the
     * total supply.
     * 
     * @param amount Amount to burn.
     */
    function burn(uint256 amount) external onlyBurner returns (bool) { 
        _burn(msg.sender, amount);
        return true;
    }

    /**
     * @dev Returns owner's address.
     * Without parameters.
     */
    function owner() public view returns (address) {
        return _owner;
    }

}