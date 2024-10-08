const User = require('../models/user.model');
const Account = require('../models/account.model');

// Controller để tạo người dùng mới
const createUser = async (req, res) => {
  try {
    const { name, phone, membershipTier, points, history, referralCode, discountsUsed, serviceHistory } = req.body;

    const user = new User({
      name,
      phone,
      membershipTier,
      points,
      history,
      referralCode,
      discountsUsed,
      serviceHistory
    });

    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Controller để lấy tất cả người dùng
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Controller để lấy thông tin người dùng theo ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Controller để sửa người dùng theo ID
const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Controller để xóa người dùng theo ID
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(204).json();
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Lấy thông tin người dùng theo ID Zalo
const getUserInfo = async (req, res) => {
  const { zaloId } = await req.params; // Lấy zaloId từ path parameters
  try {
    // Tìm kiếm người dùng theo zaloId từ mô hình Account
    const account = await Account.findOne({ zaloId });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    // Tìm kiếm người dùng theo accountId từ mô hình User
    const user = await User.findOne({ accountId: account._id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Trả về thông tin người dùng cùng với zaloId
    const userInfo = {
      _id: user._id,
      accountId: user.accountId,
      name: user.name,
      urlImage: user.urlImage,
      phone: user.phone,
      membershipTier: user.membershipTier,
      points: user.points,
      zaloId: account.zaloId, 
    };
    res.status(200).json(userInfo);
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật thông tin người dùng theo ID Zalo
const updateUserInfo = async (req, res) => {
  const { zaloId } = req.params; 
  const { name, phone } = req.body;   
  try {
    // Tìm kiếm người dùng theo zaloId từ mô hình Account
    const account = await Account.findOne({ zaloId });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    // Tìm kiếm người dùng theo accountId từ mô hình User
    const user = await User.findOne({ accountId: account._id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();
    const userInfo = {
      _id: user._id,
      accountId: user.accountId,
      name: user.name,
      phone: user.phone
    };
    res.status(200).json({ message: "User info updated successfully", userInfo });
  } catch (error) {
    console.error("Error updating user:", error.message);
  }
};
const suggestProductsForUser = async (req, res) => {
  try {
    // Lấy thông tin của khách hàng hiện tại từ req.params.id
    const customerId = req.params.id;
    const customer = await User.findById(customerId);
    
    // Kiểm tra nếu không tìm thấy khách hàng
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Lấy danh sách productId mà khách hàng hiện tại đã có
    const customerProductIds = customer.productSuggestions.map(suggestion => suggestion.productId);

    // Tìm sản phẩm từ các khách hàng khác không phải là khách hàng hiện tại
    const otherUsers = await User.find({ _id: { $ne: customerId } });

    // Tạo một đối tượng để lưu trữ điểm gợi ý trung bình cho các sản phẩm
    const productScores = {};

    // Duyệt qua các sản phẩm của khách hàng khác
    otherUsers.forEach(user => {
      user.productSuggestions.forEach(suggestion => {
        // Nếu sản phẩm không có trong danh sách của khách hàng hiện tại
        if (!customerProductIds.includes(suggestion.productId)) {
          if (!productScores[suggestion.productId]) {
            productScores[suggestion.productId] = {
              productName: suggestion.productName,
              totalScore: 0,
              count: 0
            };
          }
          // Cộng dồn điểm và số lượng
          productScores[suggestion.productId].totalScore += suggestion.suggestedScore;
          productScores[suggestion.productId].count += 1;
        }
      });
    });

    // Tính điểm trung bình cho mỗi sản phẩm
    const averageScores = Object.entries(productScores).map(([productId, { productName, totalScore, count }]) => {
      return {
        productId,
        productName,
        averageScore: totalScore / count
      };
    });

    // Sắp xếp sản phẩm dựa trên điểm trung bình (cao đến thấp) và lấy top 3
    const topRecommendations = averageScores.sort((a, b) => b.averageScore - a.averageScore).slice(0, 3);

    // Trả về danh sách sản phẩm gợi ý
    return res.status(200).json({
      message: "Suggested products found successfully",
      recommendations: topRecommendations
    });
  } catch (error) {
    console.error("Error suggesting products:", error.message);
    res.status(500).json({ message: error.message });
  }
};




module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserInfo,
  updateUserInfo,
  suggestProductsForUser
};
