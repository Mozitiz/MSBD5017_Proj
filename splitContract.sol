// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract SplitPayment is ReentrancyGuard {
    using ECDSA for bytes32;

    struct Room {
        address owner;
        uint256 totalAmount;
        address[] members;
        uint256 amountPerMember;
        bool isActive;
        mapping(address => bool) isMember;
        mapping(address => bool) hasSigned;
        address[] selectedSigners;
        uint256 signatureCount;
        bool isPaid;
    }

    mapping(uint256 => Room) public rooms;
    uint256 public roomCount;

    event RoomCreated(uint256 roomId, address owner);
    event MemberJoined(uint256 roomId, address member);
    event SignersSelected(uint256 roomId, address[] signers);
    event SignatureProvided(uint256 roomId, address signer);
    event PaymentCompleted(uint256 roomId);

    // 创建房间
    function createRoom(uint256 _totalAmount) external returns (uint256) {
        require(_totalAmount > 0, "Amount must be greater than 0");
        
        roomCount++;
        Room storage newRoom = rooms[roomCount];
        newRoom.owner = msg.sender;
        newRoom.totalAmount = _totalAmount;
        newRoom.isActive = true;
        newRoom.members.push(msg.sender);
        newRoom.isMember[msg.sender] = true;
        
        emit RoomCreated(roomCount, msg.sender);
        return roomCount;
    }

    // 加入房间
    function joinRoom(uint256 _roomId) external {
        Room storage room = rooms[_roomId];
        require(room.isActive, "Room does not exist");
        require(!room.isMember[msg.sender], "Already a member");
        require(!room.isPaid, "Room is already paid");

        room.members.push(msg.sender);
        room.isMember[msg.sender] = true;
        
        // 更新每个成员应付金额
        if (room.totalAmount > 0) {
            room.amountPerMember = room.totalAmount / room.members.length;
        }
        
        emit MemberJoined(_roomId, msg.sender);
    }

    // 随机选择签名者
    function selectSigners(uint256 _roomId) external {
        Room storage room = rooms[_roomId];
        require(msg.sender == room.owner, "Only owner can select signers");
        require(room.members.length >= 3, "Need at least 3 members");
        require(room.selectedSigners.length == 0, "Signers already selected");

        // 总是包含房主
        room.selectedSigners.push(room.owner);
        
        // 使用区块信息作为随机源选择1-2个其他签名者
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty)));
        uint256 numberOfSigners = (randomNumber % 2) + 1; // 1或2个额外签名者
        
        uint256[] memory indices = new uint256[](room.members.length - 1);
        uint256 count = 0;
        
        // 创建不包含房主的成员索引数组
        for (uint256 i = 0; i < room.members.length; i++) {
            if (room.members[i] != room.owner) {
                indices[count] = i;
                count++;
            }
        }
        
        // 选择随机签名者
        for (uint256 i = 0; i < numberOfSigners && i < count; i++) {
            uint256 selectedIndex = uint256(keccak256(abi.encodePacked(randomNumber, i))) % (count - i);
            room.selectedSigners.push(room.members[indices[selectedIndex]]);
            // 交换选中的索引到数组末尾
            uint256 temp = indices[selectedIndex];
            indices[selectedIndex] = indices[count - 1 - i];
            indices[count - 1 - i] = temp;
        }
        
        emit SignersSelected(_roomId, room.selectedSigners);
    }

    // 提供签名
    function provideSignature(uint256 _roomId) external {
        Room storage room = rooms[_roomId];
        require(room.isActive, "Room is not active");
        require(!room.isPaid, "Payment already completed");
        
        bool isSelectedSigner = false;
        for (uint256 i = 0; i < room.selectedSigners.length; i++) {
            if (room.selectedSigners[i] == msg.sender) {
                isSelectedSigner = true;
                break;
            }
        }
        require(isSelectedSigner, "Not selected as signer");
        require(!room.hasSigned[msg.sender], "Already signed");

        room.hasSigned[msg.sender] = true;
        room.signatureCount++;
        
        emit SignatureProvided(_roomId, msg.sender);

        // 检查是否所有签名都已收集
        if (room.signatureCount == room.selectedSigners.length) {
            _completePayment(_roomId);
        }
    }

    // 完成支付
    function _completePayment(uint256 _roomId) internal nonReentrant {
        Room storage room = rooms[_roomId];
        require(!room.isPaid, "Payment already completed");
        require(room.signatureCount == room.selectedSigners.length, "Not all signatures collected");

        // 将合约金额转给房主
        payable(room.owner).transfer(room.totalAmount);
        room.isPaid = true;
        room.isActive = false;
        
        emit PaymentCompleted(_roomId);
    }

    // 查看房间信息
    function getRoomInfo(uint256 _roomId) external view returns (
        address owner,
        uint256 totalAmount,
        uint256 amountPerMember,
        address[] memory members,
        address[] memory selectedSigners,
        uint256 signatureCount,
        bool isPaid
    ) {
        Room storage room = rooms[_roomId];
        return (
            room.owner,
            room.totalAmount,
            room.amountPerMember,
            room.members,
            room.selectedSigners,
            room.signatureCount,
            room.isPaid
        );
    }

    // 接收ETH
    receive() external payable {}
}