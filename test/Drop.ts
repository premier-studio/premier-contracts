import { expect } from 'chai';
import { BigNumber, ContractReceipt, ContractTransaction } from 'ethers';
import { ethers } from 'hardhat';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import Contracts from '@premier-contracts/components/contracts';
import {
    CryptoPunksMarket,
    Drop,
    ERC721,
    TestERC20,
    TestERC721,
    TestTokenInterface,
    UnusualNFT
} from '@premier-contracts/typechain';
import { DripStatus } from '@premier-contracts/types';

const { parseEther: toEth } = ethers.utils;
const { AddressZero } = ethers.constants;

// Errors

const AlreadyMutated = 'AlreadyMutated';

const InvalidMaxSupply = 'InvalidMaxSupply';
const InvalidVersions = 'InvalidVersions';
const InvalidVersionId = 'InvalidVersionId';
const InvalidDripId = 'InvalidDripId';
const InvalidPrice = 'InvalidPrice';
const InvalidDripOwner = 'InvalidDripOwner';
const InvalidTokenOwner = 'InvalidTokenOwner';

const MaxSupplyReached = 'MaxSupplyReached';

const UnsupportedTokenContract = 'UnsupportedTokenContract';

// Default values

const DEFAULT_DROP_ID = 0;
const DEFAULT_DROP_MAX_SUPPLY = 1;
const DEFAULT_DROP_PRICE = toEth('0');
const DEFAULT_DROP_VERSIONS = 1;

const DEFAULT_DRIP_VERSION = 0;

const DEFAULT_URI = 'https://google.com';

// Invalid values

const INVALID_DROP_VERSIONS = 0;
const INVALID_DROP_MAX_SUPPLY = 0;

const deployDrop = async (obj?: { dropId?: number; maxSupply?: number; price?: BigNumber; versions?: number }) => {
    return await Contracts.Drop.deploy(
        obj?.dropId ?? DEFAULT_DROP_ID,
        obj?.maxSupply ?? DEFAULT_DROP_MAX_SUPPLY,
        obj?.price ?? DEFAULT_DROP_PRICE,
        obj?.versions ?? DEFAULT_DROP_VERSIONS
    );
};

describe('Drop', () => {
    let owner: SignerWithAddress, user: SignerWithAddress;

    let Drop: Drop;

    before(async () => {
        [owner, user] = await ethers.getSigners();

        Drop = await deployDrop();
    });

    describe('construction', () => {
        let dropId = 0;
        for (const maxSupply of [10, 200, 100000]) {
            for (const price of [toEth('0.05'), toEth('0.25'), toEth('2.5')]) {
                for (const versions of [1, 5, 10]) {
                    context(`with maxSupply: ${maxSupply}, price: ${price}, versions: ${versions}`, () => {
                        before(async () => {
                            Drop = await deployDrop({ dropId, maxSupply, price, versions });
                        });

                        after(async () => {
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

        it('should revert with invalid max supply', async () => {
            await expect(
                Contracts.Drop.deploy(
                    DEFAULT_DROP_ID,
                    INVALID_DROP_MAX_SUPPLY,
                    DEFAULT_DROP_PRICE,
                    DEFAULT_DROP_VERSIONS
                )
            ).revertedWith(InvalidMaxSupply);
        });

        it('should revert with invalid version', async () => {
            await expect(
                Contracts.Drop.deploy(
                    DEFAULT_DROP_ID,
                    DEFAULT_DROP_MAX_SUPPLY,
                    DEFAULT_DROP_PRICE,
                    INVALID_DROP_VERSIONS
                )
            ).revertedWith(InvalidVersions);
        });
    });

    describe('URI', () => {
        before(async () => {
            Drop = await deployDrop();
        });

        context('dropURI', () => {
            it('should properly set URI variable', async () => {
                await Drop.setDropURI(DEFAULT_URI);

                expect(await Drop.dropURI()).equal(DEFAULT_URI);
            });

            context('permission', () => {
                it('should revert when not allowed to set', async () => {
                    await expect(Drop.connect(user).setDropURI(DEFAULT_URI)).to.revertedWith(
                        'Ownable: caller is not the owner'
                    );
                });
            });
        });

        context('contractURI', () => {
            it('should properly set URI variable', async () => {
                await Drop.setContractURI(DEFAULT_URI);

                expect(await Drop.contractURI()).equal(DEFAULT_URI);
            });

            context('permission', () => {
                it('should revert when not allowed to set', async () => {
                    await expect(Drop.connect(user).setContractURI(DEFAULT_URI)).to.revertedWith(
                        'Ownable: caller is not the owner'
                    );
                });
            });
        });

        context('baseURI', () => {
            it('should properly set URI variable', async () => {
                await Drop.setBaseURI(DEFAULT_URI);

                expect(await Drop.baseURI()).equal(DEFAULT_URI);
            });

            context('permission', () => {
                it('should revert when not allowed to set', async () => {
                    await expect(Drop.connect(user).setBaseURI(DEFAULT_URI)).to.revertedWith(
                        'Ownable: caller is not the owner'
                    );
                });
            });
        });
    });

    context('contract interface', () => {
        let testToken: ERC721;
        let testInterface: TestTokenInterface;

        beforeEach(async () => {
            testToken = await Contracts.ERC721.deploy('SYMBOL', 'NAME');
            testInterface = await Contracts.TestTokenInterface.deploy(testToken.address);
        });

        it('initial token contract interface should be nil', async () => {
            expect(await Drop.getTokenContractInterface(testToken.address)).to.equal(AddressZero);
        });

        it('should set properly', async () => {
            await Drop.setTokenContractInterface(testToken.address, testInterface.address);
            expect(await Drop.getTokenContractInterface(testToken.address)).to.equal(testInterface.address);
        });

        context('permission', () => {
            it('should revert when not allowed to set', async () => {
                await expect(
                    Drop.connect(user).setTokenContractInterface(testToken.address, testInterface.address)
                ).to.revertedWith('Ownable: caller is not the owner');
            });
        });
    });

    describe('drip', () => {
        before(async () => {
            Drop = await deployDrop();
        });

        it('accessing non existing drip should revert', async () => {
            await expect(Drop.drip(0)).revertedWith(InvalidDripId);
            await expect(Drop.drip(1)).revertedWith(InvalidDripId);
            await expect(Drop.drip(10)).revertedWith(InvalidDripId);
        });

        it('should properly retrieve a minted drip', async () => {
            await Drop.mint(DEFAULT_DRIP_VERSION);

            const drip = await Drop.drip(0);
            expect(drip.version).equal(0);
        });
    });

    describe('withdraw', () => {
        const MINT_NB = 3;
        const MINT_PRICE = toEth('1');

        beforeEach(async () => {
            Drop = await deployDrop({ maxSupply: MINT_NB, price: MINT_PRICE });

            for (let i = 0; i < MINT_NB; i++) {
                await Drop.mint(DEFAULT_DRIP_VERSION, { value: MINT_PRICE });
            }
        });

        it('should widthdraw all fund', async () => {
            await Drop.withdraw();

            expect(await ethers.provider.getBalance(Drop.address)).to.equal(0);
        });

        it("should increment owner's balance", async () => {
            const snapshotOwnerBalance = await owner.getBalance();
            const snapshotDropBalance = await ethers.provider.getBalance(Drop.address);

            const res = await (await Drop.withdraw()).wait();
            expect(await owner.getBalance()).to.be.equal(
                snapshotOwnerBalance.add(snapshotDropBalance).sub(res.cumulativeGasUsed.mul(res.effectiveGasPrice))
            );
        });

        it('should emit event on withdraw', async () => {
            const snapshotDropBalance = await ethers.provider.getBalance(Drop.address);

            const res = await Drop.withdraw();

            expect(res).to.emit(Drop, 'Withdrawn').withArgs(snapshotDropBalance);
        });

        context('permission', () => {
            it('should revert when not allowed to withdraw', async () => {
                await expect(Drop.connect(user).withdraw()).to.revertedWith('Ownable: caller is not the owner');
            });
        });
    });

    describe('minting', () => {
        const mint = async (dripId: number, version: number, value: BigNumber) => {
            let res: ContractTransaction;

            it(`should mint properly`, async () => {
                res = await Drop.mint(version, { value });
            });

            it(`should emit event on mint`, async () => {
                expect(res).to.emit(Drop, 'Withdrawn').withArgs(dripId);
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

                expect(drip.version).equal(version);
                expect(drip.status).equal(DripStatus.DEFAULT);
                expect(drip.mutation.tokenContract).equal(AddressZero);
                expect(drip.mutation.tokenId).equal(0);
            });
        };

        for (const maxSupply of [3, 5]) {
            for (const price of [toEth('0'), toEth('0.05'), toEth('2.5')]) {
                for (const versions of [5, 10]) {
                    context(`with price: ${price}, maxSupply: ${maxSupply}`, () => {
                        before(async () => {
                            Drop = (await deployDrop({ maxSupply, price, versions })).connect(user);
                        });

                        for (let dripId = 0; dripId < maxSupply; dripId++) {
                            mint(dripId, 0, price);
                        }

                        it(`should revert when max supply has been reached`, async () => {
                            await expect(Drop.mint(DEFAULT_DRIP_VERSION)).to.be.revertedWith(MaxSupplyReached);
                        });
                    });
                }
            }
        }

        it('minting above max supply should revert', async () => {
            Drop = await deployDrop();

            await Drop.mint(DEFAULT_DRIP_VERSION);
            await expect(Drop.mint(DEFAULT_DRIP_VERSION)).revertedWith(MaxSupplyReached);
        });

        it('minting with an invalid version should revert', async () => {
            Drop = await deployDrop({ maxSupply: 100, versions: 5 });

            await Drop.mint(0);
            await Drop.mint(1);
            await Drop.mint(2);
            await Drop.mint(3);
            await Drop.mint(4);

            await expect(Drop.mint(5)).revertedWith(InvalidVersionId);
        });

        it('minting with an invalid value should revert', async () => {
            Drop = await deployDrop({ price: toEth('1') });

            await expect(Drop.mint(DEFAULT_DRIP_VERSION)).revertedWith(InvalidPrice);
        });
    });

    describe('mutating', () => {
        let tokenMutating: TestERC721;

        describe('basic checks', () => {
            beforeEach(async () => {
                tokenMutating = (await Contracts.TestERC721.deploy()).connect(user);
                Drop = (await deployDrop({ maxSupply: 100 })).connect(user);

                await tokenMutating.mint();
                await Drop.mint(DEFAULT_DRIP_VERSION);
            });

            it("should revert if drip doesn't exist", async () => {
                await expect(Drop.mutate(1, tokenMutating.address, 0)).to.revertedWith(InvalidDripId);
            });

            it("should revert if user doesn't own the drip", async () => {
                await Drop.connect(owner).mint(DEFAULT_DRIP_VERSION);
                await expect(Drop.mutate(1, tokenMutating.address, 0)).to.revertedWith(InvalidDripOwner);
            });

            it('should revert if already mutated', async () => {
                await Drop.mutate(0, tokenMutating.address, 0);
                await expect(Drop.mutate(0, tokenMutating.address, 0)).to.revertedWith(AlreadyMutated);
            });
        });

        describe('ERC721 token', () => {
            beforeEach(async () => {
                tokenMutating = (await Contracts.TestERC721.deploy()).connect(user);
                Drop = (await deployDrop({ maxSupply: 100 })).connect(user);

                await tokenMutating.mint();
                await Drop.mint(DEFAULT_DRIP_VERSION);
            });

            it("should revert if user doesn't own the nft", async () => {
                await tokenMutating.transferFrom(user.address, owner.address, 0);

                await expect(Drop.mutate(0, tokenMutating.address, 0)).to.revertedWith(InvalidTokenOwner);
            });

            it('should mutate', async () => {
                await Drop.mutate(0, tokenMutating.address, 0);

                const drip = await Drop.drip(0);

                expect(drip.status).to.equal(DripStatus.MUTATED);
                expect(drip.mutation.tokenContract).to.equal(tokenMutating.address);
                expect(drip.mutation.tokenId).to.equal(0);
            });
        });

        describe('non-ERC721 but has supportsInterface function', () => {
            let tokenMutating: TestERC20;

            beforeEach(async () => {
                tokenMutating = (await Contracts.TestERC20.deploy()).connect(user);
                Drop = (await deployDrop({ maxSupply: 100 })).connect(user);

                await tokenMutating.mint();
                await Drop.mint(DEFAULT_DRIP_VERSION);
            });

            it('should revert', async () => {
                await expect(Drop.mutate(0, tokenMutating.address, 0)).to.revertedWith(UnsupportedTokenContract);
            });
        });

        describe('custom token', () => {
            let testTokenInterface: TestTokenInterface;
            let unsualNFT: UnusualNFT;

            beforeEach(async () => {
                unsualNFT = await Contracts.UnusualNFT.deploy();
            });

            it("should revert if contract interface hasn't been registered", async () => {
                await Drop.mint(DEFAULT_DRIP_VERSION);
                await expect(Drop.mutate(0, unsualNFT.address, 0)).to.revertedWith(UnsupportedTokenContract);
            });

            it("should revert if user doesn't own the nft", async () => {
                testTokenInterface = await Contracts.TestTokenInterface.deploy(unsualNFT.address);

                await Drop.connect(owner).setTokenContractInterface(unsualNFT.address, testTokenInterface.address);

                await Drop.mint(DEFAULT_DRIP_VERSION);
                await expect(Drop.mutate(0, unsualNFT.address, 0)).to.revertedWith(InvalidTokenOwner);
            });

            it('should mutate', async () => {
                testTokenInterface = await Contracts.TestTokenInterface.deploy(unsualNFT.address);
                await unsualNFT.setOwner(0, user.address);

                await Drop.connect(owner).setTokenContractInterface(unsualNFT.address, testTokenInterface.address);

                await Drop.mint(DEFAULT_DRIP_VERSION);
                Drop.mutate(0, unsualNFT.address, 0);
            });
        });

        describe('specifc interfaces', () => {
            const TEST_TOKEN = 10;

            context('CryptoPunks', () => {
                let cryptoPunksMarket: CryptoPunksMarket;

                beforeEach(async () => {
                    tokenMutating = (await Contracts.TestERC721.deploy()).connect(user);
                    cryptoPunksMarket = await Contracts.CryptoPunksMarket.deploy();
                    Drop = (await deployDrop({ maxSupply: 100 })).connect(user);

                    await tokenMutating.mint();
                    await Drop.mint(DEFAULT_DRIP_VERSION);
                    await cryptoPunksMarket.setInitialOwner(user.address, TEST_TOKEN);
                });

                it('should revert when no interface has been set', async () => {
                    await expect(Drop.mutate(0, cryptoPunksMarket.address, TEST_TOKEN)).to.revertedWith(
                        UnsupportedTokenContract
                    );
                });

                it('should revert when interface returns invalid owner', async () => {
                    const cryptoPunksInterface = await Contracts.CryptopunksInterface.deploy(cryptoPunksMarket.address);
                    await Drop.connect(owner).setTokenContractInterface(
                        cryptoPunksMarket.address,
                        cryptoPunksInterface.address
                    );

                    await expect(Drop.mutate(0, cryptoPunksMarket.address, 9)).to.be.revertedWith(InvalidTokenOwner);
                });

                it('should not revert when interface has been set', async () => {
                    const cryptoPunksInterface = await Contracts.CryptopunksInterface.deploy(cryptoPunksMarket.address);

                    await Drop.connect(owner).setTokenContractInterface(
                        cryptoPunksMarket.address,
                        cryptoPunksInterface.address
                    );
                    await Drop.mutate(0, cryptoPunksMarket.address, TEST_TOKEN);

                    const drip = await Drop.drip(0);

                    expect(drip.status).to.equal(DripStatus.MUTATED);
                    expect(drip.mutation.tokenContract).to.equal(cryptoPunksMarket.address);
                    expect(drip.mutation.tokenId).to.equal(TEST_TOKEN);
                });
            });
        });
    });
});
