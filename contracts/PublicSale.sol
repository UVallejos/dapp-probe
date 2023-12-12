// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IUniSwapV2Router02} from "./Interfaces.sol";


/**
 -Los ids para la venta usando BBTKN o USDC van del 0 hasta el 699 y tienen diferentes rangos de precio.
 -Se puede enviar 0.01 ether para comprar NFTs en el rango de 700 - 999
 -Los ids que van del 1000 - 1999 solo se acuñan en Polygon (Mumbai) 
    en el mismo contrato de NFTs usando la lista blanca (merkle tree).

    id (inclusivo)	    Tipo	        Precio (BBTKN)
    0 - 199	            Común	        1000 BBTKN fijo

    200 - 499	        Raro	        Multiplicar su id por 20

    500 - 699	        Legendario	    Según días pasados*****

    700 - 999	        Místico	        0.01 ether fijo

    1000 - 1999	        Whitelist	    Sin precio

    *****Nota: Su precio cambia según el # de días pasados desde las 00 horas del 30 de septiembre del 2023 GMT 
    (obtener el timestamp en epoch converter). El primer día empieza en 10,000 BBTKN. Por cada día pasado, 
    el precio se incrementa en 2,000 BBTKN. El precio máximo es 90,000 BBTKN.
 */


contract PublicSale is Initializable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    IUniSwapV2Router02 router;
    IERC20 usdCoin;
    IERC20Upgradeable bbToken;
    

    //Struct que Almacena el propietario de un NFT y el precio de compra en BBTK
    struct infoNFT {
        address owner;
        uint price;
    }

    mapping(uint256 => infoNFT) public createdNFTs;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant EXECUTER_ROLE = keccak256("EXECUTER_ROLE");

    // 00 horas del 30 de septiembre del 2023 GMT
    uint256 constant startDate = 1696032000;

    // Maximo price NFT
    uint256 constant MAX_PRICE_NFT = 90_000 * 10 ** 18;

    event PurchaseNftWithId(address account, uint256 id);


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IUniSwapV2Router02 _router, 
        IERC20  _usdCoin, 
        IERC20Upgradeable _bbtkn)
        initializer public
    {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        router = _router;
        usdCoin = _usdCoin;
        bbToken =  _bbtkn;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(EXECUTER_ROLE, msg.sender);
        
        
        
        
    }

    //Verifica que este en un rango permitido de Compra
    modifier validateRange(uint256 _nftID, uint256 _valueMIN, uint256 _valueMAX){
        require(_nftID >= _valueMIN && _nftID <= _valueMAX, "ID Fuera de Rango Permitido");
        _;
    }

    //Verifica que el ID no se encuentre ya Creado
    modifier validateMintNft(uint256 _nftID){
        require(createdNFTs[_nftID].owner == address(0), "Este NFT ya se ha minteado");
        _;
    }

    /**
    El usuario escoge el id a comprar y se emite el evento. 
    Estos tokens se transfieren al contrato Public Sale. 
    Aplica para ids en el rango 0 - 699.
     */
    function purchaseWithTokens(uint256 _id) public validateRange(_id, 0, 699) validateMintNft(_id) {
        //Precio del NFT por la id introducida
        uint priceNFT = getPriceForId(_id);

        //Transferimos tokens al contrato
        bbToken.transferFrom(msg.sender, address(this), priceNFT);

        //Agregamos al registro de NFTs comprados
        createdNFTs[_id] = infoNFT({
            owner: msg.sender, 
            price: priceNFT
        });
        
        emit PurchaseNftWithId(msg.sender, _id);
    }

    
    //-transfiere _amountIn de USDC a este contrato
    //-llama a swapTokensForExactTokens: valor de retorno de este metodo es cuanto gastaste del token input
    //-transfiere el excedente de USDC a msg.sender
     
    function purchaseWithUSDC(uint256 _id, uint _amountIn) validateRange(_id, 0, 699) validateMintNft(_id) external  {
        
        uint priceNFT = getPriceForId(_id);

        //transfiere _amountIn de USDC a este contrato
        usdCoin.transferFrom(msg.sender, address(this), _amountIn);
        
        //Aprove al router
        usdCoin.approve(address(router), _amountIn);

        //Swap USDC a BBTKN 
        address[] memory tokens = new address[](2);
        tokens[0] = address(usdCoin);
        tokens[1] = address(bbToken);

        uint[] memory _amounts = router.swapTokensForExactTokens(
            priceNFT,
            _amountIn,
            tokens,
            address(this),
            block.timestamp + 60000
        );

        if(_amountIn > _amounts[0]){
           usdCoin.transfer(msg.sender, _amountIn - _amounts[0]);
        }

        //Agregamos al registro de NFTs comprados
        createdNFTs[_id] = infoNFT({
            owner: msg.sender, 
            price: priceNFT
        });

        emit PurchaseNftWithId(msg.sender, _id);

    }


    function purchaseWithEtherAndId(uint256 _id) public payable validateRange(_id, 700, 999) validateMintNft(_id){
        //Verificamos cantidad de Ether enviado
        require(msg.value >= 0.01 ether, "Cantidad Insuficiente de Ether para Comprar");

        //Obtenemos cambio
        uint256 cambio = msg.value - 0.01 ether;

        //Damos cambio si se ha enviado más ether que el necesario
        if(cambio > 0){
            address payable comprador = payable(msg.sender);
            comprador.transfer(cambio);
        }
        
        //Agregamos al registro de NFTs comprados 
        createdNFTs[_id] = infoNFT({
            owner: msg.sender, 
            price: 0.01 ether
        });

        emit PurchaseNftWithId(msg.sender, _id);
    }

    function depositEthForARandomNft() public payable{
        //Verificamos cantidad de Ether enviado
        require(msg.value == 0.01 ether, "Cantidad Incorrecta de Ether para Comprar");

        //Obtenemos número de ID aleatorio
        uint256 aleatorioID;
        bool minteado = true;

        //Bucle que verifica que no exista un registro en 
        //el mapping createdNFTs con el id aleatorioID
        while(minteado){
            aleatorioID = randomId(700, 999);
            minteado = (createdNFTs[aleatorioID].owner != address(0));
        }

        //Agregamos al registro de NFTs comprados 
        createdNFTs[aleatorioID] = infoNFT({
            owner: msg.sender,
            price: 0.01 ether
        });

        emit PurchaseNftWithId(msg.sender, aleatorioID);
    }

    

    function withdrawEther() public onlyRole(DEFAULT_ADMIN_ROLE){

        require(address(this).balance > 0, "No hay Ether para Retirar");

        payable(msg.sender).transfer(address(this).balance);

    }

    function withdrawTokens() public onlyRole(DEFAULT_ADMIN_ROLE){
        
        uint256 bbtknBalance = bbToken.balanceOf(address(this));

        require(bbtknBalance > 0, "No hay BBTKN para Retirar");

        require(bbToken.transfer(msg.sender, bbtknBalance), "Transferencia BBTKN Fallida");
    }

    function getRouterAddress() public view returns (address) {
        return address(router);
    }

    function getUSDCAddress() public view returns (address){
        return address(usdCoin);
    }

    function getTokenAddress() public view returns (address){
        return address(bbToken);
    }

    receive() external payable {
        depositEthForARandomNft();
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////

    function getPriceForId(uint _id) public view returns(uint){
        uint priceToken;

        if (_id >= 0 && _id <= 199){
            priceToken = 1000 * 10 ** 18;
        } else if(_id >= 200 && _id <= 499){
            priceToken = _id * 20 * 10 ** 18;
        } else if(_id >= 500 && _id <= 699){
            uint _priceBase = 10_000;
            uint _uploadEveryDay = (block.timestamp - startDate) / 86400;
            priceToken = _priceBase + _uploadEveryDay * 20_000;
            priceToken *= 10 ** 18;
            priceToken = priceToken <= MAX_PRICE_NFT ? priceToken : MAX_PRICE_NFT;
        }
        else{
            revert("ID fuera de Rango");
        }
        return priceToken;
    }

    function randomId(uint256 _minValue, uint256 _maxValue) internal view returns(uint256){
        uint256 _randomId = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)
            )
        ) % (_maxValue - _minValue + 1);

        return _randomId + _minValue;
    }
    
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}
}
