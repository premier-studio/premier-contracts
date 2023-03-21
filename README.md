# Premier

Premier is about creating a world that is not only technologically advanced, but also socially conscious. We are firm believers that by integrating cutting-edge technology with the world's resources, we can not only improve the lives of individuals but also contribute to the greater good. We are committed to working tirelessly to ensure that we leave a positive impact on the world.

This repository holds the smart-contract of the main ecosystem of Premier.

## Introduction

### Drip

At the root of everything **Drip** is our main component. A **Drip** is, per se, a **customizable** NFT backed by a physical object. The subtility lies in the fact that Drips are getting their customization through others NFT.

That being said, Drips can either be in two state: [ **Default** ] and [ **Mutated** ].

The reasoning behind is pretty simple, a Drip in a **Default** state hasn't been customized yet. However, once it has been customized its state become **Mutated** and it's irreversible.

#### Minting

Mint price will vary depending of the object underlying the Drip.

Upon minting, it can be possible to chose some specific parameters beforehand. You could call that a pre-customization. If for instance a Drip would be a skateboard deck, then you could for instance change its colors and/or textures and such things. All of those, unrelated to any NFT or mutation process.

#### **Mutating**

The mutation process is straightforward. The only thing you have to do is to have the NFT with which you want to customize your **Drip**.

Contract wise this is simple to do for ERC721 tokens but once out of that normalized scope things can become tricky. Therefore we created the `ITokenInterface.sol` interface. It's an interface that is meant to be implemented by a contract that will act as a bridge between the Drip mutating process and the NFT mutating's contract.

### Drop

**Drips** releases will be held under the form of **Drop**. I'm pretty sure you are familiar with what a Drop system is but for the sake of it, a "drop" refers to the limited release of a highly coveted asset.

### Royalties

### Governance
