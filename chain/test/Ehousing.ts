import { expect } from "chai";
import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { fromHex, fromRlp, getAddress } from "viem";

describe("Ehousing", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    console.log(owner.account);
    const eHousing = await hre.viem.deployContract("Ehousing", [
      owner.account.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      eHousing,
      owner,
      otherAccount,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { eHousing, owner } = await loadFixture(deployOneYearLockFixture);

      expect(await eHousing.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should create an house", async function () {
      const { eHousing, owner } = await loadFixture(deployOneYearLockFixture);

      const tokenId = await eHousing.write.createHouse([
        "https://myuri.com/asdasd",
      ]);
      expect(tokenId).to.equal(1);

      const ownerInContract = await eHousing.read.ownerOf([tokenId]);
      expect(getAddress(ownerInContract)).to.be.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should assign an house", async function () {
      const { eHousing, otherAccount } = await loadFixture(
        deployOneYearLockFixture
      );
      const tokenId = fromHex(
        await eHousing.write.createHouse(["https://myuri.com/asdasd"]),
        "bigint"
      );
      await eHousing.write.mintHouse([
        otherAccount.account.address,
        tokenId,
        BigInt(Date.now()),
        BigInt(Date.now() + 100000000),
      ]);
      const owner = await eHousing.read.ownerOf([tokenId]);
      expect(getAddress(owner)).to.be.equal(
        getAddress(otherAccount.account.address)
      );
    });
  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.write.withdraw()).to.be.rejectedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
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
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.write.withdraw()).to.be.fulfilled;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount, publicClient } =
  //         await loadFixture(deployOneYearLockFixture);

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
