const express = require("express");

const router= express.Router();

const product=require("../controller/shop");
const isAuth = require("../middleware/is_auth");

router.get('/',product.getIndex);

router.get('/products',product.productList);

router.get('/cart',isAuth,product.getCart);

router.post('/cart',isAuth,product.postCart);

// checkout page
router.get('/checkout',isAuth,product.getCheckout);

router.get('/checkout/success',product.postOrder);
router.get('/checkout/cancel',product.getCheckout);

router.get('/orders',isAuth,product.getOrder);

// router.post('/create-order',isAuth,product.postOrder);

router.post('/delete-prod-cart',isAuth,product.postDeleteCartProduct);

// // for arbitrary path 
router.get('/product/:productId',product.getOneProduct);

router.get('/order/:orderId',isAuth,product.getInvoice);


module.exports=router;