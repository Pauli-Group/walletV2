## EIP 4337 Notes

### Entry point upgrading
    Entry Point address should be hardcoded to the contract. The contract should be an upgradeable proxy. To switch to a new entry point we should upgrade to a new code address.

    - Entry point should be hardcoded
    - Account should be an upgradeable proxy