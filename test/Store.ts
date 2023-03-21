import { expect } from 'chai';
import { BigNumber, ContractTransaction } from 'ethers';
import { ethers } from 'hardhat';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import Contracts from '@premier-contracts/components/contracts';
import { Store } from '@premier-contracts/typechain';

const { parseEther: toEth } = ethers.utils;

const DEFAULT_DROP_MAX_SUPPLY = 1;
const DEFAULT_DROP_PRICE = toEth('0');
const DEFAULT_DROP_VERSIONS = 1;

describe('Store', () => {
    let owner: SignerWithAddress, user: SignerWithAddress;

    let Store: Store;

    before(async () => {
        [owner, user] = await ethers.getSigners();
    });

    describe('construction', () => {
        before(async () => {
            Store = await Contracts.Store.deploy();
        });

        it('initial total supply should be properly initialized', async () => {
            expect(await Store.totalSupply()).to.equal(0);
        });
    });

    describe('drop creation', () => {
        before(async () => {
            Store = await Contracts.Store.deploy();
        });

        const createDrop = (maxSupply: number, price: BigNumber, versions: number, dropId: number) => {
            let snapshotDropTotalSupply: BigNumber;
            let res: ContractTransaction;

            before(async () => {
                snapshotDropTotalSupply = await Store.totalSupply();
            });

            it('should create drop', async () => {
                res = await Store.createDrop(maxSupply, price, versions);
            });

            it('should emit event upon creation', async () => {
                await expect(res).to.emit(Store, 'DropCreated').withArgs(dropId);
            });

            it('total supply should be updated', async () => {
                expect(await Store.totalSupply()).to.equal(snapshotDropTotalSupply.add(1));
            });

            it('created drop should be properly initialized', async () => {
                const drop = await Contracts.Drop.attach(await Store.drop(dropId));

                expect(await drop.maxSupply()).to.equal(maxSupply);
                expect(await drop.price()).to.equal(price);
                expect(await drop.versions()).to.equal(versions);
                expect(await drop.dropId()).to.equal(dropId);
                expect(await drop.owner()).to.equal(owner.address);
            });
        };

        let dropId = 0;
        for (const maxSupply of [1, 5, 100]) {
            for (const price of [toEth('0.05'), toEth('0.25'), toEth('2.5')]) {
                for (const versions of [1, 5, 10]) {
                    context(`with maxSupply: ${maxSupply}, price: ${price}`, () => {
                        createDrop(maxSupply, price, versions, dropId);
                        dropId++;
                    });
                }
            }
        }

        it('should revert when not allowed to create a drop', async () => {
            await expect(
                Store.connect(user).createDrop(DEFAULT_DROP_MAX_SUPPLY, DEFAULT_DROP_PRICE, DEFAULT_DROP_VERSIONS)
            ).to.revertedWith('Ownable: caller is not the owner');
        });
    });
});
