const { deleteImage } = require('../middlewares/upload.middlewares');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const moment = require('moment');
const User = require('../models/user.model');
const Recommendation = require('../models/recommendation.model');
exports.findProductToUpdateSuggestScoreOfUser = async (req, res) => {
  const userId = req.body.id; // Lấy user ID từ body
  const productName = req.params.productName; // Lấy product name từ params

  try {
    // Tìm kiếm sản phẩm dựa trên tên với regex
    const products = await Product.find({
      name: { $regex: productName, $options: 'i' } // Tìm kiếm không phân biệt chữ hoa chữ thường
    });

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    // Tìm người dùng
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra và khởi tạo mảng suggestions nếu chưa có
    if (!user.suggestions) {
      user.suggestions = [];
    }

    // Lặp qua các sản phẩm tìm được
    for (const product of products) {
      const categoryId = product.categoryId; // Lấy categoryId từ sản phẩm
      const category = product.category; // Lấy category từ sản phẩm

      // Tìm kiếm category trong mảng suggestions của user
      const existingCategory = user.suggestions.find(
        (suggestedCategory) => suggestedCategory.categoryId && suggestedCategory.categoryId.toString() === categoryId.toString()
      );

      if (existingCategory) {
        // Nếu category đã tồn tại, tăng điểm suggestedScore lên 1
        existingCategory.suggestedScore += 1;
      } else {
        // Nếu category chưa tồn tại, thêm category mới vào mảng với điểm suggestedScore = 1
        user.suggestions.push({
          categoryId: categoryId,
          category: category, // Đảm bảo thêm category vào đây
          suggestedScore: 1
        });
      }
    }

    // Lưu cập nhật vào cơ sở dữ liệu
    const updatedUser = await user.save();

    // Trả về thông tin cần thiết cùng với danh sách sản phẩm tìm kiếm
    res.status(200).json({
      message: "Updated successfully",
      suggestions: updatedUser.suggestions,
      products: products // Thêm danh sách sản phẩm tìm được vào phản hồi
    });
  } catch (error) {
    console.error("Error updating suggested score:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.ratingToUpdateSuggestScoreOfUser = async (req, res) => {
  const userId = req.params.id; // User ID cố định
  const productId = req.body.productID; // Lấy productId từ body
  const rating = parseInt(req.body.rating, 10); // Lấy rating từ body và chuyển đổi thành số

  try {
    // Tìm sản phẩm trước
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Lấy thông tin category từ sản phẩm
    const categoryId = product.categoryId;
    const category = product.category;
    console.log('Category ID:', categoryId);
    console.log('Category Name:', category);

    // Tìm người dùng
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra và khởi tạo mảng suggestions nếu chưa có
    if (!user.suggestions) {
      user.suggestions = [];
    }

    // Tìm kiếm category trong mảng suggestions của user
    const existingCategory = user.suggestions.find(
      (suggestedCategory) => suggestedCategory.categoryId && suggestedCategory.categoryId.toString() === categoryId.toString()
    );

    // Hàm điều chỉnh suggestedScore dựa trên đánh giá
    const adjustSuggestedScore = (rating) => {
      switch (rating) {
        case 1: return -2;
        case 2: return -1;
        case 3: return 1;
        case 4: return 2;
        case 5: return 3;
        default: return 0;
      }
    };

    if (existingCategory) {
      // Nếu category đã tồn tại, điều chỉnh điểm suggestedScore
      existingCategory.suggestedScore += adjustSuggestedScore(rating);
    } else {
      // Nếu category chưa tồn tại, thêm category mới vào mảng với điểm suggestedScore ban đầu
      user.suggestions.push({
        categoryId: categoryId,
        category: category, 
        suggestedScore: adjustSuggestedScore(rating)
      });
    }

    // Lưu cập nhật vào cơ sở dữ liệu
    const updatedUser = await user.save();

    // Chỉ trả về thông tin cần thiết
    res.status(200).json({
      message: "Updated successfully",
      suggestions: updatedUser.suggestions
    });
  } catch (error) {
    console.error("Error updating suggested score:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};


//update suggest product for multiple products
// Update suggested scores for multiple products
exports.updateSuggestedScoresForMultipleProducts = async (req, res) => {
  const userId = req.body.userID; // Lấy user ID từ body
  const products = req.body.products; // Lấy mảng sản phẩm từ body

  try {
    // Tìm người dùng
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra và khởi tạo mảng suggestions nếu chưa có
    if (!user.suggestions) {
      user.suggestions = []; // Sửa lỗi đánh máy từ saveuggestions thành suggestions
    }

    for (const productInfo of products) {
      const productId = productInfo.productID;

      // Tìm sản phẩm
      const product = await Product.findById(productId);
      if (!product) {
        // Nếu sản phẩm không tồn tại, bỏ qua và tiếp tục với sản phẩm tiếp theo
        console.log(`Product with ID ${productId} not found`);
        continue;
      }
      const categoryId = product.categoryId;
      const category = product.category;
      console.log('Category ID:', categoryId);
      console.log('Category Name:', category);

      // Tìm kiếm category trong mảng suggestions của user
      const existingCategory = user.suggestions.find(
        (suggestedCategory) => suggestedCategory.categoryId && suggestedCategory.categoryId.toString() === product.categoryId.toString()
      );

      if (!existingCategory) {
        // Nếu category chưa tồn tại, thêm category mới vào mảng với điểm suggestedScore = 3
        user.suggestions.push({
          categoryId: categoryId,
          category: category, // Lưu category name
          suggestedScore: 3
        });

      }
      
      // Giới hạn tối đa chỉ giữ 5 sản phẩm trong mảng suggestions
      if (user.suggestions.length > 5) {
        // Loại bỏ sản phẩm cũ nhất nếu vượt quá 5
        user.suggestions.shift();
      }
    }

    // Lưu cập nhật vào cơ sở dữ liệu
    const updatedUser = await user.save();

    // Chỉ trả về thông tin cần thiết
    res.status(200).json({
      message: "Updated successfully",
      suggestions: updatedUser.suggestions
    });
  } catch (error) {
    console.error("Error updating suggested scores:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// SUGGEST PRODUCTS FOR USER
exports.configureProductRecommendations = async (req, res) => {
  const mainProductId = req.body.mainProductId;
  const suggestions = req.body.suggestions;

  console.log('Main Product ID:', mainProductId);
  console.log('Suggestions:', suggestions);

  try {
    // Tìm sản phẩm chính
    const mainProduct = await Product.findById(mainProductId);
    if (!mainProduct) {
      return res.status(404).json({ message: "Main product not found" });
    }

    const suggestionEntries = [];
    for (const suggestion of suggestions) {
      const { productId } = suggestion;

      // Tìm sản phẩm gợi ý
      const suggestedProduct = await Product.findById(productId);
      if (!suggestedProduct) {
        return res.status(404).json({ message: "Sub product not found" });
      }

      suggestionEntries.push({
        productId: productId,
        productName: suggestedProduct.name
      });
    }

    // Kiểm tra và lưu vào cơ sở dữ liệu
    if (suggestionEntries.length > 0) {
      // Kiểm tra xem đã có recommendation với mainProductId chưa
      let recommendation = await Recommendation.findOne({ mainProductId: mainProductId });

      if (recommendation) {
        // Nếu đã có, cập nhật sản phẩm gợi ý
        recommendation.products = suggestionEntries;
        await recommendation.save();
        console.log('Recommendations updated successfully');
      } else {
        // Nếu chưa có, tạo mới recommendation
        recommendation = new Recommendation({
          mainProductId: mainProductId,
          mainProductName: mainProduct.name, // Đổi tên thuộc tính cho đúng với schema
          products: suggestionEntries // Đảm bảo tên thuộc tính khớp với schema
        });

        await recommendation.save();
        console.log('Recommendations collection created successfully');
      }

      console.log(`Added recommendations for main product: ${mainProduct.name}`);
    } else {
      console.log('No suggestions available to insert');
    }

    res.status(200).json({
      message: "Recommendations processed successfully",
      mainProduct: {
        id: mainProduct._id,
        name: mainProduct.name,
      },
      suggestions: suggestionEntries,
      collection: "Recommendation"
    });
  } catch (error) {
    console.error("Error processing product recommendations:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.suggestProductsForUser = async (req, res) => {
  try {
    // Lấy thông tin của khách hàng hiện tại từ req.params.id
    const customerId = req.params.id;
    const customer = await User.findById(customerId);
    
    // Kiểm tra nếu không tìm thấy khách hàng
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Lấy danh sách categoryId mà khách hàng hiện tại đã có
    const customerCategoryIds = customer.suggestions.map(suggestion => suggestion.categoryId);

    // Tìm category từ các khách hàng khác không phải là khách hàng hiện tại
    const otherUsers = await User.find({ _id: { $ne: customerId } });

    // Tạo một đối tượng để lưu trữ điểm gợi ý trung bình cho các category
    const categoryScores = {};

    // Duyệt qua các category của khách hàng khác
    otherUsers.forEach(user => {
      user.suggestions.forEach(suggestion => {
        // Nếu category không có trong danh sách của khách hàng hiện tại
        if (!customerCategoryIds.includes(suggestion.categoryId)) {
          if (!categoryScores[suggestion.categoryId]) {
            categoryScores[suggestion.categoryId] = {
              categoryName: suggestion.categoryName, // Thêm thuộc tính tên danh mục
              totalScore: 0,
              count: 0
            };
          }
          // Cộng dồn điểm và số lượng
          categoryScores[suggestion.categoryId].totalScore += suggestion.suggestedScore;
          categoryScores[suggestion.categoryId].count += 1;
        }
      });
    });

    // Tính điểm trung bình cho mỗi category
    const averageScores = Object.entries(categoryScores).map(([categoryId, { categoryName, totalScore, count }]) => {
      return {
        categoryId,
        categoryName,
        averageScore: totalScore / count
      };
    });

    // Sắp xếp category dựa trên điểm trung bình (cao đến thấp) và lấy top 3
    const topRecommendations = averageScores.sort((a, b) => b.averageScore - a.averageScore).slice(0, 3);

    // Trả về danh sách category gợi ý
    return res.status(200).json({
      message: "Suggested categories found successfully",
      recommendations: topRecommendations
    });
  } catch (error) {
    console.error("Error suggesting categories:", error.message);
    res.status(500).json({ message: error.message });
  }
};
