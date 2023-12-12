require("dotenv").config();
var { ethers } = require("hardhat");
var pEth = ethers.parseEther;
var pUSD = ethers.parse
var uniswapRouter = require('@uniswap/v2-periphery/build/UniswapV2Router02.json')

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
} = require("../utils");

const { getRootFromMT } = require("../utils/merkleTree");

var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");


// Publicar NFT en Mumbai
async function deployMumbai() {
  var relAddMumbai = "0x8ACFDF89cb563f9cF017837C2B092298f1CF6EB9"; // relayer mumbai
  const cuyNFTName = 'CuyCollection'
  const cuyNftContract = await deploySC(cuyNFTName);
  const cuyNftAddress = await cuyNftContract.getAddress();
  const cuyNftContractImpl = await printAddress(cuyNFTName, cuyNftAddress);

  await cuyNftContract.actualizarRoot(getRootFromMT())
  await cuyNftContract.grantRole(MINTER_ROLE, relAddMumbai)
  await verify(cuyNftContractImpl, cuyNFTName);

  // utiliza deploySC
  // utiliza printAddress
  // utiliza ex
  // utiliza ex
  // utiliza verify
}

// Publicar UDSC, Public Sale y Bbites Token en Goerli
async function deployGoerli() {
  const [deployer] = await ethers.getSigners();

  //Deploy USDC
  const usdCoinName = "USDCoin";
  const usdContract = await deploySCNoUp(usdCoinName);
  const usdAddress = await usdContract.getAddress();
  await verify(usdAddress, usdCoinName)

  //Deploy BBitesToken
  var relayerGowerli = "0x12b1F470bC154ad9E23680faC87eFA2115F5556D";
  const bbitesTokenName = "BBitesToken"
  const bbitesToken = await deploySC(bbitesTokenName);
  const bbitesAddress = await bbitesToken.getAddress()
  console.log(bbitesToken + "\n La de abajo es bbitesAddress")
  console.log(bbitesAddress);
  const bbitesContractImpl = await printAddress(bbitesTokenName, bbitesAddress)
  await bbitesToken.grantRole(MINTER_ROLE, relayerGowerli)
  await verify(bbitesContractImpl, bbitesTokenName)

  // Deploy public Sale
  var uniSwap = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; 
  const publicSaleName = 'PublicSale'
  const publicSale = await deploySC(publicSaleName, [
    uniSwap,
    usdAddress,
    bbitesAddress
  ]);
  const publicSaleAddress = await publicSale.getAddress();
  const publicSaleImpl = await printAddress(publicSaleName, publicSaleAddress)
  
  await verify(publicSaleImpl, publicSaleName, [])

  //Aprove Router

  const bbitesAmount = await bbitesToken.balanceOf(deployer)
  const usdcAmount = await usdContract.balanceOf(deployer)

  await bbitesToken.approve(uniSwap, bbitesAmount)
  await usdContract.approve(uniSwap, usdcAmount)
  /*
  //Añadimos Liquidez
  const txLiquidity = await uniswapRouterContract.addLiquidity(
    bbitesAddress,
    usdAddress,
    bbitesAmount,
    usdcAmount,
    bbitesAmount,
    usdcAmount,
    deployer.address,
    new Date().getTime() + 600_000
  );

  console.log(txLiquidity);
  */

  // var psC Contrato
  // deploySC;
  // var bbitesToken Contrato
  // deploySC;
  // var usdc Contrato
  // deploySC;
  //0xca420cc41ccf5499c05ab3c0b771ce780198555e
  // var impPS = await printAddress("PublicSale", await psC.getAddress());
  // var impBT = await printAddress("BBitesToken", await bbitesToken.getAddress());

  // set up
  // script para verificacion del contrato

}

async function addLiquidity() {
    const [deployer] = await ethers.getSigners();

    var uniSwap = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; 
    const uniswapRouterContract = new ethers.Contract(uniSwap, uniswapRouter.abi, deployer)

    var tokenAAdd = "0xac2799d8899B0f47cb8A8A69B55F5a5F2dda2788";

    var tokenBAdd = "0x70c7a7d86DA6Eed97f29874e02e9Ef54d6727deF";

    var _tokenA = tokenAAdd;
    var _tokenB = tokenBAdd;
    var _amountADesired = pEth("1000000");
    var _amountBDesired = 500000 * 10**6 ;
    var _amountAMin = pEth("1000000");
    var _amountBMin = 500000 * 10**6 ;
    var _to = deployer.address;
    var _deadline = new Date().getTime() + 60000;

    tx = await uniswapRouterContract.addLiquidity(
      _tokenA,
      _tokenB,
      _amountADesired,
      _amountBDesired,
      _amountAMin,
      _amountBMin,
      _to,
      _deadline
    );
    var res = await tx.wait();
    console.log(`Hash de la transaction ${res.hash}`);
  }

  async function swappTokents(){

  }


 deployMumbai()
 //deployGoerli()
 //addLiquidity()
 .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

//npx hardhat run --network <your-network> scripts/deploy.js
//npx hardhat run --network mumbai scripts/deploy.js
//npx hardhat run --network goerli scripts/deploy.js
