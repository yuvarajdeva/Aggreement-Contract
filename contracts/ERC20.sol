// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Nextrope is ERC20 {
    constructor() ERC20("Nextrope", "NXT") {
        _mint(msg.sender, 1000 * 10**decimals());
    }
}
