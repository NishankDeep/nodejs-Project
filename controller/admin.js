// const mongodb = require('mongodb');
const mongoose = require('mongoose');
const Product = require("../model/product");
const loggedIn=false;
const {validationResult} =  require('express-validator/check')


const removeFile=require('../util/removeFile');

// const sequelize = require('../util/database');

exports.getAdmin = (req,res,next) => {
    // if(!req.session.isLoggedIn){
    //     return res.redirect('/login');
    // }

    res.render('admin/edit-product.ejs',{
        pageTitle:"Add Product",
        path:"/add-product",
        editing:false,
        hasError : false,
        isAuthenticated : req.session.isLoggedIn,
        csrfToken: req.csrfToken(),
        errorMsg : null
    });

};

exports.postProduct = (req,res,next) =>{
    const title=req.body.title;
    // const imageUrl=req.body.image;
    const image=req.file;
    const price=req.body.price;
    const desc=req.body.description;

    if(!image){
        return res.render('admin/edit-product.ejs',{
            pageTitle:"Add Product",
            path:"/admin/add-product",
            editing:false,
            hasError : true,
            prods:{
                title:title,
                price:price,
                description : desc
            },
            isAuthenticated : req.session.isLoggedIn,
            errorMsg : "Attachment is not correct"
        });
    }

    console.log(image);
    const errors = validationResult(req);

    // console.log(req.user);

    if(!errors.isEmpty()){
        return res.render('admin/edit-product.ejs',{
            pageTitle:"Add Product",
            path:"/admin/edit-product",
            editing:false,
            hasError : true,
            prods:{
                title:title,
                price:price,
                description : desc
            },
            isAuthenticated : req.session.isLoggedIn,
            errorMsg : errors.array()[0].msg
    
        });
    }

    const imageUrl=image.path;

    const product = new Product({
        // _id : new mongoose.Types.ObjectId('62d52423a27d9123a9f68bcb'),
        title:title,
        price:price,
        description : desc,
        imageUrl : imageUrl,
        // userId : req.user._id
        userId : req.user
    });

    product.save()
        .then(result => {
            // console.log(result);
            console.log('Created the product')
            res.redirect('/');
        })
        .catch(err => {
            // console.log(err);
            // res.redirect('/500');

            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });



    //one method
    // Product.create({
    //     title : title,
    //     price : price,
    //     description : desc,
    //     imageUrl : imageUrl,
    //     userId : req.user.id
    // })
    // .then(result => {
    //     // console.log(result);
    //     console.log('Created the proudct')
    //     res.redirect('/');
    // })
    // .catch(err => console.log(err));

}


// *******commented to be used later
exports.getProduct=(req,res,next)=>{  
    // {userId:req.user._id} 
    Product.find({userId:req.user._id})
        .then(products => {
           
            res.render('admin/product.ejs',{
                prods:products,
                pageTitle:'product',
                path:'/admin/products',
                isAuthenticated:req.session.isLoggedIn
            });
        })
        .catch(err => {
            // console.log(err);
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });

}

exports.getEditProduct=(req,res,next)=>{
    const editMode= (req.query.edit==='true');

    if(!editMode){
        res.redirect('/');
        return;
    }

    const prodId=req.params.productId;

    Product.findById(prodId)
        .then(products => {
            // throw new Error("Dummy");
            const product= products;
            // console.log("edit me hain");
            // console.log(product);
            res.render('admin/edit-product.ejs',{
                pageTitle:"Edit Product",
                path:"/admin/edit-product",
                editing:editMode,
                hasError:false,
                prods:product,
                isAuthenticated : req.session.isLoggedIn,
                errorMsg : null
        
            });
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });
 
};

exports.postEditProduct = (req,res,next) => {
    const prodId=req.body.productId;
    const updatedTitle=req.body.title;
    const updatedPrice=req.body.price;
    const image=req.file;
    // const updatedUrl=req.body.imageURL;
    const updatedDesc=req.body.description;


    const errors = validationResult(req);       
    if(!errors.isEmpty()){
        // console.log(errors);
        return res.render('admin/edit-product.ejs',{
            pageTitle:"Edit Product",
            path:"/admin/edit-product",
            editing:true,
            hasError : true,
            prods:{
                title:updatedTitle,
                price:updatedPrice,
                description : updatedDesc,
                _id:prodId
            },
            isAuthenticated : req.session.isLoggedIn,
            errorMsg : errors.array()[0].msg
    
        });
    }

    let oldProdValue;

    Product.findById(prodId)
        .then(product => {
            if(product.userId.toString() !== req.user._id.toString()){
                return res.redirect('/');
            }
            oldProdValue=product.price; 
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDesc;
            
            if(image){
                removeFile.deleteFromFile(product.imageUrl);
                product.imageUrl = image.path;

            }

            return product.save()
                    .then(result => {
                        return  req.user.updateTotalProd(result,oldProdValue);
                    })
                    .then(result => {
                        // console.log("update ke baad ka scene");
                        // console.log(result);
                        console.log('updated');
                        res.redirect('/admin/products')
                    })
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });

};

// changed the name of postDeleteProduct to deleteProduct
exports.deleteProduct=(req,res,next)=>{
    // const prodId=req.body.productId;
    const prodId=req.params.productId;
    
    Product.findById(prodId)
        .then(product => {
            if(!product){
                return next(new Error("Product not present"));
            }

            removeFile.deleteFromFile(product.imageUrl);
            return Product.find({userId:req.user.id , _id : prodId})
                .then(result => {
                    if(result.length<=0){
                        return next(new Error("Product not present"));
                        // return res.redirect('/admin/products');
                    }
                    req.user.removeFromCart(prodId)
                        .then(result => {
                            return Product.findByIdAndRemove(prodId);
                        })
                        .then(() =>{
                            console.log('deleted');
                            //we will not send the response now to another page
                            // res.redirect('/admin/products');

                            // using client side request to delete without responding to another page
                            res.status(200).json({message : "Succuss!!"});
                        })
                        .catch(err =>{
                            res.status(500).json({message : "Deletion caused errror"});
                            // console.log(err)
                            // const error=new Error('error occured');
                            // error.httpStatusCode = 500;
                            // return next(error);
                        });
                })
                .catch(err =>{
                    res.status(500).json({message : "Deletion caused errror"});
                    // console.log(err)
                    // const error=new Error('error occured');
                    // error.httpStatusCode = 500;
                    // return next(error);
                });
        })
        .catch(err =>{
            res.status(500).json({message : "Deletion caused errror"});
            // console.log(err)
            // const error=new Error('error occured');
            // error.httpStatusCode = 500;
            // return next(error);
        });
    
    // Product.findByIdAndRemove(prodId)
    // Product.deleteOne({_id:prodId , userId:req.user._id})
    //     .then(() =>{
    //         console.log('deleted');
    //         res.redirect('/admin/products');
    //     })
    //     .catch(err => console.log(err));
                

    // Product.find({userId:req.user.id , _id : prodId})
    //     .then(result => {
    //         if(result.length<=0){
    //             return res.redirect('/admin/products');
    //         }
    //         req.user.removeFromCart(prodId)
    //             .then(result => {
    //                 return Product.findByIdAndRemove(prodId);
    //             })
    //             .then(() =>{
    //                 console.log('deleted');
    //                 res.redirect('/admin/products');
    //             })
    //             .catch(err =>{
    //                 // console.log(err)
    //                 const error=new Error('error occured');
    //                 error.httpStatusCode = 500;
    //                 return next(error);
    //             });
    //     })
    //     .catch(err =>{
    //         // console.log(err)
    //         const error=new Error('error occured');
    //         error.httpStatusCode = 500;
    //         return next(error);
    //     });


}