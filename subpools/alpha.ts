var ethers = require('ethers')
var Caches = require('../cache.ts')

var externalContractAddressesAlpha = {
    Bank: "0x67B66C99D3Eb37Fa76Aa3Ed1ff33E8e39F0b9c7A",
    ConfigurableInterestBankConfig: "0x97a49f8eec63c0dfeb9db4c791229477962dc692",
  };

var externalAbisAlpha = {};
for (const contractName of Object.keys(externalContractAddressesAlpha)) {
    externalAbisAlpha[contractName] = require('./alpha/abi/' + contractName + '.json')
}

module.exports = class AlphaSubpool {
    provider
    cache
    externalContracts

    constructor(provider) {
        this.provider = provider;
        this.cache = new Caches({
            alphaIBEthApy: 300,
        })

        this.externalContracts = {};
        for (const contractName of Object.keys(externalContractAddressesAlpha)) {
            this.externalContracts[contractName] = new ethers.Contract(externalContractAddressesAlpha[contractName], externalAbisAlpha[contractName], this.provider);
        }
    }

    async getCurrencyApys() {
        return { ETH: await this.getIBEthApyBN() };
    }

    async getIBEthApyBN () {
        var self = this;
        return await this.cache.getOrUpdate("alphaIBEthApy", async function() {
            try {
                const glbDebtVal = await self.externalContracts.Bank.glbDebtVal()
                const balance = await self.provider.getBalance(self.externalContracts.Bank.address)
                // as this is no longer being used I'll leave it as is
                const interestRatePerSecondBN = await self.externalContracts.ConfigurableInterestBankConfig.callStatic.getInterestRate(glbDebtVal, balance)
                return balance
            } catch(e) {
                throw new Error("Failed to get Alpha Homora V1 interest rate: " + e);
            }
        })
    }
}