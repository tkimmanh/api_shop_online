import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/message'
import { default as Orders } from '~/models/Order.model'
import Products from '~/models/Products.model'
import { default as Users } from '~/models/Users.model'

export const placeOrderController = async (req, res) => {
  const { _id } = req.user
  const { payment_method, address, phone, full_name } = req.body

  try {
    let user = await Users.findById(_id)
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: USER_MESSAGE.USER_NOT_FOUND
      })
    }
    if (user.cart.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Giỏ hàng của bạn đang trống.'
      })
    }
    let updateInfo = {}
    if (!user.address && address) updateInfo.address = address
    if (!user.phone && phone) updateInfo.phone = phone
    if (!user.full_name && full_name) updateInfo.full_name = full_name

    if (Object.keys(updateInfo).length > 0) {
      user = await Users.findByIdAndUpdate(_id, updateInfo, { new: true })
    }
    // Tính toán tổng tiền
    let totalPrice = 0
    for (const item of user.cart) {
      const product = await Products.findById(item.product)
      if (product) {
        totalPrice += product.price * item.quantity
      }
    }
    await Orders.create({
      user: _id,
      products: user.cart,
      total_price: totalPrice,
      payment_method
    })

    user.cart = []
    await user.save()

    res.status(HTTP_STATUS.OK).json({
      message: 'Đặt hàng thành công'
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra',
      error: error.message
    })
  }
}
export const listUserOrdersController = async (req, res) => {
  try {
    const orders = await Orders.find()
      .populate({
        path: 'user',
        select: 'phone full_name address'
      })
      .populate({
        path: 'products.product',
        model: 'Products',
        populate: {
          path: 'category',
          model: 'Categories',
          select: 'title -_id'
        },
        select: '-colors -sizes -_id -sold'
      })
      .populate({
        path: 'products.color',
        model: 'Colors',
        select: 'name -_id'
      })
      .populate({
        path: 'products.size',
        model: 'Sizes',
        select: 'name -_id'
      })

    res.status(HTTP_STATUS.OK).json({
      message: 'Danh sách đơn hàng đã đặt',
      orders
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra',
      error: error.message
    })
  }
}
export const cancelOrderController = async (req, res) => {
  const { id } = req.params
  const { _id } = req.user
  console.log('_id:', _id)

  try {
    const order = await Orders.findById(id)
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Đơn hàng không tồn tại.'
      })
    }

    if (order.user?.toString() !== _id?.toString()) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Bạn không có quyền hủy đơn hàng này.'
      })
    }

    order.status = 'Đã hủy'
    await order.save()

    res.status(HTTP_STATUS.OK).json({
      message: 'Đơn hàng đã được hủy'
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng.',
      error: error.message
    })
  }
}
export const deleteOrderController = async (req, res) => {
  const { id } = req.params
  const { _id } = req.user
  try {
    const order = await Orders.findById(id)
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Đơn hàng không tồn tại.'
      })
    }

    if (order?.user?.toString() !== _id?.toString()) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Bạn không có quyền xóa đơn hàng này.'
      })
    }

    await Orders.findByIdAndDelete(id)

    res.status(HTTP_STATUS.OK).json({
      message: 'Đơn hàng đã được xóa thành công.'
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Có lỗi xảy ra khi xóa đơn hàng.',
      error: error.message
    })
  }
}