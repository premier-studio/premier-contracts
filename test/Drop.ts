import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import Contracts from '@premier-contracts/components/contracts';
import { CryptoPunksMarket, Drop, ERC721, TestERC721 } from '@premier-contracts/typechain';
import { DripStatus } from '@premier-contracts/types';

const { parseEther: toEth } = ethers.utils;
const { AddressZero, HashZero } = ethers.constants;

// Errors

const AlreadyMutated = 'AlreadyMutated';

const InvalidVersions = 'InvalidVersions';
const InvalidVersionId = 'InvalidVersionId';
const InvalidDripId = 'InvalidDripId';
const InvalidPrice = 'InvalidPrice';
const InvalidOwner = 'InvalidOwner';

const MaxSupplyReached = 'MaxSupplyReached';

describe('Drop', () => {
    let owner: SignerWithAddress, user: SignerWithAddress;

    let Drop: Drop;

    before(async () => {
        [owner, user] = await ethers.getSigners();
    });

    describe('construction', () => {
        let dropId = 0;

        for (const maxSupply of [0, 200, 100000]) {
            for (const price of [toEth('0.05'), toEth('0.25'), toEth('2.5')]) {
                for (const versions of [1, 5, 10]) {
                    context(`with maxSupply: ${maxSupply}, price: ${price}, versions: ${versions}`, () => {
                        beforeEach(async () => {
                            Drop = await Contracts.Drop.deploy(dropId, maxSupply, price, versions);
                        });

                        afterEach(async () => {
                            dropId++;
                        });

                        it('should be properly constructed', async () => {
                            expect(await Drop.name()).to.equal('DROP#' + dropId);
                            expect(await Drop.symbol()).to.equal('DROP#' + dropId);
                            expect(await Drop.dropId()).to.equal(dropId);
                            expect(await Drop.maxSupply()).to.equal(maxSupply);
                            expect(await Drop.totalSupply()).to.equal(0);
                            expect(await Drop.price()).to.equal(price);
                            expect(await Drop.versions()).to.equal(versions);
                            expect(await Drop.dropURI()).to.equal('');
                            expect(await Drop.contractURI()).to.equal('');
                        });

                        it('rights should be properly set', async () => {
                            expect(await Drop.owner()).to.equal(owner.address);
                        });
                    });
                }
            }
        }

        it('should revert with invalid version', async () => {
            await expect(Contracts.Drop.deploy(0, 10, toEth('1'), 0)).revertedWith(InvalidVersions);
        });
    });

    describe('URI', () => {
        before(async () => {
            Drop = await Contracts.Drop.deploy(0, 10, toEth('1'), 1);
        });
        context('dropURI', () => {
            const URI = 'https://google.com';

            it('should properly set URI variable', async () => {
                await Drop.setDropURI(URI);

                expect(await Drop.dropURI()).equal(URI);
            });

            context('permission', () => {
                it('should revert when not allowed to set', async () => {
                    await expect(Drop.connect(user).setDropURI(URI)).to.revertedWith(
                        'Ownable: caller is not the owner'
                    );
                });
            });
        });

        context('contractURI', () => {
            const URI = 'https://google.com';

            it('should properly set URI variable', async () => {
                await Drop.setContractURI(URI);

                expect(await Drop.contractURI()).equal(URI);
            });

            context('permission', () => {
                it('should revert when not allowed to set', async () => {
                    await expect(Drop.connect(user).setContractURI(URI)).to.revertedWith(
                        'Ownable: caller is not the owner'
                    );
                });
            });
        });

        context('baseURI', () => {
            const URI = 'https://google.com';

            it('should properly set URI variable', async () => {
                await Drop.setBaseURI(URI);

                expect(await Drop.baseURI()).equal(URI);
            });

            context('permission', () => {
                it('should revert when not allowed to set', async () => {
                    await expect(Drop.connect(user).setBaseURI(URI)).to.revertedWith(
                        'Ownable: caller is not the owner'
                    );
                });
            });
        });
    });

    context('contract interface', () => {
        let nft: ERC721;
        let fakeInterface: ERC721;

        beforeEach(async () => {
            nft = await Contracts.ERC721.deploy('SYMBOL', 'NAME');
            fakeInterface = await Contracts.ERC721.deploy('SYMBOL', 'NAME');
        });

        it('initial token contract interface should be nil', async () => {
            expect(await Drop.getTokenContractInterface(nft.address)).to.equal(AddressZero);
        });

        it('should set properly', async () => {
            await Drop.setTokenContractInterface(nft.address, fakeInterface.address);
            expect(await Drop.getTokenContractInterface(nft.address)).to.equal(fakeInterface.address);
        });

        context('permission', () => {
            it('should revert when not allowed to set', async () => {
                await expect(
                    Drop.connect(user).setTokenContractInterface(nft.address, fakeInterface.address)
                ).to.revertedWith('Ownable: caller is not the owner');
            });
        });
    });

    describe('drip', () => {
        beforeEach(async () => {
            Drop = await Contracts.Drop.deploy(0, 1, toEth('1'), 1);

            await Drop.mint(0, { value: toEth('1') });
        });

        it('retrieve drip', async () => {
            const drip = await Drop.drip(0);
            expect(drip.version).equal(0);
        });

        it('accessing invalid drip should revert', async () => {
            await expect(Drop.drip(1)).revertedWith(InvalidDripId);
            await expect(Drop.drip(20)).revertedWith(InvalidDripId);
        });
    });

    describe('withdraw', () => {
        beforeEach(async () => {
            Drop = await Contracts.Drop.deploy(0, 10, toEth('1'), 1);

            await Drop.mint(0, { value: toEth('1') });
            await Drop.mint(0, { value: toEth('1') });
            await Drop.mint(0, { value: toEth('1') });
        });

        it('should widthdraw all fund', async () => {
            expect(await ethers.provider.getBalance(Drop.address)).to.equal(toEth('3'));

            await Drop.withdraw();

            expect(await ethers.provider.getBalance(Drop.address)).to.equal(0);
        });

        it('should increment caller balance', async () => {
            const snapshotOwnerBalance = await owner.getBalance();
            const snapshotDropBalance = await ethers.provider.getBalance(Drop.address);

            const res = await (await Drop.withdraw()).wait();

            expect(await owner.getBalance()).to.be.equal(
                snapshotOwnerBalance.add(snapshotDropBalance).sub(res.cumulativeGasUsed.mul(res.effectiveGasPrice))
            );
        });

        context('permission', () => {
            it('should revert when not allowed to withdraw', async () => {
                await expect(Drop.connect(user).withdraw()).to.revertedWith('Ownable: caller is not the owner');
            });
        });
    });

    describe('minting', () => {
        const mint = async (dripId: number, version: number, value: BigNumber) => {
            it(`should mint`, async () => {
                await Drop.connect(user).mint(version, { value });
            });

            const newTotalSupply = dripId + 1;

            it('balance of minter should be updated', async () => {
                expect(await Drop.balanceOf(user.address)).to.equal(newTotalSupply);
            });

            it('total supply should be updated', async () => {
                expect(await Drop.totalSupply()).to.equal(newTotalSupply);
            });

            it('minted drip should be properly initialized', async () => {
                const drip = await Drop.drip(dripId);

                expect(drip.status).equal(DripStatus.DEFAULT);
                expect(drip.version).equal(version);
                expect(drip.mutation.tokenContract).equal(AddressZero);
                expect(drip.mutation.tokenId).equal(0);
            });
        };

        const id = 0;
        for (const maxSupply of [3, 5]) {
            for (const price of [toEth('0'), toEth('0.05'), toEth('2.5')]) {
                for (const versions of [1, 5]) {
                    context(`with id: ${id}, price: ${price}, maxSupply: ${maxSupply}`, () => {
                        before(async () => {
                            Drop = await Contracts.Drop.deploy(id, maxSupply, price, versions);
                        });

                        for (let dripId = 0; dripId !== maxSupply; dripId++) {
                            mint(dripId, 0, price);
                        }

                        it(`shouldn't mint when max supply has been reached`, async () => {
                            await expect(Drop.mint(0)).to.be.revertedWith(MaxSupplyReached);
                        });
                    });
                }
            }
        }

        it('minting above max supply should revert', async () => {
            Drop = await Contracts.Drop.deploy(0, 0, toEth('0'), 1);
            await expect(Drop.mint(0)).revertedWith(MaxSupplyReached);
        });

        it('minting with an invalid version should revert', async () => {
            Drop = await Contracts.Drop.deploy(0, 10, toEth('0'), 1);
            await expect(Drop.mint(5)).revertedWith(InvalidVersionId);
        });

        it('minting with an invalid value should revert', async () => {
            Drop = await Contracts.Drop.deploy(0, 10, toEth('1'), 1);
            await expect(Drop.mint(0)).revertedWith(InvalidPrice);
        });
    });

    describe('mutating', () => {
        let tokenMutating: TestERC721;

        beforeEach(async () => {
            tokenMutating = await Contracts.TestERC721.deploy('SYMBOL', 'NAME', '0');

            await tokenMutating.connect(user).mint();

            Drop = await Contracts.Drop.deploy(0, 1, toEth('1'), 1);
        });

        it("shouldn't mutate if drip doesn't exist", async () => {
            await expect(Drop.connect(user).mutate(0, tokenMutating.address, 0)).to.revertedWith(InvalidDripId);

            await Drop.mint(0, { value: toEth('1') });
            await expect(Drop.connect(user).mutate(1, tokenMutating.address, 0)).to.revertedWith(InvalidDripId);
        });

        it("shouldn't mutate if user doesn't own the drip", async () => {
            await Drop.mint(0, { value: toEth('1') });

            await expect(Drop.connect(user).mutate(0, tokenMutating.address, 0)).to.revertedWith(InvalidOwner);
        });

        it("shouldn't mutate if already mutated", async () => {
            await Drop.connect(user).mint(0, { value: toEth('1') });
            await Drop.connect(user).mutate(0, tokenMutating.address, 0);

            await expect(Drop.connect(user).mutate(0, tokenMutating.address, 0)).to.revertedWith(AlreadyMutated);
        });

        describe('ERC721 token', () => {
            it("shouldn't mutate if user doesn't own the nft", async () => {
                await Drop.connect(user).mint(0, { value: toEth('1') });
                await tokenMutating.connect(user).transferFrom(user.address, owner.address, 0);

                await expect(Drop.connect(user).mutate(0, tokenMutating.address, 0)).to.revertedWith(InvalidOwner);
            });

            it('should mutate if done properly', async () => {
                await Drop.connect(user).mint(0, { value: toEth('1') });
                await Drop.connect(user).mutate(0, tokenMutating.address, 0);

                const drip = await Drop.drip(0);

                expect(drip.status).to.equal(DripStatus.MUTATED);
                expect(drip.mutation.tokenContract).to.equal(tokenMutating.address);
                expect(drip.mutation.tokenId).to.equal(0);
            });
        });

        // @TODO

        // describe('custom token', () => {});

        // describe('mutation interfaces', () => {
        //     context('CryptoPunks', () => {
        //         let cryptoPunksMarket: CryptoPunksMarket;
        //         beforeEach(async () => {
        //             Drop = await Contracts.Drop.deploy(0, 1, toEth('1'), 1);
        //             Drop = Drop.connect(user);

        //             cryptoPunksMarket = await Contracts.CryptoPunksMarket.deploy();

        //             await cryptoPunksMarket.setInitialOwner(user.address, 10);
        //         });

        //         it('should revert when no interface has been set', async () => {
        //             await Drop.mint(1, { value: toEth('1') });
        //             await expect(Drop.mutate(0, cryptoPunksMarket.address, 10)).to.reverted;
        //         });

        //         it('should revert when interface returns invalid owner', async () => {
        //             const cryptoPunksInterface = await Contracts.CryptopunksInterface.deploy(cryptoPunksMarket.address);
        //             await Drop.connect(owner).setTokenContractInterface(
        //                 cryptoPunksMarket.address,
        //                 cryptoPunksInterface.address
        //             );

        //             await Drop.mint(1, { value: toEth('1') });
        //             await expect(Drop.mutate(0, cryptoPunksMarket.address, 10)).to.be.revertedWith(InvalidOwner);
        //         });

        //         it('should not revert when interface has been set', async () => {
        //             const cryptoPunksInterface = await Contracts.CryptopunksInterface.deploy(cryptoPunksMarket.address);

        //             await Drop.connect(owner).setTokenContractInterface(
        //                 cryptoPunksMarket.address,
        //                 cryptoPunksInterface.address
        //             );
        //             await Drop.mint(1, { value: toEth('1') });
        //             await Drop.mutate(0, cryptoPunksMarket.address, 10);

        //             const drip = await Drop.drip(0);

        //             expect(drip.status).to.equal(DripStatus.MUTATED);
        //             expect(drip.mutation.tokenContract).to.equal(cryptoPunksMarket.address);
        //             expect(drip.mutation.tokenId).to.equal(10);
        //         });
        //     });
        // });
    });
});
