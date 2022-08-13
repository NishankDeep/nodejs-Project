const express = require("express");

const router= express.Router();

const { body  }=require('express-validator/check');

const adminExport=require("../controller/admin");
const isAuth = require("../middleware/is_auth");

router.get('/add-product',isAuth,adminExport.getAdmin);

router.get('/admin/products',isAuth,adminExport.getProduct);

router.post('/product',
        [
            body('title')
                .isString()
                .isLength({min : 3})
                .trim(),
            body('price')
                .isFloat(),
            body('description')
                .isLength({min : 5, max : 400})
                .trim()

        ],
        isAuth,adminExport.postProduct
    );


router.post('/edit-product',
            [
                body('title')
                    .isString()
                    .isLength({min : 3})
                    .trim(),
                body('price')
                    .isFloat(),
                body('description')
                    .isLength({min : 5, max : 400})
                    .trim()
            ],
            isAuth,adminExport.postEditProduct);

            
router.get('/admin/edit-product/:productId',isAuth,adminExport.getEditProduct);
            
// router.post('/admin/deleteProduct',isAuth,adminExport.postDeleteProduct);
router.delete('/product/:productId',isAuth,adminExport.deleteProduct);


module.exports=router;