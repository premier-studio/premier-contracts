# Premier

Premier is about creating a world that is not only technologically advanced, but also socially conscious. We are firm believers that by integrating cutting-edge technology with the world's resources, we can not only improve the lives of individuals but also contribute to the greater good. We are committed to working tirelessly to ensure that we leave a positive impact on the world.

> This repository holds the smart-contracts of the main ecosystem of Premier.

## Introduction

### Drip

A **Drip** is, per se, a **customizable** NFT backed by a physical object. Its subtility lies in the fact that Drips are getting their customization through others NFT.

Drips can either be in two state:

-   **Default**, when it hasn't been customized.
-   **Mutated**, when it has been customized.

> Once in a Mutated state, there is no going back.

#### Minting

Mint price varies depending of the object underlying the **Drip**.

#### Mutating

The mutation process is straightforward, the only thing you have to do is to have in your wallet (the one calling the smart-contract) the NFT with which you want to customize your **Drip**.

> Contract wise this is simple to do for ERC721 tokens but once out of that normalized scope things can become tricky. Therefore we created the `ITokenInterface.sol` interface. It's an interface that is meant to be implemented by a contract that will act as a bridge between the Drip mutating process and the NFT mutating's contract.

### Drop

**Drips** releases will be held under the form of **Drop**. A "drop" refers to the limited release of a highly coveted asset.

### Royalties

### Governance
