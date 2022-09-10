const FeldmanSistersNFT = artifacts.require("FeldmanSistersNFT");

const NAME = "";
const SYMBOL = "";

module.exports = async (deployer) => {
  await deployer.deploy(FeldmanSistersNFT, NAME, SYMBOL);
};
