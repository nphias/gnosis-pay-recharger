// contracts/RechargeModule.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@gnosis-guild/zodiac/contracts/core/Module.sol";

abstract contract RechargeModule is Module {
    address public targetSafe;
    uint256 public amount;

    constructor(address _targetSafe, uint256 _amount) {
        targetSafe = _targetSafe;
        amount = _amount;
    }

    function sendRecharge() external {
        require(
            exec(targetSafe, amount, "", Enum.Operation.Call),
            "Native xDAI transfer failed"
        );
    }

    receive() external payable {}
}