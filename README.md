# Premier

> Premier is about creating a world that is not only technologically advanced, but also socially conscious. We are firm believers that by integrating cutting-edge technology with the world's resources, we can not only improve the lives of individuals but also contribute to the greater good. We are committed to working tirelessly to ensure that we leave a positive impact on the world.

## Introduction

### Drip

Premier is a brand that specialize itself into the creation of **Drip**.

A **Drip** is a new form of NFT that combines both an NFT and a usable asset. This usable asset takes a physical form in the real world and a digital form in the metaverse.

When minted, Drips are in a **Default** state, which means that the **Drip** hasn't been combined with an NFT yet.

### Mutation

In order for you to combine your **Drip** with an NFT you'll have to **mutate** it. Once done, your Drip state will forever change to **Mutated**.

The mutation process is straightforward, the only thing you have to do is to have the NFT with which you want to mutate your **Drip** in your wallet.

> Contract wise this is simple to do for ERC721 tokens but once out of that normalized scope things can become tricky. Therefore we created the `ITokenInterface.sol` interface. It's an interface that is meant to be implemented by a contract that will act as a bridge between the Drip mutating process and the NFT mutating's contract.

### Drop

Drips releases will be held under the form of **Drop**. A "drop" refers to the limited release of a an asset.

Each **Drop** will have its own usable asset. You can think of everything from a skateboard deck, to a piece of clothing or even a custom Rolex, who knows.

## Contracts

Premier's contract are fairly simple as of now but they will get more complex along the way as new features will be implemented, like the enabling redeemability of physical objects.

### Store

The `Store.sol` contract acts as an entrypoint. It holds a reference to each Drop in the Premier ecosystem.

### Drop

The `Drop.sol` contract holds all the logic behind a **Drop** release, its functionalities and its Drips.
