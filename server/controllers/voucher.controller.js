const Voucher = require("../models/voucher.model")
const moment = require('moment');

class VoucherController {
    // GET VOUCHERS
    async getVouchers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;  // Current page
            const limit = parseInt(req.query.limit) || 10;  // Items per page
            const skip = (page - 1) * limit;  // Skip results for pagination

            const { keyword, validFrom, validTo } = req.query;

            const query = {};

            if (keyword) {
                query.$or = [
                    { code: { $regex: keyword, $options: 'i' } },        // Search in 'code'
                    { description: { $regex: keyword, $options: 'i' } }  // Search in 'description'
                ];
            }

            if (validFrom) {
                query.validFrom = { $gte: new Date(validFrom) };
            }
            if (validTo) {
                query.validTo = { $lte: new Date(validTo) };
            }

            const vouchers = await Voucher.find(query)
                .skip(skip)
                .limit(limit);

            const totalVouchers = await Voucher.countDocuments(query);

            return res.status(200).json({
                vouchers,
                currentPage: page,
                totalPages: Math.ceil(totalVouchers / limit),
                totalVouchers
            });
        } catch (error) {
            return res.status(500).json({
                error: error.message || error,
                message: 'An error occurred'
            });
        }
    }


    // GET VOUCHER
    async getVoucherById(req, res) {
        try {
            const voucher = await Voucher.findById(req.params.id);
            if (!voucher) {
                return res.status(404).json({ message: 'Voucher not found' });
            }
            return res.status(200).json(voucher);
        } catch (error) {
            return res.status(500).json({
                error: error.message,
                message: 'An error occurred'
            });
        }
    }

    // POST CATEGORY
    async createVoucher(req, res) {
        try {
            if (req.body.validFrom) {
                req.body.validFrom = moment(req.body.validFrom, 'DD/MM/YYYY').format('YYYY-MM-DD');
            }

            if (req.body.validTo) {
                req.body.validTo = moment(req.body.validTo, 'DD/MM/YYYY').format('YYYY-MM-DD');
            }

            const voucher = new Voucher({
                ...req.body
            });

            const savedVoucher = await voucher.save();

            if (!savedVoucher) {
                return res.status(400).json({
                    message: 'Cannot create voucher'
                });
            }

            return res.status(201).json(savedVoucher);
        } catch (error) {
            return res.status(500).json({
                error: error.message,
                message: 'An error occurred'
            });
        }
    }

    // PUT CATEGORY
    async updateVoucher(req, res) {
        try {
            if (req.body.validFrom) {
                req.body.validFrom = moment(req.body.validFrom, 'DD/MM/YYYY').format('YYYY-MM-DD');
            }

            if (req.body.validTo) {
                req.body.validTo = moment(req.body.validTo, 'DD/MM/YYYY').format('YYYY-MM-DD');
            }

            const updatedVoucher = await Voucher.findByIdAndUpdate(
                req.params.id,
                {
                    ...req.body
                },
                { new: true }
            );

            if (!updatedVoucher) {
                return res.status(404).json({ message: 'Voucher not found' });
            }

            return res.status(200).json(updatedVoucher);
        } catch (error) {
            return res.status(400).json({
                error: error.message,
                message: 'An error occurred'
            });
        }
    }

    // DELETE CATEGORY
    async deleteVoucher(req, res) {
        try {
            const voucher = await Voucher.findByIdAndDelete(req.params.id);

            if (!voucher) {
                return res.status(404).json({ message: 'Voucher not found' });
            }

            return res.status(200).json({ message: 'Voucher deleted successfully' });
        } catch (error) {
            return res.status(500).json({
                error: error.message,
                message: 'An error occurred'
            });
        }
    }

    async giveAwayVouchers(req, res) {
        try {
            const { vouchers, users } = req.body;

            // Vouchers validation
            const voucherIds = vouchers.map(voucher => voucher.voucherId);
            const validVouchers = await Voucher.find({ _id: { $in: voucherIds } });

            if (validVouchers.length !== vouchers.length) {
                return res.status(400).json({
                    message: 'One or more vouchers are invalid'
                });
            }

            // Users Validation
            const userIds = users.map(user => user.userId);
            const validUsers = await User.find({ _id: { $in: userIds } });

            if (validUsers.length !== users.length) {
                return res.status(400).json({
                    message: 'One or more users are invalid'
                });
            }

            // Expiration, Usage Limit Validation
            const currentDate = new Date();
            for (let voucher of validVouchers) {
                if (voucher.usageLimit <= voucher.usedBy.length) {
                    return res.status(400).json({
                        message: `Voucher ${voucher.code} has reached its usage limit`
                    });
                }
                if (currentDate < voucher.validFrom || currentDate > voucher.validTo) {
                    return res.status(400).json({
                        message: `Voucher ${voucher.code} is not valid at this time`
                    });
                }
            }

            await Promise.all(users.map(async (user) => {
                const userRecord = await User.findById(user.userId);
                vouchers.forEach(voucher => {
                    userRecord.vouchers.push({
                        code: voucher.code,
                        voucherId: voucher.voucherId
                    });
                });
                await userRecord.save();
            }));

            return res.status(200).json({ message: 'Vouchers successfully given away' });
        } catch (error) {
            return res.status(500).json({
                error: error.message,
                message: 'An error occurred'
            });
        }
    }
}

module.exports = new VoucherController()