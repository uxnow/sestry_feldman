const FeldmanSistersNFT = artifacts.require("FeldmanSistersNFT");

const NAME = "Sestry Feldman & GroovyMinx.eth";
const SYMBOL = "SFNFT";

module.exports = async (deployer) => {
  await deployer.deploy(FeldmanSistersNFT, NAME, SYMBOL);
};
