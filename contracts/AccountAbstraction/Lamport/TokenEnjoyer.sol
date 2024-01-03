// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Sender.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "erc-payable-token/contracts/token/ERC1363/IERC1363Spender.sol";
import "erc-payable-token/contracts/token/ERC1363/IERC1363Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "erc-payable-token/contracts/token/ERC1363/ERC1363.sol";

contract TokenEnjoyer is
    ERC165,
    IERC777Recipient,
    IERC777Sender,
    ERC721Holder,
    ERC1155Holder,
    IERC1363Receiver,
    IERC1363Spender
{
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155Receiver, ERC165) returns (bool) {
        return
            interfaceId == type(IERC777Recipient).interfaceId ||
            interfaceId == type(IERC777Sender).interfaceId ||
            interfaceId == type(IERC721Receiver).interfaceId ||
            interfaceId == type(IERC1363Receiver).interfaceId ||
            interfaceId == type(IERC1363Spender).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * ERC777 - on receive
     */
    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external override {}

    /**
     * ERC777 - on send
     */
    function tokensToSend(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external override {}

    /**
     * ERC1362
     */
    function onApprovalReceived(
        address sender,
        uint256 amount,
        bytes calldata data
    ) external override returns (bytes4) {
        return bytes4(keccak256("onApprovalReceived(address,uint256,bytes)"));
    }

    /**
     * ERC1362
     */
    function onTransferReceived(
        address spender,
        address sender,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes4) {
        return
            bytes4(
                keccak256("onTransferReceived(address,address,uint256,bytes)")
            );
    }
}
