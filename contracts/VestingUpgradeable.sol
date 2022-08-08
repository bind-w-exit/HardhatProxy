// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol"; 
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IVestingContract.sol";
import "./TevaToken.sol";


contract VestingUpgradeable is IVestingContract, Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;  

    uint256 public constant VESTING_TIME = 600 minutes;
    uint256 public constant CLIFF_TIME = 10 minutes;
    uint256 public constant ONE_HUNDRED_PERCENT = 100 ether;
    uint256 public constant PERCENT_PER_SECOND = ONE_HUNDRED_PERCENT / VESTING_TIME;

    mapping(address => Investor) public investorsInfo;
    
    uint256 public initialTimestamp;
    uint256 public totalSupply;
    address public token;
    bool public timestampInitialized;

    /**
     * @dev Initializes vesting start time.
     * Can only be called by the current owner.
     * Can be called only once.
     *
     * Emits an {SetInitialTimestamp} an event that indicates the initialization of the vesting start time.
     *
     * @param _initialTimestamp vesting start time
     */
    function setInitialTimestamp(
        uint256 _initialTimestamp
    )
        external
        override
        onlyOwner
    {
        require(!timestampInitialized, "Vesting: timestamp has already been initialized");
        require(_initialTimestamp > block.timestamp, "Vesting: initial timestamp is less than the current block timestamp");
        initialTimestamp = _initialTimestamp;
        timestampInitialized = true;
        emit SetInitialTimestamp(_initialTimestamp);
    }

    /**
     * @dev Adds investors with an amount for each.
     * Can only be called by the current owner.
     *
     * @param _investors Array of addresses of investors.
     * @param _amounts Array of token amounts that will be added to the addresses of investors.
     * @param _allocationType Seed or Private allocation type
     */
    function addInvestors(
        address[] calldata _investors,
        uint256[] calldata _amounts,
        AllocationType _allocationType
    )
        external
        override
        onlyOwner
    {
        require(!timestampInitialized, "Vesting: vesting has already been started");
        require(_investors.length == _amounts.length, "Vesting: the number of items in the arrays does't match");
        
        uint256 totalAmount;
        for (uint256 i = 0; i < _investors.length; i++) { 
            _addInvestor(_investors[i], _amounts[i], _allocationType);           
            totalAmount += _amounts[i];      
        }

        totalSupply += totalAmount;
        TevaToken(token).mint(address(this), totalAmount);
    }

    /**
     * @dev Transfers the amount of reward tokens back to the owner.
     * Without parameters.

     * Emits an {WithdrawTokens} event that indicates who and how much withdraw tokens from the contract.
     */
    function withdrawTokens() external override {      
        Investor storage investor = investorsInfo[msg.sender];

        require(timestampInitialized, "Vesting: not initialized");
        require(block.timestamp >= initialTimestamp, "Vesting: vesting hasn't started");
        require(investor.amount > 0, "Vesting: you are not a investor");

        uint256 amountToSend = _amountToSend(investor);

        require(amountToSend > 0, "Vesting: no tokens available");
        require(amountToSend <= totalSupply, "Vesting: none tokens in the contact");

        investor.withdrawnAmount += amountToSend;     
        totalSupply -= amountToSend;
        IERC20Upgradeable(token).safeTransfer(msg.sender, amountToSend);
        emit WithdrawTokens(msg.sender, amountToSend);
    }

    /**
     * @dev Transfers the amount of reward tokens back to the owner.
     * Can only be called by the current owner.
     * Without parameters.
     *
     * Emits an {WithdrawTokens} event that indicates who and how much withdraw tokens from the contract.
     */
    function emergencyWithdraw() external onlyOwner {
        require(timestampInitialized, "Vesting: not initialized");
        require(initialTimestamp + VESTING_TIME + CLIFF_TIME < block.timestamp, "Vesting: vesting not over");

        uint256 totalTokens = IERC20Upgradeable(token).balanceOf(address(this));
        uint256 amountToWithdraw = totalTokens - totalSupply;

        require(amountToWithdraw > 0, "Vesting: transaction amount is zero");

        IERC20Upgradeable(token).safeTransfer(msg.sender, amountToWithdraw);
        emit EmergencyWithdraw(msg.sender, amountToWithdraw);
    }

    /**
     * @dev Initializes the accepted token as a reward token.
     *
     * @param _token ERC-20 token address.
     */
    function initialize(address _token) public initializer {
        require(_token != address(0), "Vesting: token address is zero");
        token = _token;
        __Ownable_init();
    }

    /**
     * @dev Adds investor with an amount.
     *
     * Emits an {AddInvestors} an event indicating the addition of an investor with an amount of tokens.
     *
     * @param _investor Investor address.
     * @param _amount Amount of the investor.
     * @param _allocationType Seed or Private allocation type
     */
    function _addInvestor(address _investor, uint256 _amount, AllocationType _allocationType) internal {
        require(investorsInfo[_investor].amount == 0, "Vesting: investor already exist");

        uint256 initialAmount;
        if(_allocationType == AllocationType.Seed)
            initialAmount = _amount / 10;
        else 
            initialAmount = _amount * 15 / 100;

        investorsInfo[_investor] = Investor(_amount, initialAmount, 0, _allocationType);
        emit AddInvestor(_investor, _amount, _allocationType);
    }

    /**
     * @dev Calculates the amount to send.
     *
     * @param _investor Investor struct.
     */
    function _amountToSend(Investor memory _investor) internal view returns(uint256) {
        uint256 avaiableAmount;  
        uint256 vestingTimePassed = (block.timestamp - initialTimestamp);

        if (vestingTimePassed >= VESTING_TIME + CLIFF_TIME) {
            avaiableAmount = _investor.amount;
        } else if (vestingTimePassed >= CLIFF_TIME) {
            uint256 totalVestingAmount = _investor.amount - _investor.initialAmount;
            uint256 unlockedPercentage = PERCENT_PER_SECOND * (vestingTimePassed - CLIFF_TIME);
            avaiableAmount = _investor.initialAmount + ((unlockedPercentage * totalVestingAmount) / ONE_HUNDRED_PERCENT);
        } else {
            avaiableAmount = _investor.initialAmount;
        }    

        uint256 amountToSend = avaiableAmount - _investor.withdrawnAmount;
        return amountToSend; 
    }
}