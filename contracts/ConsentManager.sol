// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ConsentManager {
    // Mapping from childId to providerId to boolean (hasAccess)
    mapping(string => mapping(string => bool)) public hasAccess;
    
    event ConsentGranted(string indexed childId, string indexed providerId, uint256 timestamp);
    event ConsentRevoked(string indexed childId, string indexed providerId, uint256 timestamp);

    /**
     * @dev Grant access to a specific provider for a child's data
     * @param childId The unique ID of the child (e.g. Firebase ID)
     * @param providerId The unique ID of the doctor or teacher
     */
    function grantAccess(string memory childId, string memory providerId) public {
        hasAccess[childId][providerId] = true;
        emit ConsentGranted(childId, providerId, block.timestamp);
    }

    /**
     * @dev Revoke access from a specific provider for a child's data
     * @param childId The unique ID of the child
     * @param providerId The unique ID of the doctor or teacher
     */
    function revokeAccess(string memory childId, string memory providerId) public {
        hasAccess[childId][providerId] = false;
        emit ConsentRevoked(childId, providerId, block.timestamp);
    }

    /**
     * @dev Check if a provider has access to a child's data
     * @param childId The unique ID of the child
     * @param providerId The unique ID of the doctor or teacher
     * @return bool True if the provider has access, false otherwise
     */
    function checkAccess(string memory childId, string memory providerId) public view returns (bool) {
        return hasAccess[childId][providerId];
    }
}
