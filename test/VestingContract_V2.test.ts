import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { Contract, ContractFactory, BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

const {
  constants,
  expectRevert,
  snapshot,
  time
} = require("@openzeppelin/test-helpers");

require("chai")
  .should();


describe("Vesting Contract V2", function () {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  let TevaToken: ContractFactory;
  let tevaToken: Contract;
  let VestingContract: ContractFactory;
  let VestingContract_V2: ContractFactory;
  let vestingContractProxy: Contract;
  let snapshotA: any;
  

  const AMOUNT = BigNumber.from("1000024198495195135468");
  const VESTING_TIME = 600 * 60; //in sec
  const CLIFF_TIME = 10 * 60; //in sec
  const ONE_HUNDRED_PERCENT = BigNumber.from(ethers.utils.parseEther("100"));
  const PERCENT_PER_SECOND = ONE_HUNDRED_PERCENT.mul(2).div(VESTING_TIME);


  before(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    TevaToken = await ethers.getContractFactory("TevaToken");
    VestingContract = await ethers.getContractFactory("VestingUpgradeable");
    VestingContract_V2 = await ethers.getContractFactory("VestingUpgradeable_V2");
    tevaToken = await TevaToken.deploy();
    let instance = await upgrades.deployProxy(VestingContract, [tevaToken.address]);
    vestingContractProxy = await upgrades.upgradeProxy(instance.address, VestingContract_V2);

    

    await tevaToken.addMinter(vestingContractProxy.address);
    
    snapshotA = await snapshot();
  });

  describe("Vesting Contract Test Cases", function () {

    describe("Withdrawer Test Cases 💳", function () {

      afterEach(async function () {
        await snapshotA.restore();
      });

      //withdrawTokens
      it("should withdraw tokens to seed investor", async () => {
        await vestingContractProxy.addInvestors([user1.address], [AMOUNT], 0);
        let initialTimestamp = Math.floor(Date.now() / 1000) + 10;
        await vestingContractProxy.setInitialTimestamp(initialTimestamp);
        await time.increaseTo(initialTimestamp + VESTING_TIME / 4 + CLIFF_TIME);

        let receipt = await vestingContractProxy.connect(user1).withdrawTokens();

        let timestamp = await getCurrentTimestamp(receipt.blockNumber);
        let vestingTimePassed = timestamp - initialTimestamp - CLIFF_TIME;
        let initilalAmount = AMOUNT.div(10);
        let unlockedPercentage = PERCENT_PER_SECOND.mul(vestingTimePassed);
        let amount = initilalAmount.add(unlockedPercentage.mul(AMOUNT.sub(initilalAmount)).div(ONE_HUNDRED_PERCENT));
        
        await expect(receipt).to.emit(
          vestingContractProxy,
          "WithdrawTokens"
        ).withArgs(
          user1.address,
          amount
        );

        let totalSupply = await vestingContractProxy.totalSupply();
        totalSupply.should.be.equal(AMOUNT.sub(amount));
      });

      it("should withdraw tokens to private investor", async () => {
        await vestingContractProxy.addInvestors([user1.address], [AMOUNT], 1);
        let initialTimestamp = Math.floor(Date.now() / 1000) + 10;
        await vestingContractProxy.setInitialTimestamp(initialTimestamp);
        await time.increaseTo(initialTimestamp + VESTING_TIME / 4 + CLIFF_TIME);

        let receipt = await vestingContractProxy.connect(user1).withdrawTokens();

        let timestamp = await getCurrentTimestamp(receipt.blockNumber);
        let vestingTimePassed = timestamp - initialTimestamp;
        let amount = AMOUNT.mul(3).div(20).add(PERCENT_PER_SECOND.mul(vestingTimePassed - CLIFF_TIME).mul(AMOUNT.sub(AMOUNT.mul(3).div(20))).div(ONE_HUNDRED_PERCENT));
        
        await expect(receipt).to.emit(
          vestingContractProxy,
          "WithdrawTokens"
        ).withArgs(
          user1.address,
          amount
        );

        let totalSupply = await vestingContractProxy.totalSupply();
        totalSupply.should.be.equal(AMOUNT.sub(amount));
      });

      it("should withdraw tokens to seed investor before cliff ended", async () => {
        await vestingContractProxy.addInvestors([user1.address], [AMOUNT], 0);
        let initialTimestamp = Math.floor(Date.now() / 1000) + 10;
        await vestingContractProxy.setInitialTimestamp(initialTimestamp);
        await time.increaseTo(initialTimestamp);
        let receipt = await vestingContractProxy.connect(user1).withdrawTokens();
        await expect(receipt).to.emit(
          vestingContractProxy,
          "WithdrawTokens"
        ).withArgs(
          user1.address,
          AMOUNT.div(10)
        );
     
        let totalSupply = await vestingContractProxy.totalSupply();
        totalSupply.should.be.equal(AMOUNT.sub(AMOUNT.div(10)));
      });

      it("should withdraw tokens to private investor before cliff ended", async () => {
        await vestingContractProxy.addInvestors([user1.address], [AMOUNT], 1);
        let initialTimestamp = Math.floor(Date.now() / 1000) + 10;
        await vestingContractProxy.setInitialTimestamp(initialTimestamp);
        await time.increaseTo(initialTimestamp);

        let receipt = await vestingContractProxy.connect(user1).withdrawTokens();
        await expect(receipt).to.emit(
            vestingContractProxy,
            "WithdrawTokens"
          ).withArgs(
            user1.address,
            AMOUNT.mul(15).div(100)
          );

          let totalSupply = await vestingContractProxy.totalSupply();
          totalSupply.should.be.equal(AMOUNT.sub(AMOUNT.mul(15).div(100)));
      });

      it("should withdraw all tokens to investor after vesting", async () => {
        await vestingContractProxy.addInvestors([user1.address], [AMOUNT], 0);
        let initialTimestamp = Math.floor(Date.now() / 1000) + 10;
        await vestingContractProxy.setInitialTimestamp(initialTimestamp);
        await time.increaseTo(initialTimestamp + VESTING_TIME / 2 + CLIFF_TIME);

        let receipt = await vestingContractProxy.connect(user1).withdrawTokens();
        await expect(receipt).to.emit(
          vestingContractProxy,
          "WithdrawTokens"
        ).withArgs(
          user1.address,
          AMOUNT
        );

        let totalSupply = await vestingContractProxy.totalSupply();
        totalSupply.should.be.equal(BigNumber.from(0));
      });   


      //changeInvestor

      it("should move the amount of uncollected tokens from one investor address to another", async () => {
        let investorAddress = "0x889ADb790031B0439c482209F136AEC43372F900"
        let anotherAddress = "0x1388c300539f6e1aDa9DF4DD3aE2129a56F079a5"

        await vestingContractProxy.addInvestors([investorAddress], [AMOUNT], 0);
        await vestingContractProxy.addInvestors([anotherAddress], [AMOUNT], 0);
        
        let receipt = await vestingContractProxy.changeInvestor();      
        await expect(receipt).to.emit(
          vestingContractProxy,
          "ChangeInvestor"
        ).withArgs(
          investorAddress,
          anotherAddress,
          AMOUNT
        );

        expect((await vestingContractProxy.investorsInfo(investorAddress)).amount).equal(0);
        expect((await vestingContractProxy.investorsInfo(anotherAddress)).amount).equal(AMOUNT.mul(2));
      });   
    });
  });

  async function getCurrentTimestamp(blockNumber: number): Promise<any> {
    return (await ethers.provider.getBlock(blockNumber)).timestamp;
  };

});