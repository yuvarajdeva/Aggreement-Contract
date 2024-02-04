import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

import type { Signers } from "../types";

const { expect } = require("chai");

describe("EscrowContract", function () {
  let EscrowContract;
  let escrowContract: any;
  let owner: any;
  let buyer: any;
  let seller: any;
  let arbitrator: any;
  let token: any;

  beforeEach(async function () {
    [owner, buyer, seller, arbitrator] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Nextrope"); // Replace with your actual ERC-20 token contract
    token = await Token.deploy();

    EscrowContract = await ethers.getContractFactory("EscrowContract");
    escrowContract = await EscrowContract.deploy();
  });

  it("should create an agreement", async function () {
    await token.connect(owner).transfer(buyer.address, ethers.utils.parseEther("1"));
    var tx = await escrowContract
      .connect(buyer)
      .createAgreement(seller.address, arbitrator.address, ethers.utils.parseEther("1"), token.address);
    var txn = await tx.wait();
    const agreementId = txn.events[0].args["agreementId"];
    const agreement = await escrowContract.agreements(agreementId);

    expect(agreement.buyer).to.equal(buyer.address);
    expect(agreement.seller).to.equal(seller.address);
    expect(agreement.arbitrator).to.equal(arbitrator.address);
    expect(agreement.amount).to.equal(ethers.utils.parseEther("1"));
    expect(agreement.state).to.equal(0); // State.Created
    expect(agreement.token).to.equal(token.address);
  });

  // Example test for payment
  it("should pay for an agreement", async function () {
    await token.connect(owner).transfer(buyer.address, ethers.utils.parseEther("1"));
    var tx = await escrowContract
      .connect(buyer)
      .createAgreement(seller.address, arbitrator.address, ethers.utils.parseEther("1"), token.address);
    var txn = await tx.wait();
    const agreementId = txn.events[0].args["agreementId"];
    await token.connect(buyer).approve(escrowContract.address, ethers.utils.parseEther("1"));
    await escrowContract.connect(buyer).pay(agreementId, { value: 0 });
    const agreement = await escrowContract.agreements(agreementId);

    expect(agreement.state).to; // State.Paid
  });
  // Example test for delivery
  it("should deliver an item", async function () {
    await token.connect(owner).transfer(buyer.address, ethers.utils.parseEther("1"));
    var tx = await escrowContract
      .connect(buyer)
      .createAgreement(seller.address, arbitrator.address, ethers.utils.parseEther("1"), token.address);
    var txn = await tx.wait();
    const agreementId = txn.events[0].args["agreementId"];
    await token.connect(buyer).approve(escrowContract.address, ethers.utils.parseEther("1"));
    await escrowContract.connect(buyer).pay(agreementId, { value: 0 });
    await escrowContract.connect(seller).deliverItem(agreementId);
    const agreement = await escrowContract.agreements(agreementId);

    expect(agreement.state).to.equal(2); // State.Delivered
  });

  // Example test for delivery
  it("should releasePayment for an agreement", async function () {
    await token.connect(owner).transfer(buyer.address, ethers.utils.parseEther("1"));
    var tx = await escrowContract
      .connect(buyer)
      .createAgreement(seller.address, arbitrator.address, ethers.utils.parseEther("1"), token.address);
    var txn = await tx.wait();
    const agreementId = txn.events[0].args["agreementId"];
    await token.connect(buyer).approve(escrowContract.address, ethers.utils.parseEther("1"));
    await escrowContract.connect(buyer).pay(agreementId, { value: 0 });
    await escrowContract.connect(seller).deliverItem(agreementId);
    await escrowContract.connect(buyer).releasePayment(agreementId);
    const agreement = await escrowContract.agreements(agreementId);

    expect(agreement.state).to.equal(4); // State.Resolved
  });

  // Example test for dispute resolution
  it("should resolve a dispute", async function () {
    await token.connect(owner).transfer(buyer.address, ethers.utils.parseEther("1"));
    var tx = await escrowContract
      .connect(buyer)
      .createAgreement(seller.address, arbitrator.address, ethers.utils.parseEther("1"), token.address);
    var txn = await tx.wait();
    const agreementId = txn.events[0].args["agreementId"];
    await token.connect(buyer).approve(escrowContract.address, ethers.utils.parseEther("1"));
    await escrowContract.connect(buyer).pay(agreementId, { value: 0 });
    await escrowContract.connect(buyer).raiseDispute(agreementId);
    var agreement = await escrowContract.agreements(agreementId);
    expect(agreement.state).to.equal(3); // State.Disputed
    await escrowContract.connect(arbitrator).resolveDispute(agreementId, true); // Assuming buyer wins
    agreement = await escrowContract.agreements(agreementId);

    expect(agreement.state).to.equal(4); // State.Resolved
  });
});
