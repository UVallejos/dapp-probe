const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { ethers } = require("hardhat");
const walletAndIds = require("../wallets/walletList");

var merkleTree, root;

function hashToken(id, address) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [id, address])
      .slice(2),
    "hex"
  );
}


function getRootFromMT() {
  var elementosHasheados = walletAndIds.map(({ id, address }) => {
    return hashToken(id, address);
  });

  merkleTree = new MerkleTree(elementosHasheados, keccak256, {
    sortPairs: true,
  }); 
  //Raiz de MerkelTree = 0x84bf1b2f55bd29c09b994e045d5e08c98e0a304b152696041b4443941ad8e8b7;
  return merkleTree.getHexRoot();
}




/*
function construyendoMerkleTree() {

  var elementosHasheados = walletAndIds.map(({ id, address }) => {
    return hashToken(id, address);
  });

  merkleTree = new MerkleTree(elementosHasheados, keccak256, {
    sortPairs: true,
  }); 
  //Raiz de MerkelTree = 0x84bf1b2f55bd29c09b994e045d5e08c98e0a304b152696041b4443941ad8e8b7;
  return merkleTree.getHexRoot();
}


var hasheandoElemento, pruebas;
function construyendoPruebas() {
  var id = 1003;
  var address = "0x7CCF2C3630EA896A36CA1a58cc5809e2322B1074";
  hasheandoElemento = hashToken(id, address);
  pruebas = merkleTree.getHexProof(hasheandoElemento);
  console.log(pruebas);

  // verificacion off-chain
  var pertenece = merkleTree.verify(pruebas, hasheandoElemento, root);
  console.log(pertenece);
}

*/



//construyendoMerkleTree();
//construyendoPruebas();
module.exports = { getRootFromMT };


