import { expect } from 'chai';
import { BigNumber, ContractTransaction } from 'ethers';
import { ethers } from 'hardhat';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import Contracts from '@premier-components/contracts';
import { Drop, Store, TestERC721 } from '@premier-typechain';
import { DripStatus } from '@premier-types';

const { parseEther: toEth, formatEther } = ethers.utils;
const { AddressZero } = ethers.constants;

// Default values

const DEFAULT_DROP_ID = 0;
const DEFAULT_DROP_MAX_SUPPLY = 10;
const DEFAULT_DROP_PRICE = toEth('1');
const DEFAULT_DROP_VERSIONS = 2;

const DEFAULT_DRIP_ID = 0;
const DEFAULT_DRIP_VERSION = 1;

// Errors

const OwnableError = 'Ownable: caller is not the owner';

const InvalidDropId = 'InvalidDropId';

const InvalidMaxSupply = 'InvalidMaxSupply';
const InvalidVersions = 'InvalidVersions';
const InvalidDripId = 'InvalidDripId';

const InvalidPrice = 'InvalidPrice';
const InvalidVersionId = 'InvalidVersionId';
const InvalidDripOwner = 'InvalidDripOwner';
const MaxSupplyReached = 'MaxSupplyReached';
const AlreadyMutated = 'AlreadyMutated';
const InvalidTokenOwner = 'InvalidTokenOwner';

// Invalid values

const INVALID_DROP_VERSIONS = 0;
const INVALID_DROP_MAX_SUPPLY = 0;

describe('Store', () => {
    let owner: SignerWithAddress, user: SignerWithAddress;

    let Store: Store;

    before(async () => {
        [owner, user] = await ethers.getSigners();
    });

    const createDrop = async ({
        maxSupply = DEFAULT_DROP_MAX_SUPPLY,
        price = DEFAULT_DROP_PRICE,
        versions = DEFAULT_DROP_VERSIONS
    }) => {
        const tx = await Store.connect(owner).createDrop(maxSupply, price, versions);
        const receipt = await tx.wait();

        if (receipt && receipt.events) {
            const dropId = (receipt.events[1] as any).args.dropId;
            return { Drop: await Contracts.Drop.attach(await Store.drop(dropId)), dropId };
        }

        throw Error('');
    };

    describe('construction', () => {
        before(async () => {
            Store = await Contracts.Store.deploy();
        });

        it('initial total supply should be properly initialized', async () => {
            expect(await Store.dropSupply()).to.equal(0);
        });

        it('contract ownership should be properly set', async () => {
            expect(await Store.owner()).to.equal(owner.address);
        });
    });

    describe('drop', () => {
        before(async () => {
            Store = await Contracts.Store.deploy();
        });

        describe('creation', () => {
            const createDrop = (maxSupply: number, price: BigNumber, versions: number, dropId: number) => {
                let snapshotDropTotalSupply: BigNumber;
                let res: ContractTransaction;

                before(async () => {
                    snapshotDropTotalSupply = await Store.dropSupply();
                });

                it('should create drop', async () => {
                    res = await Store.createDrop(maxSupply, price, versions);
                });

                it('should emit event upon creation', async () => {
                    await expect(res).to.emit(Store, 'DropCreated').withArgs(dropId);
                });

                it('should update total supply', async () => {
                    expect(await Store.dropSupply()).to.equal(snapshotDropTotalSupply.add(1));
                });

                it('should be properly initialized on drop', async () => {
                    const drop = await Contracts.Drop.attach(await Store.drop(dropId));

                    expect(await drop.owner()).to.equal(Store.address);

                    expect(await drop.name()).to.equal('DROP#' + dropId);
                    expect(await drop.symbol()).to.equal('DROP#' + dropId);
                    expect(await drop.dropId()).to.equal(dropId);
                    expect(await drop.totalSupply()).to.equal(0);
                    expect(await drop.maxSupply()).to.equal(maxSupply);
                    expect(await drop.price()).to.equal(price);
                    expect(await drop.versions()).to.equal(versions);

                    expect(await drop.contractURI()).to.equal('');
                    expect(await drop.dropURI()).to.equal('');
                    expect(await drop.baseURI()).to.equal('');
                });

                it('should be properly initialized on store', async () => {
                    const drop = await Store.dropInfo(dropId);

                    expect(drop.name).to.equal('DROP#' + dropId);
                    expect(drop.symbol).to.equal('DROP#' + dropId);
                    expect(drop.id).to.equal(dropId);
                    expect(drop.currentSupply).to.equal(0);
                    expect(drop.maxSupply).to.equal(maxSupply);
                    expect(drop.price).to.equal(price);
                    expect(drop.versions).to.equal(versions);

                    expect(drop.contractURI).to.equal('');
                    expect(drop.dropURI).to.equal('');
                    expect(drop.baseURI).to.equal('');
                });
            };

            let dropId = 0;
            for (const maxSupply of [1, 100, 2500, 50000]) {
                for (const price of [toEth('0.05'), toEth('0.25'), toEth('2.5')]) {
                    for (const versions of [1, 5, 10]) {
                        context(`with maxSupply: ${maxSupply}, price: ${price}`, () => {
                            createDrop(maxSupply, price, versions, dropId);
                            dropId++;
                        });
                    }
                }
            }

            context('permission', () => {
                it('should revert when not allowed to create a drop', async () => {
                    await expect(
                        Store.connect(user).createDrop(
                            DEFAULT_DROP_MAX_SUPPLY,
                            DEFAULT_DROP_PRICE,
                            DEFAULT_DROP_VERSIONS
                        )
                    ).to.be.revertedWith(OwnableError);
                });
            });

            it('should revert with invalid max supply', async () => {
                await expect(Store.createDrop(INVALID_DROP_MAX_SUPPLY, DEFAULT_DROP_PRICE, DEFAULT_DROP_VERSIONS))
                    .reverted; // With(InvalidMaxSupply)
            });

            it('should revert with invalid version', async () => {
                await expect(Store.createDrop(DEFAULT_DROP_MAX_SUPPLY, DEFAULT_DROP_PRICE, INVALID_DROP_VERSIONS))
                    .reverted; // With(InvalidVersions)
            });
        });

        describe('get drop', () => {
            before(async () => {
                Store = await Contracts.Store.deploy();
            });

            it('should revert when accessing an invalid drop', async () => {
                await expect(Store.drop(DEFAULT_DROP_ID)).to.be.revertedWithCustomError(Store, InvalidDropId);
                await expect(Store.dropInfo(DEFAULT_DROP_ID)).to.be.revertedWithCustomError(Store, InvalidDropId);
            });

            it('should returns drop when drop id is valid', async () => {
                await Store.createDrop(DEFAULT_DROP_MAX_SUPPLY, DEFAULT_DROP_PRICE, DEFAULT_DROP_VERSIONS);

                const drop = await Store.drop(DEFAULT_DROP_ID);
                const dropInfo = await Store.dropInfo(DEFAULT_DROP_ID);

                expect(drop).to.equal(dropInfo._contract);
                expect(dropInfo.id).to.equal(DEFAULT_DROP_ID);
            });
        });

        describe('URIs', () => {
            const newURI = 'https://google.com/';

            let dropId: BigNumber;

            before(async () => {
                Store = await Contracts.Store.deploy();
            });

            beforeEach(async () => {
                ({ dropId } = await createDrop({}));
            });

            context('contractURI', () => {
                it('should be able to change contractURI', async () => {
                    expect((await Store.dropInfo(dropId)).contractURI).to.equal('');
                    await Store.setContractURI(dropId, newURI);
                    expect((await Store.dropInfo(dropId)).contractURI).to.equal(newURI);
                });

                context('permission', () => {
                    it('should revert when not allowed to change contractURI', async () => {
                        await expect(Store.connect(user).setContractURI(dropId, newURI)).to.revertedWith(OwnableError);
                    });
                });
            });

            context('dropURI', () => {
                it('should be able to change dropURI', async () => {
                    expect((await Store.dropInfo(dropId)).dropURI).to.equal('');
                    await Store.setDropURI(dropId, newURI);
                    expect((await Store.dropInfo(dropId)).dropURI).to.equal(newURI);
                });

                context('permission', () => {
                    it('should revert when not allowed to change dropURI', async () => {
                        await expect(Store.connect(user).setDropURI(dropId, newURI)).to.revertedWith(OwnableError);
                    });
                });
            });

            context('baseURI', () => {
                it('Owner: should be able to change baseURI', async () => {
                    expect((await Store.dropInfo(dropId)).baseURI).to.equal('');
                    await Store.setBaseURI(dropId, newURI);
                    expect((await Store.dropInfo(dropId)).baseURI).to.equal(newURI);

                    await Store.mint(dropId, 0, { value: DEFAULT_DROP_PRICE });
                });

                context('permission', () => {
                    it('should revert when not allowed to change baseURI', async () => {
                        await expect(Store.connect(user).setBaseURI(dropId, newURI)).to.revertedWith(OwnableError);
                    });
                });
            });
        });

        describe('withdraw', () => {
            const MINT_NB = 5;

            let Drop: Drop;
            let dropId: BigNumber;

            before(async () => {
                Store = await Contracts.Store.deploy();
            });

            beforeEach(async () => {
                ({ Drop, dropId } = await createDrop({ maxSupply: MINT_NB }));

                for (let i = 0; i < MINT_NB; i++) {
                    await Store.mint(dropId, DEFAULT_DRIP_VERSION, { value: DEFAULT_DROP_PRICE });
                }
            });

            it('should widthdraw all fund', async () => {
                expect(await ethers.provider.getBalance(Drop.address)).to.equal(DEFAULT_DROP_PRICE.mul(MINT_NB));
                await Store.withdraw(dropId);
                expect(await ethers.provider.getBalance(Drop.address)).to.equal(0);
            });

            it("should increment caller's balance", async () => {
                const snapshotOwnerBalance = await owner.getBalance();
                const snapshotDropBalance = await ethers.provider.getBalance(Drop.address);

                const res = await (await Store.withdraw(dropId)).wait();
                expect(await owner.getBalance()).to.be.equal(
                    snapshotOwnerBalance.add(snapshotDropBalance).sub(res.cumulativeGasUsed.mul(res.effectiveGasPrice))
                );
            });

            it('should emit event on withdraw', async () => {
                const snapshotDropBalance = await ethers.provider.getBalance(Drop.address);
                const res = await Store.withdraw(dropId);
                await expect(res).to.emit(Store, 'Withdrawn').withArgs(dropId, snapshotDropBalance);
            });

            context('permission', () => {
                it('should revert when not allowed to withdraw', async () => {
                    await expect(Store.connect(user).withdraw(dropId)).to.revertedWith(
                        'Ownable: caller is not the owner'
                    );
                });
            });
        });
    });

    describe('drip', () => {
        let dropId: BigNumber;

        before(async () => {
            Store = await Contracts.Store.deploy();
        });

        beforeEach(async () => {
            ({ dropId } = await createDrop({}));
        });

        describe('management', () => {
            it('should revert when accessing non existing drip', async () => {
                await expect(Store.dripInfo(dropId, 0)).to.be.reverted; // InvalidDripId
                await expect(Store.dripInfo(dropId, 1)).to.be.reverted; // InvalidDripId
                await expect(Store.dripInfo(dropId, 10)).to.be.reverted; // InvalidDripId
            });

            it('should properly retrieve a minted drip', async () => {
                await Store.mint(dropId, DEFAULT_DRIP_VERSION, { value: DEFAULT_DROP_PRICE });

                const drip = await Store.dripInfo(dropId, DEFAULT_DRIP_ID);

                expect(drip.id).equal(DEFAULT_DRIP_ID);
                expect(drip.owner).equal(owner.address);

                expect(drip.drip.version).equal(DEFAULT_DRIP_VERSION);
                expect(drip.drip.status).equal(DripStatus.DEFAULT);
                expect(drip.drip.mutation.tokenContract).equal(AddressZero);
                expect(drip.drip.mutation.tokenId).equal(0);
            });
        });

        describe('mint', () => {
            let Drop: Drop;
            let dropId: BigNumber;

            before(async () => {
                Store = await Contracts.Store.deploy();
            });

            const mint = async (dripId: number, version: number, value: BigNumber) => {
                let res: ContractTransaction;

                let prevEthBalance: BigNumber;

                it(`should mint properly`, async () => {
                    prevEthBalance = await ethers.provider.getBalance(Drop.address);

                    res = await Store.connect(user).mint(dropId, version, { value });
                });

                it(`should emit event on mint`, async () => {
                    expect(res).to.emit(Store, 'Minted').withArgs(dropId, dripId);
                });

                const newTotalSupply = dripId + 1;

                it('balance of minter should be updated', async () => {
                    expect(await Drop.balanceOf(user.address)).to.equal(newTotalSupply);
                });

                it('ethereum balance of drop should be updated', async () => {
                    expect(await ethers.provider.getBalance(Drop.address)).to.equal(prevEthBalance.add(value));
                });

                it('total supply should be updated', async () => {
                    expect(await Drop.totalSupply()).to.equal(newTotalSupply);
                });

                it('minted drip should be properly initialized', async () => {
                    const drip = await Store.dripInfo(dropId, dripId);

                    expect(drip.owner).equal(user.address);
                    expect(drip.id).equal(dripId);

                    expect(drip.drip.version).equal(version);
                    expect(drip.drip.status).equal(DripStatus.DEFAULT);
                    expect(drip.drip.mutation.tokenContract).equal(AddressZero);
                    expect(drip.drip.mutation.tokenId).equal(0);
                });
            };

            for (const maxSupply of [3, 5]) {
                for (const price of [toEth('0.25'), toEth('1'), toEth('10')]) {
                    for (const versions of [5, 10]) {
                        context(`with price: ${price}, maxSupply: ${maxSupply}, versions: ${versions}`, () => {
                            before(async () => {
                                ({ Drop, dropId } = await createDrop({ maxSupply, price, versions }));
                                Drop = Drop.connect(user);
                            });

                            for (let dripId = 0; dripId < maxSupply; dripId++) {
                                mint(dripId, Math.floor(Math.random() * versions), price);
                            }

                            it(`should revert when max supply has been reached`, async () => {
                                await expect(Store.mint(dropId, 0, { value: price })).to.be.revertedWithCustomError(
                                    Drop,
                                    MaxSupplyReached
                                );
                            });

                            it(`should revert when price is invalid`, async () => {
                                await expect(Store.mint(dropId, 0, { value: price })).to.be.revertedWithCustomError(
                                    Drop,
                                    MaxSupplyReached
                                );
                            });
                        });
                    }
                }
            }

            it('minting with an invalid version should revert', async () => {
                ({ Drop, dropId } = await createDrop({ versions: 5 }));

                await expect(Store.mint(dropId, 0, { value: DEFAULT_DROP_PRICE })).to.not.reverted;
                await expect(Store.mint(dropId, 1, { value: DEFAULT_DROP_PRICE })).to.not.reverted;
                await expect(Store.mint(dropId, 2, { value: DEFAULT_DROP_PRICE })).to.not.reverted;
                await expect(Store.mint(dropId, 3, { value: DEFAULT_DROP_PRICE })).to.not.reverted;
                await expect(Store.mint(dropId, 4, { value: DEFAULT_DROP_PRICE })).to.not.reverted;

                await expect(Store.mint(dropId, 5, { value: DEFAULT_DROP_PRICE })).revertedWithCustomError(
                    Drop,
                    InvalidVersionId
                );

                ({ Drop, dropId } = await createDrop({ versions: 1 }));

                await expect(Store.mint(dropId, 0, { value: DEFAULT_DROP_PRICE })).to.not.reverted;

                await expect(Store.mint(dropId, 1, { value: DEFAULT_DROP_PRICE })).revertedWithCustomError(
                    Drop,
                    InvalidVersionId
                );
            });

            it('minting with an invalid value should revert', async () => {
                ({ Drop, dropId } = await createDrop({}));

                Drop = (await Contracts.Drop.attach(await Store.drop(DEFAULT_DROP_ID))).connect(user);

                await expect(Store.mint(dropId, DEFAULT_DRIP_VERSION)).revertedWithCustomError(Drop, InvalidPrice);
                await expect(Store.mint(dropId, DEFAULT_DRIP_VERSION, { value: toEth('0') })).revertedWithCustomError(
                    Drop,
                    InvalidPrice
                );
                await expect(Store.mint(dropId, DEFAULT_DRIP_VERSION, { value: toEth('234') })).revertedWithCustomError(
                    Drop,
                    InvalidPrice
                );
            });
        });

        describe('mutate', () => {
            let Drop: Drop;
            let dropId: BigNumber;

            let tokenMutating: TestERC721;

            before(async () => {
                Store = await Contracts.Store.deploy();
            });

            describe('basic checks', () => {
                beforeEach(async () => {
                    ({ Drop, dropId } = await createDrop({}));

                    Store = Store.connect(user);
                    tokenMutating = (await Contracts.TestERC721.deploy()).connect(user);
                });

                it("should revert if drip doesn't exist", async () => {
                    await tokenMutating.mint();

                    await expect(Store.mutate(dropId, 0, tokenMutating.address, 0)).to.revertedWithCustomError(
                        Drop,
                        InvalidDripOwner
                    );
                });

                it("should revert if user doesn't own the drip", async () => {
                    await tokenMutating.mint();
                    await Store.connect(owner).mint(dropId, DEFAULT_DRIP_VERSION, {
                        value: DEFAULT_DROP_PRICE
                    });

                    await expect(
                        Store.mutate(dropId, DEFAULT_DRIP_ID, tokenMutating.address, 0)
                    ).to.be.revertedWithCustomError(Drop, InvalidDripOwner);
                });

                it("should revert if user doesn't own the nft", async () => {
                    await tokenMutating.connect(owner).mint();
                    await Store.mint(dropId, DEFAULT_DRIP_VERSION, {
                        value: DEFAULT_DROP_PRICE
                    });

                    await expect(
                        Store.mutate(dropId, DEFAULT_DRIP_ID, tokenMutating.address, 0)
                    ).to.revertedWithCustomError(Drop, InvalidTokenOwner);
                });

                it('should revert if already mutated', async () => {
                    await tokenMutating.mint();
                    await Store.mint(dropId, DEFAULT_DRIP_VERSION, {
                        value: DEFAULT_DROP_PRICE
                    });

                    await Store.mutate(dropId, DEFAULT_DRIP_ID, tokenMutating.address, 0);
                    await expect(Store.mutate(dropId, 0, tokenMutating.address, 0)).to.be.revertedWithCustomError(
                        Drop,
                        AlreadyMutated
                    );
                });

                it('should mutate', async () => {
                    await tokenMutating.mint();
                    await Store.mint(dropId, DEFAULT_DRIP_VERSION, {
                        value: DEFAULT_DROP_PRICE
                    });

                    const tx = await Store.mutate(dropId, DEFAULT_DRIP_ID, tokenMutating.address, 0);

                    await expect(tx).to.emit(Store, 'Mutated').withArgs(dropId, DEFAULT_DRIP_ID);

                    const drip = await Store.dripInfo(dropId, DEFAULT_DRIP_ID);

                    expect(drip.drip.status).to.equal(DripStatus.MUTATED);
                    expect(drip.drip.mutation.tokenContract).to.equal(tokenMutating.address);
                    expect(drip.drip.mutation.tokenId).to.equal(0);
                });
            });
        });
    });
});
