const { accounts, wei } = require("../scripts/helpers/utils");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");

const FeldmanSistersNFTMock = artifacts.require("FeldmanSistersNFTMock");
const FeldmanSistersNFT = artifacts.require("FeldmanSistersNFT");

FeldmanSistersNFTMock.numberFormat = "BigNumber";
FeldmanSistersNFT.numberFormat = "BigNumber";

describe("FeldmanSistersNFT", () => {
  let OWNER;
  let SECOND;

  let nft;
  let nftMock;

  before("setup", async () => {
    OWNER = await accounts(0);
    SECOND = await accounts(1);
  });

  beforeEach("setup", async () => {
    nft = await FeldmanSistersNFT.new("NFTN", "NFTS");
    nftMock = await FeldmanSistersNFTMock.new("NFTN", "NFTS", 10);
  });

  describe("constructor", () => {
    it("should set everything correctly", async () => {
      assert.equal(await nft.maxTotalSupply(), "4096");
      assert.isFalse(await nft.saleStarted());
      assert.equal(await nft.priceInEther(), wei("0.02"));
      assert.equal(await nft.whitelistPerWallet(), "1");
      assert.equal(await nft.uri(), "");

      assert.equal(await nft.name(), "NFTN");
      assert.equal(await nft.symbol(), "NFTS");
    });
  });

  describe("owner setters", () => {
    it("should trigger sale", async () => {
      await nft.triggerSale(true);

      assert.isTrue(await nft.saleStarted());
    });

    it("should set new price", async () => {
      await nft.setPrice(wei("0.2"));

      assert.equal(await nft.priceInEther(), wei("0.2"));
    });

    it("should whitelist users", async () => {
      await nft.editWhitelist([OWNER, SECOND], true);

      assert.isTrue(await nft.whitelist(OWNER));
      assert.isTrue(await nft.whitelist(SECOND));

      await nft.editWhitelist([SECOND], false);

      assert.isFalse(await nft.whitelist(SECOND));
    });

    it("should set whitelist per wallet", async () => {
      await nft.setWhitelistPerWallet(3);

      assert.equal(await nft.whitelistPerWallet(), "3");
    });

    it("should set new base uri", async () => {
      await nft.setBaseURI("example.com");

      assert.equal(await nft.uri(), "example.com");
    });
  });

  describe("mint", () => {
    it("should mint", async () => {
      await nftMock.triggerSale(true);
      await nftMock.setBaseURI("example.com");

      await nftMock.mint(5, { value: wei("0.1") });

      assert.equal(await nftMock.balanceOf(OWNER), "5");
      assert.equal(await nftMock.tokenURI(1), "example.com1");
    });

    it("should mint whitelist", async () => {
      await nftMock.triggerSale(true);
      await nftMock.editWhitelist([OWNER], true);

      await nftMock.mint(3, { value: wei("0.04") });

      assert.equal(await nftMock.whitelistMinted(OWNER), "1");
      assert.equal(await nftMock.balanceOf(OWNER), "3");

      await nftMock.setWhitelistPerWallet(2);

      await nftMock.mint(1);

      assert.equal(await nftMock.whitelistMinted(OWNER), "2");
      assert.equal(await nftMock.balanceOf(OWNER), "4");

      await nftMock.setWhitelistPerWallet(1);

      await nftMock.mint(1, { value: wei("0.02") });

      assert.equal(await nftMock.whitelistMinted(OWNER), "2");
      assert.equal(await nftMock.balanceOf(OWNER), "5");
    });

    it("should not mint before sale", async () => {
      await truffleAssert.reverts(nftMock.mint(1), "FSNFT: sale has not started");
    });

    it("should revert if mint amount is 0", async () => {
      await nftMock.triggerSale(true);

      await truffleAssert.reverts(nftMock.mint(0), "FSNFT: zero mint");
    });

    it("should revert if ether amount is wrong", async () => {
      await nftMock.triggerSale(true);

      await truffleAssert.reverts(nftMock.mint(3, { value: wei("0.04") }), "FSNFT: wrong ether amount provided");
    });

    it("should not mint beyond max supply", async () => {
      await nftMock.triggerSale(true);

      await truffleAssert.reverts(nftMock.mint(11), "FSNFT: cap reached");
    });
  });

  describe("withdraw ether", () => {
    it("should withdraw ether", async () => {
      await nftMock.triggerSale(true);

      await nftMock.mint(2, { value: wei("0.04") });

      assert.equal(await web3.eth.getBalance(nftMock.address), wei("0.04"));

      await nftMock.withdrawEther(OWNER);

      assert.equal(await web3.eth.getBalance(nftMock.address), "0");
    });

    it("should revert ether withdrawal", async () => {
      await nftMock.triggerSale(true);

      await nftMock.mint(2, { value: wei("0.04") });

      await truffleAssert.reverts(nftMock.withdrawEther(nftMock.address), "FSNFT: failed transfer ether");
    });
  });

  describe("access", () => {
    it("only owner should call these functions", async () => {
      await truffleAssert.reverts(nft.triggerSale(true, { from: SECOND }), "Ownable: caller is not the owner");
      await truffleAssert.reverts(nft.setPrice(wei("0.2"), { from: SECOND }), "Ownable: caller is not the owner");
      await truffleAssert.reverts(
        nft.editWhitelist([OWNER, SECOND], true, { from: SECOND }),
        "Ownable: caller is not the owner"
      );
      await truffleAssert.reverts(nft.setWhitelistPerWallet(3, { from: SECOND }), "Ownable: caller is not the owner");
      await truffleAssert.reverts(nft.setBaseURI("example.com", { from: SECOND }), "Ownable: caller is not the owner");
      await truffleAssert.reverts(nft.withdrawEther(OWNER, { from: SECOND }), "Ownable: caller is not the owner");
    });
  });
});
