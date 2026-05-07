const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("USDTPayment", function () {
  let USDTPayment;
  let contract;
  let owner;
  let admin;
  let user;
  let mockUSDT;

  beforeEach(async function () {
    [owner, admin, user] = await ethers.getSigners();

    // Deploy a mock USDT token for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDT = await MockERC20.deploy("Mock USDT", "USDT", 18);
    await mockUSDT.waitForDeployment();

    // Deploy the payment contract
    USDTPayment = await ethers.getContractFactory("USDTPayment");
    contract = await USDTPayment.deploy(await mockUSDT.getAddress(), admin.address);
    await contract.waitForDeployment();

    // Give some USDT to the user and approve the contract
    const amount = ethers.parseEther("1000");
    await mockUSDT.mint(user.address, amount);
    await mockUSDT.connect(user).approve(await contract.getAddress(), amount);
  });

  it("Should deposit USDT and transfer to admin", async function () {
    const paymentId = 12345;
    const amount = ethers.parseEther("100");

    await expect(contract.connect(user).deposit(paymentId, amount))
      .to.emit(contract, "Deposit")
      .withArgs(user.address, admin.address, amount, paymentId);

    expect(await mockUSDT.balanceOf(admin.address)).to.equal(amount);
  });

  it("Should prevent duplicate payment IDs", async function () {
    const paymentId = 12345;
    const amount = ethers.parseEther("10");

    await contract.connect(user).deposit(paymentId, amount);

    await expect(contract.connect(user).deposit(paymentId, amount))
      .to.be.revertedWith("Payment ID already used");
  });

  it("Should allow owner to change admin wallet", async function () {
    const newAdmin = user.address;
    await contract.connect(owner).setAdmin(newAdmin);
    expect(await contract.adminWallet()).to.equal(newAdmin);
  });
});
