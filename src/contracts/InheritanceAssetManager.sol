// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IInheritanceCore.sol";

/**
 * @title InheritanceAssetManager
 * @dev Manages ETH, ERC20, and ERC721 assets in inheritance contracts
 * @notice Handles deposits, withdrawals, and distributions of various asset types
 */
contract InheritanceAssetManager is ReentrancyGuard, IERC721Receiver {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // ============ CONSTANTS ============

    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    uint256 public constant MAX_ASSETS_PER_TYPE = 100; // Prevent gas limit issues

    // ============ STORAGE ============

    /// @dev Mapping from inheritance ID to ETH balance
    mapping(uint256 => uint256) public ethBalances;

    /// @dev Mapping from inheritance ID to ERC20 token balances
    mapping(uint256 => mapping(address => uint256)) public erc20Balances;

    /// @dev Mapping from inheritance ID to owned ERC721 tokens
    mapping(uint256 => mapping(address => uint256[])) public erc721Tokens;

    /// @dev Mapping to check if a specific ERC721 token is owned by an inheritance
    mapping(uint256 => mapping(address => mapping(uint256 => bool)))
        public ownsERC721Token;

    /// @dev Mapping from inheritance ID to list of ERC20 token addresses
    mapping(uint256 => address[]) public erc20TokenList;

    /// @dev Mapping from inheritance ID to list of ERC721 contract addresses
    mapping(uint256 => address[]) public erc721ContractList;

    /// @dev Mapping to track if a token is already in the list
    mapping(uint256 => mapping(address => bool)) public isTokenInList;

    /// @dev Mapping to track total assets value for reporting
    mapping(uint256 => uint256) public totalETHDeposited;
    mapping(uint256 => mapping(address => uint256)) public totalERC20Deposited;
    mapping(uint256 => mapping(address => uint256)) public totalERC721Deposited;

    // ============ EVENTS ============

    event ETHDeposited(
        uint256 indexed inheritanceId,
        address indexed depositor,
        uint256 amount
    );

    event ERC20Deposited(
        uint256 indexed inheritanceId,
        address indexed token,
        address indexed depositor,
        uint256 amount
    );

    event ERC721Deposited(
        uint256 indexed inheritanceId,
        address indexed nftContract,
        address indexed depositor,
        uint256 tokenId
    );

    event ETHWithdrawn(
        uint256 indexed inheritanceId,
        address indexed recipient,
        uint256 amount,
        string reason
    );

    event ERC20Withdrawn(
        uint256 indexed inheritanceId,
        address indexed token,
        address indexed recipient,
        uint256 amount,
        string reason
    );

    event ERC721Withdrawn(
        uint256 indexed inheritanceId,
        address indexed nftContract,
        address indexed recipient,
        uint256 tokenId,
        string reason
    );

    event AssetsDistributed(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        uint256 ethAmount,
        uint256 erc20Count,
        uint256 erc721Count
    );

    event BatchDeposit(
        uint256 indexed inheritanceId,
        address indexed depositor,
        uint256 ethAmount,
        uint256 erc20Count,
        uint256 erc721Count
    );

    // ============ ERRORS ============

    error InsufficientETHBalance();
    error InsufficientERC20Balance();
    error ERC721TokenNotOwned();
    error InvalidAssetType();
    error ArrayLengthMismatch();
    error MaxAssetsExceeded();
    error TransferFailed();
    error ZeroAmount();
    error ZeroAddress();
    error TokenNotSupported();
    error InvalidTokenId();

    // ============ MODIFIERS ============

    modifier validAmount(uint256 _amount) {
        if (_amount == 0) revert ZeroAmount();
        _;
    }

    modifier validAddress(address _addr) {
        if (_addr == address(0)) revert ZeroAddress();
        _;
    }

    // ============ DEPOSIT FUNCTIONS ============

    /**
     * @dev Deposits ETH into an inheritance
     * @param _inheritanceId The inheritance ID
     */
    function depositETH(
        uint256 _inheritanceId
    ) external payable validAmount(msg.value) nonReentrant {
        ethBalances[_inheritanceId] += msg.value;
        totalETHDeposited[_inheritanceId] += msg.value;

        emit ETHDeposited(_inheritanceId, msg.sender, msg.value);
    }

    /**
     * @dev Deposits ERC20 tokens into an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _token The ERC20 token address
     * @param _amount The amount to deposit
     */
    function depositERC20(
        uint256 _inheritanceId,
        address _token,
        uint256 _amount
    ) external validAddress(_token) validAmount(_amount) nonReentrant {
        // Add token to list if not already present
        if (!isTokenInList[_inheritanceId][_token]) {
            if (erc20TokenList[_inheritanceId].length >= MAX_ASSETS_PER_TYPE) {
                revert MaxAssetsExceeded();
            }
            erc20TokenList[_inheritanceId].push(_token);
            isTokenInList[_inheritanceId][_token] = true;
        }

        // Transfer tokens from sender to this contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        erc20Balances[_inheritanceId][_token] += _amount;
        totalERC20Deposited[_inheritanceId][_token] += _amount;

        emit ERC20Deposited(_inheritanceId, _token, msg.sender, _amount);
    }

    /**
     * @dev Deposits ERC721 token into an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _nftContract The NFT contract address
     * @param _tokenId The token ID to deposit
     */
    function depositERC721(
        uint256 _inheritanceId,
        address _nftContract,
        uint256 _tokenId
    ) external validAddress(_nftContract) nonReentrant {
        // Add NFT contract to list if not already present
        if (!isTokenInList[_inheritanceId][_nftContract]) {
            if (
                erc721ContractList[_inheritanceId].length >= MAX_ASSETS_PER_TYPE
            ) {
                revert MaxAssetsExceeded();
            }
            erc721ContractList[_inheritanceId].push(_nftContract);
            isTokenInList[_inheritanceId][_nftContract] = true;
        }

        // Check that token list doesn't exceed limit
        if (
            erc721Tokens[_inheritanceId][_nftContract].length >=
            MAX_ASSETS_PER_TYPE
        ) {
            revert MaxAssetsExceeded();
        }

        // Transfer NFT from sender to this contract
        IERC721(_nftContract).safeTransferFrom(
            msg.sender,
            address(this),
            _tokenId
        );

        erc721Tokens[_inheritanceId][_nftContract].push(_tokenId);
        ownsERC721Token[_inheritanceId][_nftContract][_tokenId] = true;
        totalERC721Deposited[_inheritanceId][_nftContract]++;

        emit ERC721Deposited(
            _inheritanceId,
            _nftContract,
            msg.sender,
            _tokenId
        );
    }

    /**
     * @dev Batch deposit multiple assets
     * @param _inheritanceId The inheritance ID
     * @param _erc20Tokens Array of ERC20 token addresses
     * @param _erc20Amounts Array of ERC20 amounts
     * @param _erc721Contracts Array of ERC721 contract addresses
     * @param _erc721TokenIds Array of ERC721 token IDs
     */
    function batchDeposit(
        uint256 _inheritanceId,
        address[] calldata _erc20Tokens,
        uint256[] calldata _erc20Amounts,
        address[] calldata _erc721Contracts,
        uint256[] calldata _erc721TokenIds
    ) external payable nonReentrant {
        uint256 ethAmount = msg.value;
        uint256 erc20Count = _erc20Tokens.length;
        uint256 erc721Count = _erc721Contracts.length;

        // Validate array lengths match
        if (
            erc20Count != _erc20Amounts.length ||
            erc721Count != _erc721TokenIds.length
        ) {
            revert ArrayLengthMismatch();
        }

        // Deposit ETH if provided
        if (ethAmount > 0) {
            ethBalances[_inheritanceId] += ethAmount;
            totalETHDeposited[_inheritanceId] += ethAmount;
        }

        // Deposit ERC20 tokens
        for (uint256 i = 0; i < erc20Count; i++) {
            address token = _erc20Tokens[i];
            uint256 amount = _erc20Amounts[i];

            if (token == address(0) || amount == 0) continue;

            // Add to list if needed
            if (!isTokenInList[_inheritanceId][token]) {
                erc20TokenList[_inheritanceId].push(token);
                isTokenInList[_inheritanceId][token] = true;
            }

            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            erc20Balances[_inheritanceId][token] += amount;
            totalERC20Deposited[_inheritanceId][token] += amount;
        }

        // Deposit ERC721 tokens
        for (uint256 i = 0; i < erc721Count; i++) {
            address nftContract = _erc721Contracts[i];
            uint256 tokenId = _erc721TokenIds[i];

            if (nftContract == address(0)) continue;

            // Add to list if needed
            if (!isTokenInList[_inheritanceId][nftContract]) {
                erc721ContractList[_inheritanceId].push(nftContract);
                isTokenInList[_inheritanceId][nftContract] = true;
            }

            IERC721(nftContract).safeTransferFrom(
                msg.sender,
                address(this),
                tokenId
            );
            erc721Tokens[_inheritanceId][nftContract].push(tokenId);
            ownsERC721Token[_inheritanceId][nftContract][tokenId] = true;
            totalERC721Deposited[_inheritanceId][nftContract]++;
        }

        emit BatchDeposit(
            _inheritanceId,
            msg.sender,
            ethAmount,
            erc20Count,
            erc721Count
        );
    }

    // ============ WITHDRAWAL FUNCTIONS ============

    /**
     * @dev Withdraws ETH from an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _recipient The recipient address
     * @param _amount The amount to withdraw
     * @param _reason Reason for withdrawal (for logging)
     */
    function withdrawETH(
        uint256 _inheritanceId,
        address _recipient,
        uint256 _amount,
        string calldata _reason
    ) external validAddress(_recipient) validAmount(_amount) nonReentrant {
        if (ethBalances[_inheritanceId] < _amount) {
            revert InsufficientETHBalance();
        }

        ethBalances[_inheritanceId] -= _amount;

        (bool success, ) = _recipient.call{value: _amount}("");
        if (!success) revert TransferFailed();

        emit ETHWithdrawn(_inheritanceId, _recipient, _amount, _reason);
    }

    /**
     * @dev Withdraws ERC20 tokens from an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _token The ERC20 token address
     * @param _recipient The recipient address
     * @param _amount The amount to withdraw
     * @param _reason Reason for withdrawal
     */
    function withdrawERC20(
        uint256 _inheritanceId,
        address _token,
        address _recipient,
        uint256 _amount,
        string calldata _reason
    )
        external
        validAddress(_token)
        validAddress(_recipient)
        validAmount(_amount)
        nonReentrant
    {
        if (erc20Balances[_inheritanceId][_token] < _amount) {
            revert InsufficientERC20Balance();
        }

        erc20Balances[_inheritanceId][_token] -= _amount;

        IERC20(_token).safeTransfer(_recipient, _amount);

        emit ERC20Withdrawn(
            _inheritanceId,
            _token,
            _recipient,
            _amount,
            _reason
        );
    }

    /**
     * @dev Withdraws ERC721 token from an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _nftContract The NFT contract address
     * @param _recipient The recipient address
     * @param _tokenId The token ID to withdraw
     * @param _reason Reason for withdrawal
     */
    function withdrawERC721(
        uint256 _inheritanceId,
        address _nftContract,
        address _recipient,
        uint256 _tokenId,
        string calldata _reason
    )
        external
        validAddress(_nftContract)
        validAddress(_recipient)
        nonReentrant
    {
        if (!ownsERC721Token[_inheritanceId][_nftContract][_tokenId]) {
            revert ERC721TokenNotOwned();
        }

        // Remove token from storage
        _removeERC721Token(_inheritanceId, _nftContract, _tokenId);

        IERC721(_nftContract).safeTransferFrom(
            address(this),
            _recipient,
            _tokenId
        );

        emit ERC721Withdrawn(
            _inheritanceId,
            _nftContract,
            _recipient,
            _tokenId,
            _reason
        );
    }

    /**
     * @dev Batch withdrawal of multiple assets
     * @param _inheritanceId The inheritance ID
     * @param _recipient The recipient address
     * @param _ethAmount Amount of ETH to withdraw
     * @param _erc20Tokens Array of ERC20 token addresses
     * @param _erc20Amounts Array of ERC20 amounts
     * @param _erc721Contracts Array of ERC721 contract addresses
     * @param _erc721TokenIds Array of ERC721 token IDs
     * @param _reason Reason for withdrawal
     */
    function batchWithdraw(
        uint256 _inheritanceId,
        address _recipient,
        uint256 _ethAmount,
        address[] calldata _erc20Tokens,
        uint256[] calldata _erc20Amounts,
        address[] calldata _erc721Contracts,
        uint256[] calldata _erc721TokenIds,
        string calldata _reason
    ) external validAddress(_recipient) nonReentrant {
        // Validate arrays
        if (
            _erc20Tokens.length != _erc20Amounts.length ||
            _erc721Contracts.length != _erc721TokenIds.length
        ) {
            revert ArrayLengthMismatch();
        }

        // Withdraw ETH
        if (_ethAmount > 0) {
            withdrawETH(_inheritanceId, _recipient, _ethAmount, _reason);
        }

        // Withdraw ERC20 tokens
        for (uint256 i = 0; i < _erc20Tokens.length; i++) {
            if (_erc20Amounts[i] > 0) {
                withdrawERC20(
                    _inheritanceId,
                    _erc20Tokens[i],
                    _recipient,
                    _erc20Amounts[i],
                    _reason
                );
            }
        }

        // Withdraw ERC721 tokens
        for (uint256 i = 0; i < _erc721Contracts.length; i++) {
            withdrawERC721(
                _inheritanceId,
                _erc721Contracts[i],
                _recipient,
                _erc721TokenIds[i],
                _reason
            );
        }
    }

    // ============ DISTRIBUTION FUNCTIONS ============

    /**
     * @dev Distributes assets to a beneficiary based on their allocation
     * @param _inheritanceId The inheritance ID
     * @param _beneficiary The beneficiary address
     * @param _percentage The beneficiary's percentage allocation
     * @param _includeETH Whether to distribute ETH
     * @param _erc20Tokens Array of ERC20 tokens to distribute
     * @param _erc721Contracts Array of ERC721 contracts to distribute from
     * @param _erc721TokenIds Specific ERC721 token IDs to distribute
     */
    function distributeAssets(
        uint256 _inheritanceId,
        address _beneficiary,
        uint256 _percentage,
        bool _includeETH,
        address[] calldata _erc20Tokens,
        address[] calldata _erc721Contracts,
        uint256[] calldata _erc721TokenIds
    ) external validAddress(_beneficiary) nonReentrant {
        uint256 ethAmount = 0;
        uint256 erc20Count = 0;
        uint256 erc721Count = 0;

        // Distribute ETH
        if (_includeETH && ethBalances[_inheritanceId] > 0) {
            ethAmount =
                (ethBalances[_inheritanceId] * _percentage) /
                BASIS_POINTS;
            if (ethAmount > 0) {
                withdrawETH(
                    _inheritanceId,
                    _beneficiary,
                    ethAmount,
                    "Asset distribution"
                );
            }
        }

        // Distribute ERC20 tokens
        for (uint256 i = 0; i < _erc20Tokens.length; i++) {
            address token = _erc20Tokens[i];
            uint256 balance = erc20Balances[_inheritanceId][token];

            if (balance > 0) {
                uint256 amount = (balance * _percentage) / BASIS_POINTS;
                if (amount > 0) {
                    withdrawERC20(
                        _inheritanceId,
                        token,
                        _beneficiary,
                        amount,
                        "Asset distribution"
                    );
                    erc20Count++;
                }
            }
        }

        // Distribute specific ERC721 tokens
        if (_erc721Contracts.length == _erc721TokenIds.length) {
            for (uint256 i = 0; i < _erc721Contracts.length; i++) {
                address nftContract = _erc721Contracts[i];
                uint256 tokenId = _erc721TokenIds[i];

                if (ownsERC721Token[_inheritanceId][nftContract][tokenId]) {
                    withdrawERC721(
                        _inheritanceId,
                        nftContract,
                        _beneficiary,
                        tokenId,
                        "Asset distribution"
                    );
                    erc721Count++;
                }
            }
        }

        emit AssetsDistributed(
            _inheritanceId,
            _beneficiary,
            ethAmount,
            erc20Count,
            erc721Count
        );
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Returns the ETH balance for an inheritance
     * @param _inheritanceId The inheritance ID
     */
    function getETHBalance(
        uint256 _inheritanceId
    ) external view returns (uint256) {
        return ethBalances[_inheritanceId];
    }

    /**
     * @dev Returns the ERC20 token balance for an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _token The ERC20 token address
     */
    function getERC20Balance(
        uint256 _inheritanceId,
        address _token
    ) external view returns (uint256) {
        return erc20Balances[_inheritanceId][_token];
    }

    /**
     * @dev Returns all ERC20 tokens held by an inheritance
     * @param _inheritanceId The inheritance ID
     */
    function getERC20Tokens(
        uint256 _inheritanceId
    )
        external
        view
        returns (address[] memory tokens, uint256[] memory balances)
    {
        address[] memory tokenList = erc20TokenList[_inheritanceId];
        tokens = new address[](tokenList.length);
        balances = new uint256[](tokenList.length);

        for (uint256 i = 0; i < tokenList.length; i++) {
            tokens[i] = tokenList[i];
            balances[i] = erc20Balances[_inheritanceId][tokenList[i]];
        }
    }

    /**
     * @dev Returns all ERC721 tokens held by an inheritance for a specific contract
     * @param _inheritanceId The inheritance ID
     * @param _nftContract The NFT contract address
     */
    function getERC721Tokens(
        uint256 _inheritanceId,
        address _nftContract
    ) external view returns (uint256[] memory tokenIds) {
        return erc721Tokens[_inheritanceId][_nftContract];
    }

    /**
     * @dev Returns all ERC721 contracts that have tokens in an inheritance
     * @param _inheritanceId The inheritance ID
     */
    function getERC721Contracts(
        uint256 _inheritanceId
    ) external view returns (address[] memory contracts) {
        return erc721ContractList[_inheritanceId];
    }

    /**
     * @dev Returns a complete asset summary for an inheritance
     * @param _inheritanceId The inheritance ID
     */
    function getAssetSummary(
        uint256 _inheritanceId
    )
        external
        view
        returns (
            uint256 ethBalance,
            uint256 erc20TokenCount,
            uint256 erc721TokenCount,
            address[] memory erc20Tokens,
            address[] memory erc721Contracts
        )
    {
        ethBalance = ethBalances[_inheritanceId];
        erc20Tokens = erc20TokenList[_inheritanceId];
        erc721Contracts = erc721ContractList[_inheritanceId];
        erc20TokenCount = erc20Tokens.length;
        erc721TokenCount = erc721Contracts.length;
    }

    /**
     * @dev Calculates distributable amounts for a beneficiary
     * @param _inheritanceId The inheritance ID
     * @param _percentage The beneficiary's percentage allocation
     */
    function calculateDistributableAmounts(
        uint256 _inheritanceId,
        uint256 _percentage
    )
        external
        view
        returns (
            uint256 ethAmount,
            address[] memory erc20Tokens,
            uint256[] memory erc20Amounts
        )
    {
        ethAmount = (ethBalances[_inheritanceId] * _percentage) / BASIS_POINTS;

        address[] memory tokenList = erc20TokenList[_inheritanceId];
        erc20Tokens = new address[](tokenList.length);
        erc20Amounts = new uint256[](tokenList.length);

        for (uint256 i = 0; i < tokenList.length; i++) {
            erc20Tokens[i] = tokenList[i];
            uint256 balance = erc20Balances[_inheritanceId][tokenList[i]];
            erc20Amounts[i] = (balance * _percentage) / BASIS_POINTS;
        }
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Removes an ERC721 token from storage
     * @param _inheritanceId The inheritance ID
     * @param _nftContract The NFT contract address
     * @param _tokenId The token ID to remove
     */
    function _removeERC721Token(
        uint256 _inheritanceId,
        address _nftContract,
        uint256 _tokenId
    ) internal {
        ownsERC721Token[_inheritanceId][_nftContract][_tokenId] = false;

        uint256[] storage tokens = erc721Tokens[_inheritanceId][_nftContract];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == _tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }

        totalERC721Deposited[_inheritanceId][_nftContract]--;
    }

    // ============ IERC721Receiver IMPLEMENTATION ============

    /**
     * @dev Handles the receipt of an NFT
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // ============ FALLBACK FUNCTIONS ============

    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {
        // ETH received without specifying inheritance ID goes to contract balance
        // This should be handled by specific deposit functions
        revert("Use depositETH function");
    }
}
