// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title USDTPayment
 * @dev Handles USDT BEP20 payments and transfers directly to an admin wallet.
 */
contract USDTPayment is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdtToken;
    address public adminWallet;
    
    // Mapping to track used payment IDs to prevent replay attacks
    mapping(uint256 => bool) public usedPaymentIds;

    event Deposit(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 paymentId
    );

    event AdminWalletUpdated(address indexed oldAdmin, address indexed newAdmin);

    /**
     * @param _usdtToken Address of USDT BEP20 token
     * @param _adminWallet Initial admin wallet to receive funds
     */
    constructor(address _usdtToken, address _adminWallet) Ownable(msg.sender) {
        require(_usdtToken != address(0), "Invalid USDT address");
        require(_adminWallet != address(0), "Invalid admin address");
        usdtToken = IERC20(_usdtToken);
        adminWallet = _adminWallet;
    }

    /**
     * @dev Process a USDT deposit
     * @param paymentId Unique ID for the payment (provided by backend)
     * @param amount Amount of USDT to pay (in 18 decimals)
     */
    function deposit(uint256 paymentId, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(!usedPaymentIds[paymentId], "Payment ID already used");
        require(adminWallet != address(0), "Admin wallet not set");

        // Mark payment ID as used
        usedPaymentIds[paymentId] = true;

        // Transfer USDT directly from user to admin wallet
        usdtToken.safeTransferFrom(msg.sender, adminWallet, amount);

        emit Deposit(msg.sender, adminWallet, amount, paymentId);
    }

    /**
     * @dev Update the admin wallet address
     * @param _newAdmin New admin wallet address
     */
    function setAdmin(address _newAdmin) external onlyOwner {
        require(_newAdmin != address(0), "Invalid address");
        address oldAdmin = adminWallet;
        adminWallet = _newAdmin;
        emit AdminWalletUpdated(oldAdmin, _newAdmin);
    }

    /**
     * @dev Rescue any ERC20 tokens accidentally sent to this contract (except USDT)
     * @param token Address of the token
     * @param amount Amount to rescue
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        require(token != address(usdtToken), "Cannot rescue USDT");
        IERC20(token).safeTransfer(owner(), amount);
    }
}
