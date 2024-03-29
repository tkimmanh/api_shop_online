import { Router } from 'express'

import {
  createProductController,
  deleteProductController,
  getAllProductController,
  productDetailsController,
  updateProductController,
  updateProductOptions
} from '~/controllers/products.controller'
import { authenticateToken, isAdmin } from '~/middlewares/auth.middlewares'
import { customUploadMiddleware } from '~/middlewares/uploadImage.middlewares'

const routerProducts = Router()

routerProducts.get('/', getAllProductController)
routerProducts.get('/:id', productDetailsController)
routerProducts.post('/', authenticateToken, isAdmin, customUploadMiddleware, createProductController)
routerProducts.put('/:id', authenticateToken, isAdmin, customUploadMiddleware, updateProductController)
routerProducts.delete('/:id', authenticateToken, isAdmin, deleteProductController)
routerProducts.put('/:productId/options', authenticateToken, isAdmin, updateProductOptions)

export default routerProducts
