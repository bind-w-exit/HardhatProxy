import { ethers, upgrades } from "hardhat";

async function main() {
  const TevaToken = await ethers.getContractFactory("TevaToken");
  const VestingContract = await ethers.getContractFactory("VestingUpgradeable");

  const tevaToken = await TevaToken.deploy();
  
  const vestingContractProxy = await upgrades.deployProxy(VestingContract, [tevaToken.address]);
  await vestingContractProxy.deployed();
  const currentImplAddress = await upgrades.erc1967.getImplementationAddress(vestingContractProxy.address);

  console.log("TEVA Token deployed to:", tevaToken.address);
  console.log("Vesting Contract Proxy deployed to:", vestingContractProxy.address);
  console.log("Vesting Contract Implementation deployed to:", currentImplAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
