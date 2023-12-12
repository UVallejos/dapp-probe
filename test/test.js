var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
var { ethers } = require("hardhat");
var { time } = require("@nomicfoundation/hardhat-network-helpers");
var { MerkleTree } = require("merkletreejs");
var uniswapRouter = require('@uniswap/v2-periphery/build/UniswapV2Router02.json')

const { getRole, deploySC, deploySCNoUp, ex, pEth } = require("../utils");
const { getRootFromMT } = require("../utils/merkleTree");

const MINTER_ROLE = getRole("MINTER_ROLE");
const PAUSER_ROLE = getRole("PAUSER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

//npx hardhat test test/test.js

// 00 horas del 30 de septiembre del 2023 GMT
var startDate = 1696032000;

function hashToken(id, address) {
    return Buffer.from(
      ethers
        .solidityPackedKeccak256(["uint256", "address"], [id, address])
        .slice(2),
      "hex"
    );
  }

describe("CuyCollectionNft Testing", async function () {
    let owner, alice, bob, carl, deysi, estefan; 
    const cuyNFTName = 'CuyCollection';
    let cuyNftContract;
    let merkleTree;

    before(async () => {
        [owner, alice, bob, carl, deysi, estefan] = await ethers.getSigners();
        cuyNftContract = await deploySC(cuyNFTName);
        const hashes = [owner, alice, bob, carl, deysi, estefan].map((value, index) => (hashToken(1_000 + index, value.address)))
        merkleTree = new MerkleTree(hashes, ethers.keccak256, {
          sortPairs: true,
        });
      })

    it('safeMint protegido por MINTER_ROLE', async () => {
        const safeMint = cuyNftContract.connect(alice).safeMint;
        const tokenId = 10;
        await expect(
          safeMint(alice.address, tokenId)
        ).to.revertedWith(
          `AccessControl: account ${alice.address.toLowerCase()} is missing role ${MINTER_ROLE}`
        )
      })

      it('safeMint no puede mintear id no permitido', async () => {
        await cuyNftContract.connect(owner).grantRole(MINTER_ROLE, alice.address)
        const safeMint = cuyNftContract.connect(alice).safeMint;
        const tokenId = 10000;
        await expect(
          safeMint(alice.address, tokenId)
        ).to.revertedWith(
          `ID Invalido`
        )
      })

      it('SafeMint Emite el evento Transfer asignando MINTER_ROLE', async () => {
        await cuyNftContract.connect(owner).grantRole(MINTER_ROLE, alice.address)
        const safeMint = cuyNftContract.connect(alice).safeMint;
        const tokenId = 100;
        await expect(safeMint(alice.address, tokenId)).to.emit(cuyNftContract, 'Transfer')
        .withArgs(ethers.ZeroAddress, alice.address, tokenId)
        expect(
          await cuyNftContract.balanceOf(alice.address)
        ).to.equal(1)
        expect(
          await cuyNftContract.ownerOf(tokenId)
        ).to.equal(alice.address)
      })

      it('safeMintWhiteList: Wallet fuera de WhiteList', async () => {
        const tokenId = 1004
        
        const safeMintWhiteList = cuyNftContract.connect(alice).safeMintWhiteList;
    
        const proofs = merkleTree.getHexProof(hashToken(tokenId, alice.address));
        await expect(
          safeMintWhiteList(bob, tokenId, proofs)
        ).to.revertedWith(
          'No eres parte de la WhiteList'
        )
     })

     it('safeMintWhiteList con proofs', async () => {
        const tokenId = 1002
        await cuyNftContract.connect(owner).actualizarRoot(merkleTree.getHexRoot())
        const safeMintWhiteList = cuyNftContract.connect(bob).safeMintWhiteList;
        const proofs = merkleTree.getHexProof(hashToken(tokenId, bob.address))
        await expect(
          safeMintWhiteList(bob, 1002, proofs)
        ).to.emit(cuyNftContract, 'Transfer')
        .withArgs(ethers.ZeroAddress, bob.address, tokenId)
      })

      it('actualizarRoot debe cambiar el Root', async () => {
        const root = getRootFromMT()
        await cuyNftContract.connect(owner).actualizarRoot(root);
        expect(
          await cuyNftContract.root()
        ).to.equal(root)
      })

      it('buyBack debe revertir para id inferior a 1000', async () => {
        await cuyNftContract.connect(owner).grantRole(MINTER_ROLE, alice.address)
        const safeMint = cuyNftContract.connect(alice).safeMint;
        const tokenId = 105;
        await safeMint(alice.address, tokenId);
        
        await expect(
          cuyNftContract.connect(alice).buyBack(tokenId)
        ).to.revertedWith('No se puede Quemar este NFT')
      })
    
      it('buyBack debe emitir Burn event', async () => {
        const tokenId = 1003;
        await cuyNftContract.connect(owner).actualizarRoot(merkleTree.getHexRoot())
        const safeMintWhiteList = cuyNftContract.connect(carl).safeMintWhiteList;
        const proofs = merkleTree.getHexProof(hashToken(tokenId, carl.address))
        await safeMintWhiteList(carl.address, tokenId, proofs);
        await expect(
          cuyNftContract.connect(carl).buyBack(tokenId)
        ).to.emit(cuyNftContract, 'Burn')
        .withArgs(carl.address, tokenId)
      })
    
      it('TokenURI not blank', async () => {
        const tokenURI = cuyNftContract.tokenURI;
        const tokenId = 100;
        expect(
          await tokenURI(tokenId)
        ).to.equal(
          `ipfs://QmUNrxeZyaGYPxK8zK8P3YpmkGAPAV25BtD2Rrdpc74qiw/${tokenId}`
        )
      })
    
      it('safeMint protegido por PAUSER_ROLE', async () => {
        await cuyNftContract.connect(owner).grantRole(MINTER_ROLE, alice.address)
        const safeMint = cuyNftContract.connect(alice).safeMint;
        const tokenId = 100;
        await cuyNftContract.connect(owner).pause()
        await expect(
          safeMint(alice.address, tokenId)
        ).to.revertedWith(
          `Pausable: paused`
        )
    
        await cuyNftContract.connect(owner).unpause()
        expect(
          await cuyNftContract.paused()
        ).to.equal(false)
      })
    
    

});

describe("Public Sale testing", async function () {
    
    async function deployFixture() {
        const publicSaleName = 'PublicSale'
        const [owner, alice, bob, carl] = await ethers.getSigners();
        const uniswap = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
        
        const BBitesTokenName = "BBitesToken"
        const BBitesToken = await deploySC(BBitesTokenName);
        const bbitesAddress = await BBitesToken.getAddress();
        
        const usdCoinName = "USDCoin";
        const usdContract = await deploySCNoUp(usdCoinName);
        const usdAddress = await usdContract.getAddress();
        
        const publicSaleContract = await deploySC(publicSaleName, [
        uniswap,
        usdAddress,
        bbitesAddress
        ]);
        
        const uniswapRouterContract = new ethers.Contract(uniswap, uniswapRouter.abi, owner)
        const bbitesAmount = await BBitesToken.balanceOf(owner)
        const usdcAmount = await usdContract.balanceOf(owner)
        await BBitesToken.approve(uniswap, bbitesAmount)
        await usdContract.approve(uniswap, usdcAmount)
        /**
         * Añadimos Liquidez
         */
        await uniswapRouterContract.addLiquidity(
          bbitesAddress,
          usdAddress,
          bbitesAmount,
          usdcAmount,
          bbitesAmount,
          usdcAmount,
          owner.address,
          new Date().getTime() + 600_000
        );
        const tokenAmount = pEth('100000');
        await BBitesToken.mint(owner.address, tokenAmount)
        await usdContract.mint(owner.address, tokenAmount);
        return {publicSaleContract, BBitesToken, usdContract, owner, alice, bob, carl, uniswap}
      }

      it('Compra con BBTokens, NFT Id 5', async () => {
        const {publicSaleContract, BBitesToken, owner}  = await loadFixture(deployFixture)

        const tokenId = 5, tokenAmount = await BBitesToken.balanceOf(owner.address);
        
        await BBitesToken.approve(await publicSaleContract.getAddress(), tokenAmount)
        await expect(
          publicSaleContract.connect(owner).purchaseWithTokens(tokenId)
        ).to.emit(publicSaleContract, 'PurchaseNftWithId')
        .withArgs(owner.address, tokenId)
        expect(await BBitesToken.balanceOf(owner.address)).to.equal(tokenAmount - pEth('1000'))
      })
    
      it('Comprar con BBTokens, NFT Id 250', async () => {
        const {publicSaleContract, BBitesToken, owner}  = await loadFixture(deployFixture)
        const tokenId = 250, tokenAmount = await BBitesToken.balanceOf(owner.address);
        await BBitesToken.approve(await publicSaleContract.getAddress(), tokenAmount)
        await expect(
          publicSaleContract.connect(owner).purchaseWithTokens(tokenId)
        ).to.emit(publicSaleContract, 'PurchaseNftWithId')
        .withArgs(owner.address, tokenId)
        expect(await BBitesToken.balanceOf(owner.address)).to.equal(tokenAmount - pEth((20*tokenId).toString()))
      })
    

      it('Comprar con BBTokens, NFT Id 550', async () => {

        const {publicSaleContract, BBitesToken, owner}  = await loadFixture(deployFixture)

        const tokenId = 550;
        const tokenAmount = await BBitesToken.balanceOf(owner.address);

        await BBitesToken.approve(await publicSaleContract.getAddress(), tokenAmount)


        await expect(
          publicSaleContract.connect(owner).purchaseWithTokens(tokenId)
        ).to.emit(publicSaleContract, 'PurchaseNftWithId')
        .withArgs(owner.address, tokenId)
        const calculatedPrice = 10_000 + 2_000 * Math.floor((new Date().getTime() / 1000 - startDate) / (24*60*60));
        const price = Math.min(90_000, calculatedPrice)
        expect(await BBitesToken.balanceOf(owner.address)).to.equal(tokenAmount - pEth((price).toString()))
      })
    
      it('Comprar con BBTokens, NFT Id 550 con incremento de 30 días ', async () => {

        const {publicSaleContract, BBitesToken, owner}  = await loadFixture(deployFixture)

        const tokenId = 550, tokenAmount = await BBitesToken.balanceOf(owner.address);

        await BBitesToken.approve(await publicSaleContract.getAddress(), tokenAmount)

        await time.increase(30*24*60*60 + 1)
        await expect(
          publicSaleContract.connect(owner).purchaseWithTokens(tokenId)
        ).to.emit(publicSaleContract, 'PurchaseNftWithId')
        .withArgs(owner.address, tokenId)
        const price = 90_000;
        expect(await BBitesToken.balanceOf(owner.address)).to.equal(tokenAmount - pEth((price).toString()))
      })
    
      it('Compra no disponible con BBTK, ID Fuera de Rango Permitido', async () => {
        const {publicSaleContract, BBitesToken, owner}  = await loadFixture(deployFixture)
        const tokenId = 800
        const tokenAmount = await BBitesToken.balanceOf(owner.address);
        await BBitesToken.approve(await publicSaleContract.getAddress(), tokenAmount)
        await expect(
          publicSaleContract.connect(owner).purchaseWithTokens(tokenId)
        ).to.revertedWith(
          'ID Fuera de Rango Permitido'
        )
      })
    
      it('Compra no disponible con BBTK, NFT ya se ha minteado', async () => {
        const {publicSaleContract, BBitesToken, owner, alice}  = await loadFixture(deployFixture)
        const tokenId = 5 
        const tokenAmount = await BBitesToken.balanceOf(owner.address);
        expect(await BBitesToken.balanceOf(owner.address)).to.equal(tokenAmount)

        await BBitesToken.approve(await publicSaleContract.getAddress(), tokenAmount)
        await publicSaleContract.purchaseWithTokens(tokenId)
        
        await BBitesToken.mint(alice.address, tokenAmount)
        await BBitesToken.connect(alice).approve(await publicSaleContract.getAddress(), tokenAmount)
    
        await expect(
          publicSaleContract.connect(alice).purchaseWithTokens(tokenId)
        ).to.revertedWith(
          'Este NFT ya se ha minteado'
        )
      })

      it('Comprar NFT con USDC', async () => {
        const {publicSaleContract, owner, usdContract}  = await loadFixture(deployFixture)
        const tokenId = 5 
        const tokenAmount = await usdContract.balanceOf(owner.address);
        await usdContract.approve(await publicSaleContract.getAddress(), tokenAmount)
        await expect(
          publicSaleContract.purchaseWithUSDC(tokenId, pEth((10_000).toString()))
        ).to.emit(publicSaleContract, 'PurchaseNftWithId')
        .withArgs(owner.address, tokenId)
    
        expect(await usdContract.balanceOf(owner.address)).to.lessThan(pEth('100000'))
      })
    
      it('Comprar NFT con Ether', async () => {
        const {publicSaleContract, owner}  = await loadFixture(deployFixture)
        const tokenId = 800 
        const balance = await ethers.provider.getBalance(owner.address);
        await expect(
          publicSaleContract.purchaseWithEtherAndId(tokenId, {value: pEth('0.05')})
        ).to.emit(publicSaleContract, 'PurchaseNftWithId')
        .withArgs(owner.address, tokenId)
    
        expect(balance - await ethers.provider.getBalance(owner.address)).to.greaterThanOrEqual(pEth('0.01'))
      })
    
      it('Compra NFT Random Incorrecto', async () => {
        const {publicSaleContract}  = await loadFixture(deployFixture)
        await expect(
          publicSaleContract.depositEthForARandomNft({value: pEth('0.05')})
        ).to.be.revertedWith('Cantidad Incorrecta de Ether para Comprar')
      })
    
      it('Compra NFT Random Correcto', async () => {
        const {publicSaleContract, owner}  = await loadFixture(deployFixture)
        await expect(
          publicSaleContract.depositEthForARandomNft({value: pEth('0.01')})
        ).to.emit(publicSaleContract, 'PurchaseNftWithId')
      })
    
      it('Enviar Ether al contrato para obtener NFT Random', async () => {
        const {publicSaleContract, owner}  = await loadFixture(deployFixture)
        await expect(
          owner.sendTransaction({
            to: await publicSaleContract.getAddress(),
            value: pEth('0.01')
          })
        ).to.emit(publicSaleContract, 'PurchaseNftWithId')
      })
    
      it('Withdraw ether Correcto', async () => {
        const {publicSaleContract, owner, alice}  = await loadFixture(deployFixture)
        await expect(
          alice.sendTransaction({
            to: await publicSaleContract.getAddress(),
            value: pEth('0.01')
          })
        ).to.emit(publicSaleContract, 'PurchaseNftWithId')
        expect(await ethers.provider.getBalance(await publicSaleContract.getAddress()))
        .to.equals(pEth('0.01'))
        await publicSaleContract.connect(owner).withdrawEther()
        expect(await ethers.provider.getBalance(await publicSaleContract.getAddress()))
        .to.equals(pEth('0'))
      })
    
      it('Withdraw ether Fallido', async () => {
        const {publicSaleContract, owner, alice}  = await loadFixture(deployFixture)
        await expect(
          alice.sendTransaction({
            to: await publicSaleContract.getAddress(),
            value: pEth('0.01')
          })
        ).to.emit(publicSaleContract, 'PurchaseNftWithId')
        expect(await ethers.provider.getBalance(await publicSaleContract.getAddress()))
        .to.equals(pEth('0.01'))
        await expect(
          publicSaleContract.connect(alice).withdrawEther()
        ).to.revertedWith(
          `AccessControl: account ${alice.address.toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`
        )
      })
    
      it('Withdraw tokens', async () => {
        const {publicSaleContract, BBitesToken, owner, alice}  = await loadFixture(deployFixture)
        const tokenId = 5, tokenAmount = await BBitesToken.balanceOf(owner.address);;
        await BBitesToken.approve(await publicSaleContract.getAddress(), tokenAmount)
        await expect(
          publicSaleContract.connect(owner).purchaseWithTokens(tokenId)
        ).to.emit(publicSaleContract, 'PurchaseNftWithId')
        .withArgs(owner.address, tokenId)
        expect(await BBitesToken.balanceOf(owner.address)).to.equal(tokenAmount - pEth('1000'))
    
        await publicSaleContract.withdrawTokens()
        expect(await BBitesToken.balanceOf(owner.address)).to.equal(tokenAmount);
      })
    
      it('Paused & Unpause Contract', async () => {
        const {publicSaleContract, owner, alice}  = await loadFixture(deployFixture)
        await publicSaleContract.connect(owner).grantRole(PAUSER_ROLE, alice.address)
        await publicSaleContract.connect(alice).pause()
        expect(
          await publicSaleContract.paused()
        ).to.equal(true)
        await publicSaleContract.connect(alice).unpause()
        expect(
          await publicSaleContract.paused()
        ).to.equal(false)
      })
      
    
      it('Addresses', async () => {
        const {publicSaleContract, BBitesToken, usdContract, uniswap}  = await loadFixture(deployFixture)
        expect(
          await publicSaleContract.getUSDCAddress()
        ).to.equal(await usdContract.getAddress())
    
        expect(
          await publicSaleContract.getTokenAddress()
        ).to.equal(await BBitesToken.getAddress())
    
    
        expect(
          await publicSaleContract.getRouterAddress()
        ).to.equal(uniswap)
      })
    
      it('getPriceForId Fuera de Rango', async () => {
        const {publicSaleContract}  = await loadFixture(deployFixture)
        const tokenId = 900;
        await expect(
          publicSaleContract.getPriceForId(tokenId)
        ).to.revertedWith(
          `ID fuera de Rango`
        )
      })
    
        

});