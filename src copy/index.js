import { Contract, ethers } from "ethers";

import usdcTknAbi from "../artifacts/contracts/USDCoin.sol/USDCoin.json";
import bbitesTokenAbi from "../artifacts/contracts/BBitesToken.sol/BBitesToken.json";
import publicSaleAbi from "../artifacts/contracts/PublicSale.sol/PublicSale.json";
import nftTokenAbi from '../artifacts/contracts/CuyCollectionNft.sol/CuyCollection.json'
// import bBBitesTokenAbi
// import publicSaleAbi
// import nftTknAbi

// SUGERENCIA: vuelve a armar el MerkleTree en frontend
// Utiliza la libreria buffer
import buffer from "buffer/";
import walletAndIds from "../wallets/walletList";
import { MerkleTree } from "merkletreejs";
var Buffer = buffer.Buffer;
var merkleTree;

function hashToken(tokenId, account) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
      .slice(2),
    "hex"
  );
}

function buildMerkleTree() {
  var elementosHasheados = walletAndIds.map(({id, address}) => {
    return hashToken(id, address)
  });
  merkleTree = new MerkleTree(elementosHasheados, ethers.keccak256, {
    sortPairs: true,
  });
}

var provider, signer, account;
var usdcTkContract, bbitesTknContract, pubSContract, nftContract;
var usdcAddress, bbitesTknAdd, pubSContractAdd;

function initSCsGoerli() {
  provider = new ethers.BrowserProvider(window.ethereum);

  usdcAddress = "0x70c7a7d86DA6Eed97f29874e02e9Ef54d6727deF";
  bbitesTknAdd = "0xac2799d8899B0f47cb8A8A69B55F5a5F2dda2788";
  pubSContractAdd = "0x2D7EDD6F6ae3CAF3Adece3Fea225C079011C917f";
  
  usdcTkContract = new Contract(usdcAddress, usdcTknAbi.abi, provider); // = new Contract(...
  bbitesTknContract = new Contract(bbitesTknAdd, bbitesTokenAbi.abi, provider); // = new Contract(...
  pubSContract = new Contract(pubSContractAdd, publicSaleAbi.abi, provider); // = new Contract(...
}

function initSCsMumbai() {
  provider = new ethers.BrowserProvider(window.ethereum);

  var nftAddress = "0x838f7718f38c21EAF0B778BF474D804FD5736417";

  nftContract = new Contract(nftAddress, nftTokenAbi.abi, provider); // = new Contract(...
}

async function setUpListeners() {
   // Connect to Metamask
  var bttnConnect = document.getElementById("connect");
  var walletIdEl = document.getElementById("walletId");
  bttnConnect.addEventListener("click", async function () {
    if (window.ethereum) {
      [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Billetera metamask", account);
      walletIdEl.innerHTML = account;
      signer = await provider.getSigner(account);
    }
  });

  

  // USDC Balance - balanceOf
  var bttn = document.getElementById("usdcUpdate");
  bttn.addEventListener("click", async function () {
    var balance = await usdcTkContract.balanceOf(account);
    var balanceEl = document.getElementById("usdcBalance");
    balanceEl.innerHTML = ethers.formatUnits(balance, 6);
  });

  // Bbites token Balance - balanceOf
   // USDC Balance - balanceOf
   var bttn = document.getElementById("bbitesTknUpdate");
   bttn.addEventListener("click", async function () {
     var balance = await bbitesTknContract.balanceOf(account);
     var balanceEl = document.getElementById("bbitesTknBalance");
     balanceEl.innerHTML = ethers.formatUnits(balance, 18);
   });

  // APPROVE BBTKN
  // bbitesTknContract.approve
  var bttnApproveBBTkn = document.getElementById("approveButtonBBTkn");
  bttnApproveBBTkn.addEventListener('click', async () => {
    try {
      var value = document.getElementById("approveInput").value
      await bbitesTknContract.connect(signer).approve(pubSContractAdd, ethers.parseUnits(value, 18))
    } catch(error) {
      document.getElementById('approveError').innerHTML = error.reason
      console.error(error.reason)
    }
  })

  // APPROVE USDC
  // usdcTkContract.approve
  var bttnApproveUsdc = document.getElementById("approveButtonUSDC");
  bttnApproveUsdc.addEventListener('click', async function () {
    try {
      var value = document.getElementById("approveInputUSDC").value
      await usdcTkContract.connect(signer).approve(pubSContractAdd, ethers.parseUnits(value, 6))
    } catch(error) {
      document.getElementById('approveErrorUSDC').innerHTML = error.reason
      console.error(error.reason)
    }
  })

  // purchaseWithTokens
  var bttnPurchaseWithBbites = document.getElementById("purchaseButton");
  bttnPurchaseWithBbites.addEventListener('click', async () => {
    var id = document.getElementById('purchaseInput').value
    try {
      await pubSContract
        .connect(signer)
        .purchaseWithTokens(id);
    } catch(error) {
      document.getElementById('purchaseError').innerHTML = error.reason
      console.error(error.reason)
    }
  })

  // purchaseWithUSDC
  var bttnPurchaseWithUSDC = document.getElementById("purchaseButtonUSDC");
  bttnPurchaseWithUSDC.addEventListener('click', async () => {
    var id = document.getElementById('purchaseInputUSDC').value
    var amountIn = document.getElementById('amountInUSDCInput').value
    console.log(amountIn)
    try { 
      await pubSContract.connect(signer).purchaseWithUSDC(id, ethers.parseUnits(amountIn, 6))
    } catch(error) {
      document.getElementById('purchaseErrorUSDC').innerHTML = error.reason
      console.error(error.reason)
    }
  })

  // purchaseWithEtherAndId
  var bttnPurchaseWithEtherAndId = document.getElementById("purchaseButtonEtherId");
  bttnPurchaseWithEtherAndId.addEventListener('click', async () => {
    var id = document.getElementById('purchaseInputEtherId').value
    try {
      await pubSContract.connect(signer).purchaseWithEtherAndId(id, {value: ethers.parseUnits('0.01', 18)})
    } catch(error) {
      document.getElementById('purchaseEtherIdError').innerHTML = error.reason
      console.error(error.reason)
    }
  })

  // send Ether
  var bttnSendEther = document.getElementById("sendEtherButton");
  bttnSendEther.addEventListener('click', async () => {
    try {
      await pubSContract.connect(signer).depositEthForARandomNft({value: ethers.parseUnits('0.01', 18)})
    } catch(error) {
      document.getElementById('sendEtherError').innerHTML = error.reason
      console.error(error.reason)
    }
  })

  // getPriceForId
  var bttnGetPriceForId = document.getElementById("getPriceNftByIdBttn");
  bttnGetPriceForId.addEventListener('click', async () => {
    var id = document.getElementById('priceNftIdInput').value
    try {
      const price = await pubSContract.getPriceForId(id)
      document.getElementById('priceNftByIdText').innerHTML = ethers.formatUnits(price)
    } catch(error) {
      document.getElementById('getPriceNftError').innerHTML = error.reason
      console.error(error.reason)
    }
  })

  // getProofs
  var bttnProofButtonId = document.getElementById("getProofsButtonId");
  bttnProofButtonId.addEventListener("click", async () => {
    var id = document.getElementById("inputIdProofId").value;
    var address = document.getElementById("inputAccountProofId").value;
    var proofs = merkleTree.getHexProof(hashToken(id, address));
    document.getElementById('showProofsTextId').innerHTML = JSON.stringify(proofs)
    navigator.clipboard.writeText(JSON.stringify(proofs));
  });

  // safeMintWhiteList
  var bttnSafeMintWhiteList = document.getElementById("safeMintWhiteListBttnId");
  // usar ethers.hexlify porque es un array de bytes
  bttnSafeMintWhiteList.addEventListener('click', async () => {
    try {
      var proofsValue = document.getElementById("whiteListToInputProofsId").value;
      console.log(proofsValue)
      var to = document.getElementById('whiteListToInputId').value
      console.log(to)
      var tokenId = document.getElementById('whiteListToInputTokenId').value
      console.log(tokenId)
      proofsValue = JSON.parse(proofsValue).map(ethers.hexlify);
      console.log(proofsValue)
      await nftContract.connect(signer).safeMintWhiteList(to, tokenId, proofsValue)
    } catch(error) {
      document.getElementById('whiteListErrorId').innerHTML = error.reason
      console.error(error.reason)
    }
  })

  // buyBack
  var bttnBuyBack = document.getElementById("buyBackBttn");
  bttnBuyBack.addEventListener('click', async () => {
    try {
      var id = document.getElementById('buyBackInputId').value
      await nftContract.connect(signer).buyBack(id)
    } catch(error) {
      document.getElementById('buyBackErrorId').innerHTML = error.reason
      console.error(error.reason)
    }
  })
}

function setUpEventsContracts() {
  var pubSList = document.getElementById("pubSList");
  pubSContract.on("PurchaseNftWithId", (owner, id) => {
    const node = document.createElement("p")
    const textNode = document.createTextNode(`[Owner:] ${owner} [Id:] ${id}`)
    node.appendChild(textNode)
    pubSList.appendChild(node);
  })

  var bbitesListEl = document.getElementById("bbitesTList");
  // bbitesCListener - "Transfer"
  bbitesTknContract.on("Transfer", (from, to, amount) => {
    const node = document.createElement("p")
    const textNode = document.createTextNode(`From ${from} To ${to} Amount ${ethers.formatUnits(amount, 18)}`)
    node.appendChild(textNode)
    bbitesListEl.appendChild(node);
  })

  var nftList = document.getElementById("nftList");
  // nftCListener - "Transfer"
  nftContract.on("Transfer", (from, to, id) => {
    console.log("Find Transfer Event")
    const node = document.createElement("p")
    const textNode = document.createTextNode(`From ${from} To ${to} Token Id ${id}`)
    node.appendChild(textNode)
    nftList.appendChild(node);
  })
  

  var burnList = document.getElementById("burnList");
  // nftCListener - "Burn"
  nftContract.on("Burn", (account,id) => {
    const node = document.createElement("p")
    const textNode = document.createTextNode(`From ${account} Token Id ${id}`)
    node.appendChild(textNode)
    burnList.appendChild(node);
  })
}

async function setUp() {
  window.ethereum.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  initSCsGoerli();

  initSCsMumbai()

  buildMerkleTree()
  
  await setUpListeners()
  
  setUpEventsContracts()
  
  
}


setUp()
  .then()
  .catch((e) => console.log(e));
