import {
  loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const insertTestData = [
  ["0xaeC9bB50Aff0158e86Bfdc1728C540D59edD71AD", 100],
  ["0xFd072083887bFcF8aEb8F37991c11c7743113374", 200],
  ["0xD22b134C9eDeB0e32CF16dB4B681461F8563dD34", 300],
  ["0x0843e4A46876e8Bf97E9B64e9056846812187917", 400],
  ["0x24BD740008c8913D149f052b6ddAcdD426eB2d70", 500],
];

describe("CappedSet", function () {
  async function deployFixture() {
    const [owner] = await ethers.getSigners();

    const limit = 5;

    const CappedSet = await ethers.getContractFactory("CappedSet");
    const cappedSet = await CappedSet.deploy(limit);
    await cappedSet.deployed();

    return { cappedSet, limit, owner };
  }

  describe("Deployment", function () {
    it("Should set the right limit", async function () {
      const { cappedSet, limit } = await loadFixture(deployFixture);

      expect(await cappedSet.limit()).to.equal(limit);
    });
  });

  describe("Functions", function () {
    describe("Insert", function () {
      it("Should revert if the value is not greater than zero ", async function () {
        const { cappedSet, owner } = await loadFixture(deployFixture);

        await expect(cappedSet.insert(owner.address, 0)).to.be.revertedWith(
          "Value must be greater then zero"
        );
      });

      it("Should revert if the address is already set", async function () {
        const { cappedSet, owner } = await loadFixture(deployFixture);

        await cappedSet.insert(owner.address, 100);

        await expect(cappedSet.insert(owner.address, 200)).to.be.revertedWith(
          "Address was inserted already"
        );
      });

      it("Should return zero values if its the first element to insert", async function () {
        const { cappedSet, owner } = await loadFixture(deployFixture);

        const res = await cappedSet
          .connect(owner)
          .callStatic.insert(owner.address, 100);

        expect([res[0], ethers.utils.formatEther(res[1])]).to.have.members([
          ZERO_ADDRESS,
          "0.0",
        ]);
      });

      it("Should return address with the smallest value after inserting all test data", async function () {
        const { cappedSet, owner } = await loadFixture(deployFixture);

        for (let i = 0; i < insertTestData.length - 1; i++) {
          const data = insertTestData[i];
          await cappedSet.connect(owner).insert(...data);
        }

        const smallestTestItem = insertTestData[0];
        const lastTestItem = insertTestData[insertTestData.length - 1];

        const tx = await cappedSet
          .connect(owner)
          .callStatic.insert(...lastTestItem);

        expect([tx[0], ethers.utils.formatUnits(tx[1], 0)]).to.have.members([
          smallestTestItem[0],
          smallestTestItem[1].toString(),
        ]);
      });

      it("Should return NEW address with the smallest value after reaching the insert limit", async function () {
        const { cappedSet, owner } = await loadFixture(deployFixture);

        for (let i = 0; i < insertTestData.length; i++) {
          const data = insertTestData[i];
          await cappedSet.connect(owner).insert(...data);
        }

        const newTestItem = ["0x87F0BfD5d95d67B3294a42e6778E6e38af05eC29", 150];

        const res = await cappedSet
          .connect(owner)
          .callStatic.insert(...newTestItem);

        expect([res[0], ethers.utils.formatUnits(res[1], 0)]).to.have.members([
          newTestItem[0],
          newTestItem[1].toString(),
        ]);
      });
    });

    describe("Update", function () {
      it("Should revert if the address was not inserted", async function () {
        const { cappedSet, owner } = await loadFixture(deployFixture);

        await expect(cappedSet.update(owner.address, 150)).to.be.revertedWith(
          "Address should be set"
        );
      });

      it("Should update the value", async function () {
        const { cappedSet, owner } = await loadFixture(deployFixture);
        const tx = await cappedSet.connect(owner).insert(owner.address, 100);
        await tx.wait();

        const res = await cappedSet
          .connect(owner)
          .callStatic.update(owner.address, 150);

        expect([res[0], ethers.utils.formatUnits(res[1], 0)]).to.have.members([
          owner.address,
          "150",
        ]);
      });
    });

    describe("Remove", function () {
      it("Should revert if the address was not inserted", async function () {
        const { cappedSet, owner } = await loadFixture(deployFixture);

        await expect(cappedSet.remove(owner.address)).to.be.revertedWith(
          "Address should be set"
        );
      });

      it("Should remove the address from the set", async function () {
        const { cappedSet, owner } = await loadFixture(deployFixture);
        let tx = await cappedSet.connect(owner).insert(owner.address, 100);
        await tx.wait();

        const res = await cappedSet
          .connect(owner)
          .callStatic.remove(owner.address);

        expect([res[0], ethers.utils.formatUnits(res[1], 0)]).to.have.members([
          ZERO_ADDRESS,
          "0",
        ]);
      });
    });

    describe("Get Value", function () {
      it("Should revert if the address was not inserted", async function () {
        const { cappedSet, owner } = await loadFixture(deployFixture);

        await expect(cappedSet.getValue(owner.address)).to.be.revertedWith(
          "Address should be set"
        );
      });

      it("Should the value by the address", async function () {
        const { cappedSet, owner } = await loadFixture(deployFixture);
        let tx = await cappedSet.connect(owner).insert(owner.address, 100);
        await tx.wait();

        const res = await cappedSet.getValue(owner.address);

        expect([ethers.utils.formatUnits(res, 0)]).to.have.members(["100"]);
      });
    });
  });
});
