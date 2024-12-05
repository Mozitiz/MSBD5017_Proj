//SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// 导入所需的OpenZeppelin合约
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";  // 防止重入攻击
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";  // 用于签名验证
import "@openzeppelin/contracts/utils/Strings.sol";            // 用于字符串操作

contract SplitPayment is ReentrancyGuard {
    using ECDSA for bytes32;
    using Strings for uint256;

    // 房间结构体，存储所有房间相关信息
    struct Room {
        address owner;              // 房主地址
        uint256 totalAmount;        // 总金额
        uint256 depositAmount;      // 每个成员需要预存的定金金额
        address[] members;          // 成员列表数组
        uint256 amountPerMember;    // 每个成员应付金额
        uint256 paymentAmount;      // 房间支付金额
        bool isActive;              // 房间是否处于活跃状态
        mapping(address => bool) isMember;     // 记录地址是否是成员
        mapping(address => bool) hasSigned;    // 记录地址是否已签名
        mapping(address => uint256) memberDeposits; // 记录每个成员的预存金额
        address[] selectedSigners;             // 被选中的签名者列表
        uint256 signatureCount;     // 已收集的签名数量
        bool isPaid;                // 是否已完成支付
        string roomCode;            // 房间号（两字母+四数字）
    }

    // 状态变量声明
    mapping(string => uint256) public roomCodeToId;  // 房间号到房间ID的映射
    mapping(uint256 => Room) public rooms;           // 房间ID到房间结构体的映射
    uint256 public currentRoomId;                    // 当前房间ID（递增）
    uint256 public constant MINIMUM_BALANCE = 0.0000002 ether;  // 最小余额要求
    bool public roomExists;                          // 是否存在活跃房间的标志

    // 事件声明
    event RoomCreated(uint256 roomId, address owner, string roomCode, uint256 depositAmount);
    event MemberJoined(uint256 roomId, address member, uint256 depositAmount);
    event DepositRefunded(uint256 roomId, address member, uint256 amount);
    event SignersSelected(uint256 roomId, address[] signers);
    event SignatureProvided(uint256 roomId, address signer);
    event PaymentCompleted(uint256 roomId);

    // 其他函数保持不变...


/**
     * @dev 检查用户余额是否满足最小要求的修饰器
     * 验证条件：
     * 1. 钱包总余额大于最小余额要求
     * 2. 钱包余额足以支付房间定金
     */
    modifier checkBalance() {
        // 检查总余额是否满足最低要求
        require(msg.sender.balance >= MINIMUM_BALANCE, "Insufficient balance: need at least 0.0000002 ETH");
        
        // 如果正在创建房间，检查是否有足够的余额支付总金额
        if (msg.sig == this.createRoom.selector) {
            // 获取函数参数中的总金额和定金
            (uint256 totalAmount, uint256 depositAmount) = abi.decode(msg.data[4:], (uint256, uint256));
            
            // 检查总余额是否大于总金额和定金之和
            require(
                msg.sender.balance >= totalAmount + depositAmount + tx.gasprice * 200000, 
                "Insufficient balance for room creation and potential gas costs"
            );
        }
        
        // 如果正在加入房间，检查是否有足够的余额支付定金
        if (msg.sig == this.joinRoom.selector) {
            // 获取当前房间的定金金额
            string memory roomCode;
            (roomCode) = abi.decode(msg.data[4:], (string));
            uint256 roomId = roomCodeToId[roomCode];
            Room storage room = rooms[roomId];
            
            // 检查余额是否大于定金和预估的gas成本
            require(
                msg.sender.balance >= room.depositAmount + tx.gasprice * 100000, 
                "Insufficient balance for room deposit and gas"
            );
        }
        
        _;
    }

    /**
     * @dev 生成随机房间号（两个大写字母+四个数字）
     * @return 生成的房间号字符串
     */
    function generateRoomCode() private view returns (string memory) {
        // 使用时间戳和发送者地址生成初始随机数
        uint256 randomNum = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        
        // 创建6位长的字节数组
        bytes memory code = new bytes(6);
        
        // 生成两个大写字母 (ASCII: A=65, Z=90)
        code[0] = bytes1(uint8(65 + (randomNum % 26)));
        code[1] = bytes1(uint8(65 + ((randomNum / 26) % 26)));
        
        // 生成4个数字 (ASCII: 0=48, 9=57)
        for(uint i = 2; i < 6; i++) {
            randomNum = uint256(keccak256(abi.encodePacked(randomNum, i)));
            code[i] = bytes1(uint8(48 + (randomNum % 10)));
        }
        
        return string(code);
    }

    /**
     * @dev 创建新房间
     * @param _totalAmount 设置的总金额
     * @param _depositAmount 每个成员需要预存的定金金额
     * @return 生成的房间号
     */
    function createRoom(uint256 _totalAmount, uint256 _depositAmount) external checkBalance() returns (string memory) {
        // 检查是否已存在活跃房间
        require(!roomExists, "A room already exists");
        require(_totalAmount > 0, "Amount must be greater than 0");
        require(_depositAmount > 0, "Deposit amount must be greater than 0");
        
        // 递增房间ID
        currentRoomId++;
        Room storage newRoom = rooms[currentRoomId];
        
        // 生成唯一的房间号
        string memory roomCode = generateRoomCode();
        // 确保房间号不重复
        while(roomCodeToId[roomCode] != 0) {
            roomCode = generateRoomCode();
        }
        
        // 初始化房间信息
        newRoom.owner = msg.sender;
        newRoom.totalAmount = _totalAmount;
        newRoom.depositAmount = _depositAmount;
        newRoom.isActive = true;
        newRoom.members.push(msg.sender);
        newRoom.isMember[msg.sender] = true;
        newRoom.roomCode = roomCode;
        
        // 更新映射关系和状态
        roomCodeToId[roomCode] = currentRoomId;
        roomExists = true;
        
        // 触发房间创建事件
        emit RoomCreated(currentRoomId, msg.sender, roomCode, _depositAmount);
        return roomCode;
    }

    /**
     * @dev 加入已存在的房间
     * @param _roomCode 房间号
     */
    function joinRoom(string calldata _roomCode) external payable checkBalance() {
        uint256 roomId = roomCodeToId[_roomCode];
        require(roomId != 0, "Room does not exist");
        
        Room storage room = rooms[roomId];
        // 验证房间状态
        require(room.isActive, "Room is not active");
        require(!room.isMember[msg.sender], "Already a member");
        require(!room.isPaid, "Room is already paid");
        
        // 检查预存定金金额是否足够
        require(msg.value >= room.depositAmount, "Insufficient deposit amount");

        // 添加新成员
        room.members.push(msg.sender);
        room.isMember[msg.sender] = true;
        room.memberDeposits[msg.sender] = msg.value;
        
        // 更新每个成员应付金额
        if (room.totalAmount > 0) {
            room.amountPerMember = room.totalAmount / room.members.length;
        }
        
        // 如果预存金额超过要求的定金，退还多余金额
        if (msg.value > room.depositAmount) {
            payable(msg.sender).transfer(msg.value - room.depositAmount);
        }
        
        emit MemberJoined(roomId, msg.sender, room.depositAmount);
    }

    /**
     * @dev 完成支付（内部函数）
     * @param _roomId 房间ID
     */
    function _completePayment(uint256 _roomId) internal nonReentrant {
        Room storage room = rooms[_roomId];
        require(!room.isPaid, "Payment already completed");
        require(room.signatureCount == room.selectedSigners.length, "Not all signatures collected");

        // 计算总预存金额
        uint256 totalDeposits = 0;
        for (uint256 i = 0; i < room.members.length; i++) {
            totalDeposits += room.memberDeposits[room.members[i]];
        }

        // 将预存金额转账给房主
        payable(room.owner).transfer(totalDeposits);

        // 转账剩余总金额给房主
        payable(room.owner).transfer(room.totalAmount - room.amountPerMember);

        // 更新房间状态
        room.isPaid = true;
        room.isActive = false;
        roomExists = false;  // Allow a new room to be created

        emit PaymentCompleted(_roomId);
    }

    /**
     * @dev 退还单个成员的预存定金
     * @param _roomCode 房间号
     */
    function refundDeposit(string calldata _roomCode) external {
        uint256 roomId = roomCodeToId[_roomCode];
        require(roomId != 0, "Room does not exist");
        
        Room storage room = rooms[roomId];
        require(room.isMember[msg.sender], "Not a room member");
        
        // 只有在房间尚未完成支付且房间未处于活跃状态时可以退款
        require(!room.isPaid && !room.isActive, "Cannot refund at this time");
        
        uint256 depositAmount = room.memberDeposits[msg.sender];
        require(depositAmount > 0, "No deposit to refund");
        
        // 重置预存金额
        room.memberDeposits[msg.sender] = 0;
        
        // 退还预存定金
        payable(msg.sender).transfer(depositAmount);
        
        emit DepositRefunded(roomId, msg.sender, depositAmount);
    }

   /**
    * @dev 查看房间信息
    * @param _roomCode 房间号
    * @return owner_ 房主地址,
                        totalAmount_ 总金额，
                        depositAmount_ 每个成员需要预存的定金金额，
                        amountPerMember_ 每个成员应付金额，
                        members_ 成员列表数组，
                        selectedSigners_ 被选中的签名者列表，
                        signatureCount_ 已收集的签名数量,
                        isPaid_ 是否已完成支付
    */
        function getRoomInfo(string calldata _roomCode) external view returns (
        address owner_,
        uint256 totalAmount_,
        uint256 depositAmount_,
        uint256 amountPerMember_,
        address[] memory members_,
        address[] memory selectedSigners_,
        uint256 signatureCount_,
        bool isPaid_
    )
    {
        uint256 roomId = roomCodeToId[_roomCode];
        require(roomId != 0, "Room does not exist");
    
        Room storage room = rooms[roomId];
    
        // 将 storage 中的动态数组复制到 memory
        address[] memory membersMemory = room.members;
        address[] memory selectedSignersMemory = room.selectedSigners;
    
        return (
            room.owner, 
            room.totalAmount, 
            room.depositAmount, 
            room.amountPerMember, 
            membersMemory,
            selectedSignersMemory, 
            room.signatureCount, 
            room.isPaid
            );
    }
}