const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
require("dotenv").config();

describe("Faucet", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy();

    const [owner, fakeOwner] = await ethers.getSigners();
    let withdrawAmount = ethers.utils.parseUnits("1", "ether");

    console.log("Signer 1 address: ", owner.address);
    console.log("Signer 2 address: ", fakeOwner.address);
    return { faucet, owner, withdrawAmount, fakeOwner };
  }

  // 1st Test
  it("should deploy and set the owner correctly", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);
    expect(await faucet.owner()).to.equal(owner.address);
  });

  // 2nd Test
  it("should not allow withdrawal of above .1 ETH at a time", async function () {
    const { faucet, withdrawAmount } = await loadFixture(
      deployContractAndSetVariables
    );
    await expect(faucet.withdraw(withdrawAmount)).to.be.reverted;
  });

  // 3rd Test
  it("function should only be called by the owner", async function () {
    const { faucet, fakeOwner } = await loadFixture(
      deployContractAndSetVariables
    );
    // Call function with other account
    await expect(faucet.connect(fakeOwner).destroyFaucet()).to.be
      .revertedWithoutReason;
  });

  // 4th Test
  it("contract should actually selfdestruct", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    await faucet.connect(owner).destroyFaucet();
    // A destroyed contract can only have the code of 0 = 0x
    expect(await ethers.provider.getCode(faucet.address)).to.equal("0x");
  });

  //5th Test
  it("should return all ether in balance to owner", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    const faucetBalanceBeforeWithdraw = await ethers.provider.getBalance(
      faucet.address
    );

    // Making use of the 'changeEtherBalances' method to test the chnage in the balance of both the account and the user
    await expect(faucet.withdrawAll()).to.changeEtherBalances(
      [owner, faucet],
      [faucetBalanceBeforeWithdraw, -faucetBalanceBeforeWithdraw]
    );
  });
});
