// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface IVestingContract {

    enum AllocationType {
        Seed,
        Private
    }

    struct Investor {
        uint256 amount; 
        uint256 initialAmount;   
        uint256 withdrawnAmount;
        AllocationType allocationType;
    }

    event SetInitialTimestamp(uint256 initialTimestamp);
    event AddInvestor(address indexed investor, uint256 amount, AllocationType allocationType);
    event WithdrawTokens(address indexed investor, uint256 amount);
    event EmergencyWithdraw(address indexed investor, uint256 amount);


    /**
     * @dev Initializes vesting start time.
     * Can only be called by the current owner.
     * Can be called only once.
     *
     * Emits an {SetInitialTimestamp} an event that indicates the initialization of the vesting start time.
     *
     * @param _initialTimestamp vesting start time
     */
    function setInitialTimestamp(uint256 _initialTimestamp) external;

    /**
     * @dev Adds investors with an amount for each.
     * Can only be called by the current owner.
     *
     * Emits an {AddInvestors} an event indicating the addition of an investor with an amount of tokens.
     *
     * @param _investors Array of addresses of investors.
     * @param _amounts Array of token amounts that will be added to the addresses of investors.
     * @param _allocationType Seed or Private allocation type
     */
    function addInvestors(address[] calldata _investors, uint256[] calldata _amounts, AllocationType _allocationType) external;

    /**
     * @dev Transfers the amount of reward tokens back to the owner.
     * Without parameters.

     * Emits an {WithdrawTokens} event that indicates who and how much withdraw tokens from the contract.
     */
    function withdrawTokens() external;
}