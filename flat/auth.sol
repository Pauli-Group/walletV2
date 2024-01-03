// Sources flattened with hardhat v2.14.0 https://hardhat.org

// File @openzeppelin/contracts/utils/Context.sol@v4.9.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Context.sol)

pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v4.9.0

// OpenZeppelin Contracts (last updated v4.9.0) (access/Ownable.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/utils/Address.sol@v4.9.0

// OpenZeppelin Contracts (last updated v4.9.0) (utils/Address.sol)

pragma solidity ^0.8.1;

/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     *
     * Furthermore, `isContract` will also return true if the target contract within
     * the same transaction is already scheduled for destruction by `SELFDESTRUCT`,
     * which only has an effect at the end of a transaction.
     * ====
     *
     * [IMPORTANT]
     * ====
     * You shouldn't rely on `isContract` to protect against flash loan attacks!
     *
     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets
     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract
     * constructor.
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.8.0/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason, it is bubbled up by this
     * function (like regular Solidity function calls).
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     *
     * _Available since v3.1._
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, "Address: low-level call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
     * `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    /**
     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
     * with `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Tool to verify that a low level call to smart-contract was successful, and revert (either by bubbling
     * the revert reason or using the provided one) in case of unsuccessful call or if target was not a contract.
     *
     * _Available since v4.8._
     */
    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        if (success) {
            if (returndata.length == 0) {
                // only check isContract if the call was successful and the return data is empty
                // otherwise we already know that it was a contract
                require(isContract(target), "Address: call to non-contract");
            }
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    /**
     * @dev Tool to verify that a low level call was successful, and revert if it wasn't, either by bubbling the
     * revert reason or using the provided one.
     *
     * _Available since v4.3._
     */
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    function _revert(bytes memory returndata, string memory errorMessage) private pure {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            /// @solidity memory-safe-assembly
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert(errorMessage);
        }
    }
}


// File @openzeppelin/contracts/proxy/utils/Initializable.sol@v4.9.0

// OpenZeppelin Contracts (last updated v4.9.0) (proxy/utils/Initializable.sol)

pragma solidity ^0.8.2;

/**
 * @dev This is a base contract to aid in writing upgradeable contracts, or any kind of contract that will be deployed
 * behind a proxy. Since proxied contracts do not make use of a constructor, it's common to move constructor logic to an
 * external initializer function, usually called `initialize`. It then becomes necessary to protect this initializer
 * function so it can only be called once. The {initializer} modifier provided by this contract will have this effect.
 *
 * The initialization functions use a version number. Once a version number is used, it is consumed and cannot be
 * reused. This mechanism prevents re-execution of each "step" but allows the creation of new initialization steps in
 * case an upgrade adds a module that needs to be initialized.
 *
 * For example:
 *
 * [.hljs-theme-light.nopadding]
 * ```solidity
 * contract MyToken is ERC20Upgradeable {
 *     function initialize() initializer public {
 *         __ERC20_init("MyToken", "MTK");
 *     }
 * }
 *
 * contract MyTokenV2 is MyToken, ERC20PermitUpgradeable {
 *     function initializeV2() reinitializer(2) public {
 *         __ERC20Permit_init("MyToken");
 *     }
 * }
 * ```
 *
 * TIP: To avoid leaving the proxy in an uninitialized state, the initializer function should be called as early as
 * possible by providing the encoded function call as the `_data` argument to {ERC1967Proxy-constructor}.
 *
 * CAUTION: When used with inheritance, manual care must be taken to not invoke a parent initializer twice, or to ensure
 * that all initializers are idempotent. This is not verified automatically as constructors are by Solidity.
 *
 * [CAUTION]
 * ====
 * Avoid leaving a contract uninitialized.
 *
 * An uninitialized contract can be taken over by an attacker. This applies to both a proxy and its implementation
 * contract, which may impact the proxy. To prevent the implementation contract from being used, you should invoke
 * the {_disableInitializers} function in the constructor to automatically lock it when it is deployed:
 *
 * [.hljs-theme-light.nopadding]
 * ```
 * /// @custom:oz-upgrades-unsafe-allow constructor
 * constructor() {
 *     _disableInitializers();
 * }
 * ```
 * ====
 */
abstract contract Initializable {
    /**
     * @dev Indicates that the contract has been initialized.
     * @custom:oz-retyped-from bool
     */
    uint8 private _initialized;

    /**
     * @dev Indicates that the contract is in the process of being initialized.
     */
    bool private _initializing;

    /**
     * @dev Triggered when the contract has been initialized or reinitialized.
     */
    event Initialized(uint8 version);

    /**
     * @dev A modifier that defines a protected initializer function that can be invoked at most once. In its scope,
     * `onlyInitializing` functions can be used to initialize parent contracts.
     *
     * Similar to `reinitializer(1)`, except that functions marked with `initializer` can be nested in the context of a
     * constructor.
     *
     * Emits an {Initialized} event.
     */
    modifier initializer() {
        bool isTopLevelCall = !_initializing;
        require(
            (isTopLevelCall && _initialized < 1) || (!Address.isContract(address(this)) && _initialized == 1),
            "Initializable: contract is already initialized"
        );
        _initialized = 1;
        if (isTopLevelCall) {
            _initializing = true;
        }
        _;
        if (isTopLevelCall) {
            _initializing = false;
            emit Initialized(1);
        }
    }

    /**
     * @dev A modifier that defines a protected reinitializer function that can be invoked at most once, and only if the
     * contract hasn't been initialized to a greater version before. In its scope, `onlyInitializing` functions can be
     * used to initialize parent contracts.
     *
     * A reinitializer may be used after the original initialization step. This is essential to configure modules that
     * are added through upgrades and that require initialization.
     *
     * When `version` is 1, this modifier is similar to `initializer`, except that functions marked with `reinitializer`
     * cannot be nested. If one is invoked in the context of another, execution will revert.
     *
     * Note that versions can jump in increments greater than 1; this implies that if multiple reinitializers coexist in
     * a contract, executing them in the right order is up to the developer or operator.
     *
     * WARNING: setting the version to 255 will prevent any future reinitialization.
     *
     * Emits an {Initialized} event.
     */
    modifier reinitializer(uint8 version) {
        require(!_initializing && _initialized < version, "Initializable: contract is already initialized");
        _initialized = version;
        _initializing = true;
        _;
        _initializing = false;
        emit Initialized(version);
    }

    /**
     * @dev Modifier to protect an initialization function so that it can only be invoked by functions with the
     * {initializer} and {reinitializer} modifiers, directly or indirectly.
     */
    modifier onlyInitializing() {
        require(_initializing, "Initializable: contract is not initializing");
        _;
    }

    /**
     * @dev Locks the contract, preventing any future reinitialization. This cannot be part of an initializer call.
     * Calling this in the constructor of a contract will prevent that contract from being initialized or reinitialized
     * to any version. It is recommended to use this to lock implementation contracts that are designed to be called
     * through proxies.
     *
     * Emits an {Initialized} event the first time it is successfully executed.
     */
    function _disableInitializers() internal virtual {
        require(!_initializing, "Initializable: contract is initializing");
        if (_initialized != type(uint8).max) {
            _initialized = type(uint8).max;
            emit Initialized(type(uint8).max);
        }
    }

    /**
     * @dev Returns the highest version that has been initialized. See {reinitializer}.
     */
    function _getInitializedVersion() internal view returns (uint8) {
        return _initialized;
    }

    /**
     * @dev Returns `true` if the contract is currently initializing. See {onlyInitializing}.
     */
    function _isInitializing() internal view returns (bool) {
        return _initializing;
    }
}


// File @openzeppelin/contracts/proxy/Clones.sol@v4.9.0

// OpenZeppelin Contracts (last updated v4.9.0) (proxy/Clones.sol)

pragma solidity ^0.8.0;

/**
 * @dev https://eips.ethereum.org/EIPS/eip-1167[EIP 1167] is a standard for
 * deploying minimal proxy contracts, also known as "clones".
 *
 * > To simply and cheaply clone contract functionality in an immutable way, this standard specifies
 * > a minimal bytecode implementation that delegates all calls to a known, fixed address.
 *
 * The library includes functions to deploy a proxy using either `create` (traditional deployment) or `create2`
 * (salted deterministic deployment). It also includes functions to predict the addresses of clones deployed using the
 * deterministic method.
 *
 * _Available since v3.4._
 */
library Clones {
    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `implementation`.
     *
     * This function uses the create opcode, which should never revert.
     */
    function clone(address implementation) internal returns (address instance) {
        /// @solidity memory-safe-assembly
        assembly {
            // Cleans the upper 96 bits of the `implementation` word, then packs the first 3 bytes
            // of the `implementation` address with the bytecode before the address.
            mstore(0x00, or(shr(0xe8, shl(0x60, implementation)), 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000))
            // Packs the remaining 17 bytes of `implementation` with the bytecode after the address.
            mstore(0x20, or(shl(0x78, implementation), 0x5af43d82803e903d91602b57fd5bf3))
            instance := create(0, 0x09, 0x37)
        }
        require(instance != address(0), "ERC1167: create failed");
    }

    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `implementation`.
     *
     * This function uses the create2 opcode and a `salt` to deterministically deploy
     * the clone. Using the same `implementation` and `salt` multiple time will revert, since
     * the clones cannot be deployed twice at the same address.
     */
    function cloneDeterministic(address implementation, bytes32 salt) internal returns (address instance) {
        /// @solidity memory-safe-assembly
        assembly {
            // Cleans the upper 96 bits of the `implementation` word, then packs the first 3 bytes
            // of the `implementation` address with the bytecode before the address.
            mstore(0x00, or(shr(0xe8, shl(0x60, implementation)), 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000))
            // Packs the remaining 17 bytes of `implementation` with the bytecode after the address.
            mstore(0x20, or(shl(0x78, implementation), 0x5af43d82803e903d91602b57fd5bf3))
            instance := create2(0, 0x09, 0x37, salt)
        }
        require(instance != address(0), "ERC1167: create2 failed");
    }

    /**
     * @dev Computes the address of a clone deployed using {Clones-cloneDeterministic}.
     */
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt,
        address deployer
    ) internal pure returns (address predicted) {
        /// @solidity memory-safe-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(add(ptr, 0x38), deployer)
            mstore(add(ptr, 0x24), 0x5af43d82803e903d91602b57fd5bf3ff)
            mstore(add(ptr, 0x14), implementation)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73)
            mstore(add(ptr, 0x58), salt)
            mstore(add(ptr, 0x78), keccak256(add(ptr, 0x0c), 0x37))
            predicted := keccak256(add(ptr, 0x43), 0x55)
        }
    }

    /**
     * @dev Computes the address of a clone deployed using {Clones-cloneDeterministic}.
     */
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt
    ) internal view returns (address predicted) {
        return predictDeterministicAddress(implementation, salt, address(this));
    }
}


// File contracts/Authenticator/KeyFeeBeacon.sol

pragma solidity ^0.8.12;

interface IKeyFeeBeacon {
	function setKeyAdditionFee(uint256 _keyAdditionFee) external;

	function getKeyAdditionFee() external view returns (uint256);

	function setProfitAddress(address _profitAddress) external;

	function getProfitAddress() external view returns (address);
}

/*
    @name KeyFeeBeacon
    @description stores the key addition fee and the profit address
    @date March 9th 2023
    @author William Doyle
 */
contract KeyFeeBeacon is Ownable, IKeyFeeBeacon{
	event FeeChanged(uint256 indexed oldFee, uint256 indexed newFee);
	event ProfitAddressChanged(address indexed oldAddress, address indexed newAddress);

	uint256 keyAdditionFee;
	address profitAddress;

	constructor (address operator, uint256 _keyAdditionFee) {
		_transferOwnership(operator);
		profitAddress = 0x4f171744973047296d90e7828676F4972faFB200;
		keyAdditionFee = _keyAdditionFee;
	}

	function setKeyAdditionFee(uint256 _keyAdditionFee) public onlyOwner {
		uint256 old = keyAdditionFee;
		keyAdditionFee = _keyAdditionFee;
		emit FeeChanged(old, keyAdditionFee);
	}

	function getKeyAdditionFee() public view returns (uint256) {
		return keyAdditionFee;
	}

	function setProfitAddress(address _profitAddress) public onlyOwner {
		address old = profitAddress;
		profitAddress = _profitAddress;
		emit ProfitAddressChanged(old, profitAddress);
	}

	function getProfitAddress() public view returns (address) {
		return profitAddress;
	}
}


// File contracts/Authenticator/Authenticator.sol

pragma solidity ^0.8.12;





abstract contract LamportBase {
    using Address for address payable;

    enum PublicKeyHashUsageStatus {
        UNUSED,
        POSTED,
        REDEEMED
    }

    event AddedPublicKeyHashes(uint256 indexed countLive);
    event RemovedPublicKeyHashes(uint256 indexed countLive);

    IKeyFeeBeacon internal _keyFeeBeacon;

    mapping(address => bool) internal approvedCallers;
    mapping(bytes32 => PublicKeyHashUsageStatus) publicKeyHashes;
    uint256 public liveKeyCount;

    /*
		@name isApprovedCaller
		@description checks if an address is approved to make calls to this contract 
		@date Febuary 17th 2023
		@author William Doyle
	*/
    function isApprovedCaller(address caller) public view returns (bool) {
        return approvedCallers[caller];
    }

    /*
		@name _approveCaller
		@description approves an address to make calls to this contract 
		@date Febuary 17th 2023
		@author William Doyle
	*/
    function _approveCaller(address caller) internal {
        approvedCallers[caller] = true;
    }

    /*
		@name approveCallers
		@description approves an array of addresses to make calls to this contract
		@date Febuary 17th 2023
		@author William Doyle
	*/
    function approveCallers(
        address[] calldata callers,
        bytes32[2][256] calldata publicKey,
        bytes[256] calldata signature
    )
        public
        redeemLamport(
            publicKey,
            signature,
            abi.encodePacked(callers, hex"fb895820")
        )
    {
        unchecked {
            for (uint256 i = 0; i < callers.length; i++) {
                _approveCaller(callers[i]);
            }
        }
    }

    /*
		@name unapproveCallers
		@description unapproves an array of addresses to make calls to this contract
		@date Febuary 17th 2023
		@author William Doyle
	*/
    function unapproveCallers(
        address[] calldata callers,
        bytes32[2][256] calldata publicKey,
        bytes[256] calldata signature
    )
        public
        redeemLamport(
            publicKey,
            signature,
            abi.encodePacked(callers, hex"11e25162")
        )
    {
        unchecked {
            for (uint256 i = 0; i < callers.length; i++) {
                _unapproveCaller(callers[i]);
            }
        }
    }

    /*
		@name _unapproveCaller
		@description unapproves an address to make calls to this contract
		@date Febuary 17th 2023
		@author William Doyle
	*/
    function _unapproveCaller(address caller) internal {
        require(caller != msg.sender, "LB:E3"); // LamportBaseA: Cannot unapprove self
        approvedCallers[caller] = false;
    }

    /*
        @name isRedeemable
        @description checks if a public key hash is redeemable
        @date December 5th 2022
        @author William Doyle
    */
    function isRedeemable(bytes32 publicKeyHash) public view returns (bool) {
        return
            publicKeyHashes[publicKeyHash] == PublicKeyHashUsageStatus.POSTED;
    }

    // lamport 'verify' logic
    function verify_u256(
        uint256 bits,
        bytes[256] calldata sig,
        bytes32[2][256] calldata pub
    ) public pure returns (bool) {
        unchecked {
            for (uint256 i = 0; i < 256; i++) {
                if (pub[i][(bits >> (255 - i)) & 1] != keccak256(sig[i])) {
                    return false;
                }
            }

            return true;
        }
    }

    /*
        @name redeemLamport
        @description a modifier that checks the sender has provided a valid lamport signature and marks the relevent public key hash as redeemed
        @date December 5th 2022
        @author William Doyle
		@todo consider adding a value to be included in the signed hash to signed message can only be used to call intended function
     */
    modifier redeemLamport(
        bytes32[2][256] calldata publicKey,
        bytes[256] calldata signature,
        bytes memory prepackedMessageData
    ) {
        require(isApprovedCaller(msg.sender), "LB:E6"); // LamportBaseA: caller not approved
        require(liveKeyCount > 0, "LB:E7"); //  LamportBaseA: not initialized or no remaining public key hashes
        bytes32 publicKeyHash = keccak256(abi.encodePacked(publicKey));

        require(isRedeemable(publicKeyHash), "LB:E8"); // LamportBaseA: currentpub does not have a redeemable public key hash
        require(
            verify_u256(
                uint256(keccak256(prepackedMessageData)),
                signature,
                publicKey
            ),
            "LB:E9"
        ); // LamportBaseA: Signature not valid

        _removeSinglePublicKeyHash(publicKeyHash);
        emit RemovedPublicKeyHashes(liveKeyCount);

        _;
    }

    /*
        @name _addSinglePublicKeyHash
        @description adds a single public key hash to the mapping
        @date December 5th 2022
        @author William Doyle
    */
    function _addSinglePublicKeyHash(bytes32 publicKeyHashToAdd) internal {
        require(
            publicKeyHashes[publicKeyHashToAdd] ==
                PublicKeyHashUsageStatus.UNUSED,
            "LB:E10"
        ); // LamportBaseA: Public Key Hash Already Exists

        publicKeyHashes[publicKeyHashToAdd] = PublicKeyHashUsageStatus.POSTED;
        liveKeyCount++;
    }

    /*
        @name _addPublicKeyHashes
        @description adds a list of public key hashes to the contract
        @date December 5th 2022
        @author William Doyle
    */
    function _addPublicKeyHashes(
        bytes32[] memory publicKeyHashesToAdd
    ) internal {
        unchecked {
            for (uint256 i = 0; i < publicKeyHashesToAdd.length; i++) {
                _addSinglePublicKeyHash(publicKeyHashesToAdd[i]);
            }

            emit AddedPublicKeyHashes(liveKeyCount);
        }
    }

    /*
		@name getKeyAdditionFee
		@description gets the current key addition fee'
		@date March 10th 2023
		@author William Doyle
	*/
    function getKeyAdditionFee() public view returns (uint256) {
        if (address(_keyFeeBeacon) == address(0)) {
            return 0;
        }
        return _keyFeeBeacon.getKeyAdditionFee();
    }

    /*
		@name getProfitAddress
		@description gets the current profit address
		@date March 10th 2023
		@author William Doyle
	*/
    function getProfitAddress() public view returns (address) {
        if (address(_keyFeeBeacon) == address(0)) {
            return address(0);
        }
        return _keyFeeBeacon.getProfitAddress();
    }

    function getKeyFeeBeacon() public view returns (address) {
        return address(_keyFeeBeacon);
    }

    /*
	    @name addPublicKeyHashes
	    @description adds a list of public key hashes to the contract
	    @date December 5th 2022
	    @author William Doyle
	*/
    function addPublicKeyHashes(
        bytes32[] memory publicKeyHashesToAdd,
        bytes32[2][256] calldata publicKey,
        bytes[256] calldata signature
    )
        public
        payable
        redeemLamport(
            publicKey,
            signature,
            abi.encodePacked(publicKeyHashesToAdd, hex"341a3860")
        )
    {
        uint256 keyAdditionFee = getKeyAdditionFee();
        require(msg.value == keyAdditionFee, "LB:E11"); //  "LamportBaseA: Must Include Key Addition Fee"

        if (keyAdditionFee == 0) {
            // No Fee --> Skip Additional Logic
            _addPublicKeyHashes(publicKeyHashesToAdd);
            return;
        }

        _addPublicKeyHashes(publicKeyHashesToAdd);

        address profitAddress = getProfitAddress();
        payable(profitAddress).sendValue(keyAdditionFee);
        // don't revert if the transfer fails
    }

    /*
        @name _removeSinglePublicKeyHash
        @description removes a single public key hash from the mapping
        @date December 5th 2022
        @author William Doyle
    */
    function _removeSinglePublicKeyHash(
        bytes32 publicKeyHashToRemove
    ) internal {
        require(
            publicKeyHashes[publicKeyHashToRemove] ==
                PublicKeyHashUsageStatus.POSTED,
            "LB:E12"
        ); // LamportBaseA: Public Key Hash Not Posted Or Already Redeemed

        publicKeyHashes[publicKeyHashToRemove] = PublicKeyHashUsageStatus
            .REDEEMED;
        liveKeyCount--;
    }

    /*
        @name _removePublicKeyHashes
        @description removes a list of public key hashes from the contract
        @date December 5th 2022
        @author William Doyle
    */
    function _removePublicKeyHashes(
        bytes32[] memory publicKeyHashesToRemove
    ) internal {
        unchecked {
            for (uint256 i = 0; i < publicKeyHashesToRemove.length; i++) {
                _removeSinglePublicKeyHash(publicKeyHashesToRemove[i]);
            }

            emit RemovedPublicKeyHashes(liveKeyCount);
        }
    }

    /*
        @name removePublicKeyHashes
        @description removes a list of public key hashes from the contract
        @date December 5th 2022
        @author William Doyle
    */
    function removePublicKeyHashes(
        bytes32[] memory publicKeyHashesToRemove,
        bytes32[2][256] calldata publicKey,
        bytes[256] calldata signature
    )
        public
        redeemLamport(
            publicKey,
            signature,
            abi.encodePacked(publicKeyHashesToRemove, hex"46f5b4ad")
        )
    {
        _removePublicKeyHashes(publicKeyHashesToRemove);
    }
}

contract LambBedrockAuthentication is LamportBase, Initializable {
    mapping(bytes32 => bool) public endorsedMessages;

    constructor(bool isMain) {
        if (isMain) {
            _disableInitializers();
        }
    }

    function initialize(
        bytes32[] memory firstLamportKeys,
        address[] calldata callers,
        IKeyFeeBeacon keyFeeBeacon
    ) public virtual initializer {
        _addPublicKeyHashes(firstLamportKeys);

        for (uint256 i = 0; i < callers.length; i++) {
            approvedCallers[callers[i]] = true;
        }

        _keyFeeBeacon = keyFeeBeacon;
    }

    /*
        @name endorseMessage
        @description takes message hash and signature details, checks signature details, and if valid, marks message as signed
        @date January 2nd 2023
        @author William Doyle
     */
    function endorseMessage(
        bytes32 message,
        bytes32[2][256] calldata publicKey,
        bytes[256] calldata signature
    )
        public
        redeemLamport(
            publicKey,
            signature,
            abi.encodePacked(message, hex"227ca88d")
        )
    {
        endorsedMessages[message] = true;
    }

    /*
        @name isValidSignature
        @description fits the ERC1271 standard as closely as possible while remaining quantum secure
        @date Febuary 15th 2023
        @author William Doyle
     */
    // solhint-disable-next-line unused-arguments
    function isValidSignature(
        bytes32 hash,
        bytes memory missing
    ) public view returns (bytes4) {
        if (endorsedMessages[hash]) {
            return 0x1626ba7e;
        }
        return 0xffffffff;
    }
}

// TODO:
// 2. Stop using Constants library

contract LambBedrockAuthenticationFactory {
    IKeyFeeBeacon keyFeeBeacon;
    address logic;
    event AccountCreated(address indexed account);

    constructor(address operator, uint256 keyAdditionFee) {
        logic = address(new LambBedrockAuthentication(true));
        keyFeeBeacon = new KeyFeeBeacon(operator, keyAdditionFee);
    }

    function createAccount(
        bytes32[] memory firstLamportKeys,
        address[] calldata callersToApprove
    ) public {
        bytes32 salt = keccak256(
            abi.encodePacked(block.chainid, firstLamportKeys, callersToApprove)
        );

        address proxy = Clones.cloneDeterministic(logic, salt);
        LambBedrockAuthentication(payable(proxy)).initialize(
            firstLamportKeys,
            callersToApprove,
            keyFeeBeacon
        );

        emit AccountCreated(proxy);
        return;
    }

    function getAddress(
        bytes32[] memory firstLamportKeys,
        address[] calldata callersToApprove
    ) public view returns (address) {
        bytes32 salt = keccak256(
            abi.encodePacked(block.chainid, firstLamportKeys, callersToApprove)
        );

        return Clones.predictDeterministicAddress(logic, salt);
    }
}
