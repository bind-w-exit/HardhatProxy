import { ethers, upgrades } from "hardhat";

async function main() {
  const TevaToken = await ethers.getContractFactory("TevaToken");
  const VestingContract = await ethers.getContractFactory("VestingUpgradeable");
  const VestingContract_V2 = await ethers.getContractFactory("VestingUpgradeable_V2");


  const tevaToken = await TevaToken.deploy();
  
  const instance = await upgrades.deployProxy(VestingContract, [tevaToken.address]);
  const vestingContractProxy = await upgrades.upgradeProxy(instance.address, VestingContract_V2);

  await vestingContractProxy.deployed();

  console.log("TEVA Token deployed to:", tevaToken.address);
  console.log("Vesting Contract Proxy deployed to:", vestingContractProxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
