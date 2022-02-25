pragma solidity ^0.5.13;

/**
 * @title contract that lists what stable coins are deployed as part of Celo's Stability protocol.
 */
contract StableTokenRegistry {
  mapping(string => string) public stableTokens;
  string[] public fiatTickers;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice adds fiat currencies to fiatTickers collection
   * @param currencyType the type of currency we're trying to push into the collection  
   */
  function addFiatTickers(string _currencyType) external onlyOwner {
    //also check if it already exists in the array, if it does then don't add
    //so I can make sure there are no dublicates
    require(!stableTokens[currencyType], "Stable token hasn't been issued");
    stableTokens[currencyType] = true;
    fiatTickers.push(currencyType);
  }

  /**
   * @notice Returns fiat currencies that have been issued.
   * @return A collection of currencies issued.
   */
  function getFiatTickers() external view returns (string[] memory) {
    return fiatTickers;
  }

  /**
   * @notice Returns all the contract instances created.
   * @return collection of stable token contracts.
   */

  function getContractInstances() external view returns (string[] memory) {
    string[] memory contracts;
    for (i = 0; i < fiatTickers.length; i++) {
      contracts.push(stableTokens[fiatTickers[i]]);
    }
    return contracts;
  }

  /**
   * @notice Removes unwamted token instances.
   * @param fiatType The type of currency that is no longer supported.
   * @param index The index in fiatTickers of fiatType.
   */
  function removeRegistry(string fiatType, uint256 index) external onlyowner {
    uint256 numFiats = fiatTickers.length;
    require(index < numFiats, "Index is invalid");
    require(fiatType == fiatTickers[index], "Index does not match fiat type");
    uint256 newNumFiats = numFiats.sub(1);

    if (index != newNumFiats) {
      fiatTickers[index] = fiatTickers[newNumFiats];
    }
    fiatTickers[newNumFiats] = "";
    fiatTickers.length = newNumFiats;
  }

  /**
   * @notice Gives an address permission to spend Reserve without limit.
   * @param spender The address that is allowed to spend Reserve funds.
   */

  function addNewRegistry(string fiatType, string contractType) external onlyOwner {
    require("" != fiatType, "fiatType cant be an empty string");
    require("" != contractType, "contractType cant be an empty string");
    require(stableTokens[fiatType] != "", "This registry already exists");
    stableTokens[fiatType] = contractType;
    fiatTickers.push(fiatType);
  }

}