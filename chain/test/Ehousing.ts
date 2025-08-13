import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { getAddress, parseEther, parseEventLogs } from "viem";

describe("Ehousing", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, thirdAccount] =
      await hre.viem.getWalletClients();

    const publicClient = await hre.viem.getPublicClient();
    const eHousing = await hre.viem.deployContract("Ehousing", [
      owner.account.address,
    ]);

    return {
      eHousing,
      owner,
      otherAccount,
      publicClient,
      thirdAccount,
    };
  }

  async function createHouseFixture() {
    const aggregatedFixture = await loadFixture(deployFixture);
    const { eHousing, publicClient } = aggregatedFixture;
    const txHash = await eHousing.write.createHouse([
      "https://myuri.com/asdasd",
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const houseTokenId = parseEventLogs({
      logs: receipt.logs,
      abi: eHousing.abi,
    }).find((e) => e.eventName == "HouseCreated")!.args.tokenId;

    return {
      ...aggregatedFixture,
      creation: { houseTokenId },
    };
  }

  async function giveHouseFixture() {
    const aggregatedFixture = await loadFixture(createHouseFixture);
    const { eHousing, otherAccount, publicClient, creation } =
      aggregatedFixture;

    const txHash = await eHousing.write.giveHouse([
      otherAccount.account.address,
      creation.houseTokenId,
      BigInt(Date.now()),
      BigInt(Date.now() + 100000000),
      parseEther("0.0001"),
    ]);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    return {
      ...aggregatedFixture,
      giving: {
        receipt,
        txHash,
      },
    };
  }

  async function payAndAssignHouseFixture() {
    const aggregatedFixture = await loadFixture(giveHouseFixture);
    const { eHousing, otherAccount, publicClient, creation } =
      aggregatedFixture;

    const txHash = await eHousing.write.renewRent([creation.houseTokenId], {
      value: parseEther("0.0002"),
      account: otherAccount.account,
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    return {
      ...aggregatedFixture,
      assignation: {
        receipt,
        txHash,
      },
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { eHousing, owner } = await loadFixture(deployFixture);

      expect(await eHousing.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should create an house", async function () {
      const { eHousing, publicClient } = await loadFixture(deployFixture);

      const txHash = await eHousing.write.createHouse([
        "https://myuri.com/asdasd",
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      const tokenId = parseEventLogs({
        logs: receipt.logs,
        abi: eHousing.abi,
      }).find((e) => e.eventName == "HouseCreated")?.args.tokenId;
      expect(tokenId).to.be.equal(BigInt(0));
    });

    it("Should give an house", async function () {
      const { eHousing, otherAccount, publicClient, creation, owner } =
        await loadFixture(createHouseFixture);

      const txHash = await eHousing.write.giveHouse([
        otherAccount.account.address,
        creation.houseTokenId,
        BigInt(Date.now()),
        BigInt(Date.now() + 100000000),
        parseEther("0.0001"),
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      const args = parseEventLogs({
        logs: receipt.logs,
        abi: eHousing.abi,
      }).find((e) => e.eventName == "HouseGiven")?.args;
      expect(args?.tokenId).to.not.be.undefined;
      expect(args?.tokenId).to.be.equal(creation.houseTokenId);
      expect(getAddress(args!.tempOwner)).to.be.equal(
        getAddress(otherAccount.account.address)
      );

      let ownerFromCt = await eHousing.read.ownerOf([creation.houseTokenId]);
      expect(getAddress(ownerFromCt)).to.be.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should assign an house paying the rent", async function () {
      const { eHousing, otherAccount, publicClient, creation } =
        await loadFixture(giveHouseFixture);

      const txHash = await eHousing.write.renewRent([creation.houseTokenId], {
        value: parseEther("0.0002"),
        account: otherAccount.account
      });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      const args = parseEventLogs({
        logs: receipt.logs,
        abi: eHousing.abi,
      }).find((e) => e.eventName == "HouseMinted")?.args;
      expect(args?.tokenId).to.not.be.undefined;
      expect(args?.tokenId).to.be.equal(creation.houseTokenId);
      expect(getAddress(args!.tempOwner)).to.be.equal(
        getAddress(otherAccount.account.address)
      );

      let ownerFromCt = await eHousing.read.ownerOf([creation.houseTokenId]);
      expect(getAddress(ownerFromCt)).to.be.equal(
        getAddress(otherAccount.account.address)
      );
    });

    it("Should not assign an house when not paying full collateral at first time", async function () {
      const { eHousing, otherAccount, creation } =
        await loadFixture(giveHouseFixture);

      await expect(
        eHousing.write.renewRent([creation.houseTokenId], {
          value: parseEther("0.0001"),
          account: otherAccount.account
        })
      ).eventually.to.be.rejectedWith("InvalidRentValue");

      await expect(
        eHousing.write.renewRent([creation.houseTokenId], {
          value: parseEther("0.0003"),
          account: otherAccount.account
        })
      ).eventually.to.be.rejectedWith("InvalidRentValue");
    });

    it("Should retake ownership", async () => {
      const { eHousing, creation, publicClient, owner } = await loadFixture(
        payAndAssignHouseFixture
      );
      const initialOwner = await eHousing.read.ownerOf([
        creation.houseTokenId!,
      ]);

      const txHash = await eHousing.write.retakeOwnership([
        creation.houseTokenId,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      const ownerFromCt = await eHousing.read.ownerOf([creation.houseTokenId!]);
      expect(getAddress(ownerFromCt)).to.be.equal(
        getAddress(owner.account.address)
      );
      expect(getAddress(initialOwner)).to.not.be.eq(getAddress(ownerFromCt));
    });

    it("Should give back ownership", async () => {
      const { eHousing, publicClient, creation, otherAccount, owner } =
        await loadFixture(payAndAssignHouseFixture);
      const initialOwner = await eHousing.read.ownerOf([
        creation.houseTokenId!,
      ]);
      const tx = await eHousing.write.giveBack([creation.houseTokenId!], {
        account: otherAccount.account,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      const currentOwner = await eHousing.read.ownerOf([
        creation.houseTokenId!,
      ]);
      expect(getAddress(currentOwner)).to.be.not.eq(getAddress(initialOwner));
      expect(getAddress(currentOwner)).to.be.eq(
        getAddress(owner.account.address)
      );
      expect(eHousing.write.giveBack([creation.houseTokenId])).to.be.rejected;
    });

    it("Should throw if owners accidentally gives back ownership", async () => {
      const { eHousing, creation } = await loadFixture(payAndAssignHouseFixture);
      expect(eHousing.write.giveBack([creation.houseTokenId])).to.be.rejected;
    });

    it("Should throw if someone calls onlyOwner retakeOwnership and retakeOnwershipForced", async () => {
      const { eHousing, creation, thirdAccount } = await loadFixture(
        payAndAssignHouseFixture
      );
      await expect(
        eHousing.write.giveBack([creation.houseTokenId], {
          account: thirdAccount.account,
        })
      ).to.be.eventually.rejectedWith("You are not renting this home!");
      await expect(
        eHousing.write.retakeOwnership([creation.houseTokenId], {
          account: thirdAccount.account,
        })
      ).eventually.to.be.rejectedWith("OwnableUnauthorizedAccount");
      await expect(
        eHousing.write.retakeOwnershipForced([creation.houseTokenId], {
          account: thirdAccount.account,
        })
      ).eventually.to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployFixture);

  //       await expect(lock.write.withdraw()).to.be.rejectedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We retrieve the contract with a different account to send a transaction
  //       const lockAsOtherAccount = await hre.viem.getContractAt(
  //         "Lock",
  //         lock.address,
  //         { client: { wallet: otherAccount } }
  //       );
  //       await expect(lockAsOtherAccount.write.withdraw()).to.be.rejectedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.write.withdraw()).to.be.fulfilled;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount, publicClient } =
  //         await loadFixture(deployFixture);

  //       await time.increaseTo(unlockTime);

  //       const hash = await lock.write.withdraw();
  //       await publicClient.waitForTransactionReceipt({ hash });

  //       // get the withdrawal events in the latest block
  //       const withdrawalEvents = await lock.getEvents.Withdrawal();
  //       expect(withdrawalEvents).to.have.lengthOf(1);
  //       expect(withdrawalEvents[0].args.amount).to.equal(lockedAmount);
  //     });
  //   });
  // });
});
