import { ethers, upgrades } from "hardhat";

async function main() {
  const proxyAddress = "0x8dEa60739be461a1401cEBf11cBf7cdB28213159"

  const VestingContract_V2 = await ethers.getContractFactory("VestingUpgradeable_V2");
  
  const vestingContractProxy = await upgrades.upgradeProxy(proxyAddress, VestingContract_V2);
  await vestingContractProxy.deployed();
  const currentImplAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("Vesting Contract Implementation_V2 deployed to:", currentImplAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
