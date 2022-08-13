// const Cart = require('../model/cart');

const fs=require('fs');
const path=require('path');


const PDFDocument = require('pdfkit');

const Product =  require('../model/product');
const Order =  require('../model/order');
const User =  require('../model/user');
// const CartItem = require('../model/cart-item');
const loggedIn=false;

// package used for payment
// const stripe = require('stripe')('sk_test_51LQUlISArzqNofPPCgUVTGuwQcRM88fssQ7qdNOcfWCXERIu7O4iQOeiE7edUb8Xpgx4lZgD7PLulDojl7dNz0YU00ZLslecjS');

const ITEMS_PER_PAGE = 1;

exports.productList = (req,res,next) =>{
    const page=+req.query.page || 1;
    let totalItems;

    Product.find().countDocuments()
        .then(numberOfItems => {
            totalItems=numberOfItems;
            return Product.find()
                .skip((page-1)*ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(product => {
            // console.log(product);
            // console.log(product);
            res.render('shop/index.ejs',{
                pageTitle:"productList",
                path:'/products',
                prods:product,
                hasProducts:product.length>0,
                activeShop:true,
                productCSS:true  ,
                isAuthenticated : req.session.isLoggedIn,
                csrfToken:req.csrfToken(),
                currPage:page,
                hasNextPage: page*ITEMS_PER_PAGE < totalItems,
                hasPrevPage : page>1,
                nextPage : page+1,
                prevPage:page-1,
                lastPage : Math.ceil(totalItems/ ITEMS_PER_PAGE)

            });
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });



    // Product.find()
    //     .then(product => {
    //         res.render('shop/product_list.ejs',{
                // pageTitle:"productList",
                // path:'/products',
                // prods:product,
                // hasProducts:product.length>0,
                // activeShop:true,
                // productCSS:true  ,
                // isAuthenticated : req.session.isLoggedIn
    //         });
    //     })
    //     .catch(err =>{
    //         // console.log(err)
    //         const error=new Error('error occured');
    //         error.httpStatusCode = 500;
    //         return next(error);
    //     });

}

exports.getOneProduct=(req,res,next)=>{
    //extracting the id of the product which we are finding
    const prodId=req.params.productId;

    Product.findById(prodId)
        .then((product)=>{
            res.render('shop/product-detail.ejs',{
                pageTitle:product.title,
                prods:product,
                path:'/products',
                isAuthenticated : req.session.isLoggedIn
            })
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });

}

exports.getIndex=(req,res,next)=>{
    const page=+req.query.page || 1;
    let totalItems;
    Product.find().countDocuments()
        .then(numberOfItems => {
            totalItems=numberOfItems;
            return Product.find()
                .skip((page-1)*ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(product => {
            // console.log(product);
            // console.log(product);
            res.render('shop/index.ejs',{
                pageTitle:"index",
                path:'/',
                prods:product,
                hasProducts:product.length>0,
                activeShop:true,
                productCSS:true  ,
                isAuthenticated : req.session.isLoggedIn,
                csrfToken:req.csrfToken(),
                currPage:page,
                hasNextPage: page*ITEMS_PER_PAGE < totalItems,
                hasPrevPage : page>1,
                nextPage : page+1,
                prevPage:page-1,
                lastPage : Math.ceil(totalItems/ ITEMS_PER_PAGE)

            });
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });

        

    // Product.find()
    //     .skip((page-1)*ITEMS_PER_PAGE)
    //     .limit(ITEMS_PER_PAGE)
    //     .then(product => {
    //         console.log(product);
    //         res.render('shop/index.ejs',{
    //             pageTitle:"index",
    //             path:'/',
    //             prods:product,
    //             hasProducts:product.length>0,
    //             activeShop:true,
    //             productCSS:true  ,
    //             isAuthenticated : req.session.isLoggedIn,
    //             csrfToken:req.csrfToken()
    //         });
    //     })
    //     .catch(err =>{
    //         // console.log(err)
    //         const error=new Error('error occured');
    //         error.httpStatusCode = 500;
    //         return next(error);
    //     });

}



exports.getCart=(req,res,next)=>{
    // const userSession=req.user;
    // console.log(userSession);
    // console.log(req.user);
    req.user.populate('cart.items.productId')
            .then(user => {
                // console.log(user.cart.items);
                const products =user.cart.items;
                // console.log(products);
                res.render('shop/cart',{
                    pageTitle:'cart',
                    path:'/cart',
                    product:products,
                    isAuthenticated : req.session.isLoggedIn
                }); 
            })
            .catch(err =>{
                // console.log(err)
                const error=new Error('error occured');
                error.httpStatusCode = 500;
                return next(error);
            });
  
}

exports.postCart=(req,res,next)=>{
    const prodId= req.body.productId;
    Product.findById(prodId)
        .then( product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            // console.log(result);
            res.redirect('/cart');
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });

}


exports.postDeleteCartProduct=(req,res,next)=>{
    const prodId=req.body.productId;

    req.user.removeFromCart(prodId)
        .then(result => {
            // console.log(result);
            res.redirect('/cart');
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });

}

exports.getOrder=(req,res,next)=>{
    // console.log("idhar aaya");

    Order.find({"user.userId" : req.user._id})
        .then(orders =>{
            // console.log(orders);
            res.render('shop/orders',{
                pageTitle:'order',
                path:'/orders',
                order:orders,
                isAuthenticated : req.session.isLoggedIn
            })
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });

}


exports.postOrder=(req,res,next)=>{
    // const userSession=req.user;
    // console.log("ghusa kya");
    // console.log(userSession);
    req.user.populate('cart.items.productId')
        .then(user => {
            // console.log(user.cart.items[0].productId);
            const products = user.cart.items.map(i => {
                return {quantity : i.quantity , product : {...i.productId._doc}};
            });

            const order = new Order({
                user : {
                    email:req.user.email,

                    userId:req.user
                },
                products : products,
                totalPrice : req.user.totalPrice
            })

            return order.save();
        })
        .then(result =>{
           return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders'); 
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getCheckout=(req,res,next)=>{
    res.render('shop/checkout',{
        pageTitle:'checkout',
        path:'/checkout',
        isAuthenticated : req.session.isLoggedIn
    })
}

exports.getInvoice = (req,res,next) => {
    const orderId=req.params.orderId;

    Order.findById(orderId)
        .then(order => {
            // throw new Erro("hogaya bhai");
            if(!order){
                return next(new Error("No order found"));
            }
            
            if(order.user.userId.toString() !== req.user._id.toString()){
                return next(new Error("Invalid user"));
            }

            const invoiceName= "invoice-" + orderId+".pdf";
            // console.log(invoiceName);
            const invoicePath = path.join('data','Invoice',invoiceName);
            // console.log(invoicePath);

            // generating the pdf
            const pdfDoc= new PDFDocument();
            res.setHeader('Content-Type','application/pdf');
            res.setHeader('Content-Disposition',`inline; filename="${invoiceName}"`);
           
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            // pdfDoc.text('Hello user!!!');
            pdfDoc.fontSize(26).text('Invoice');
            pdfDoc.text('-----------------');

            order.products.forEach(prod => {
                pdfDoc.fontSize(14).text(`${prod.product.title} - ${prod.quantity} X $${prod.product.price}`);
            })
            pdfDoc.text('--------------')

            pdfDoc.fontSize(20).text(`totalPrice : ${order.totalPrice}`);

            pdfDoc.end();


            // fs.readFile(invoicePath,(err,data) => {
            //     if(err){
            //         return next(err);
            //     }
        
            //     // res.setHeader('content-type' , 'text/txt');
            //     res.setHeader('Content-Disposition',`attachment; filename="${invoiceName}"`);
            //     // res.setHeader('Content-Disposition',`attachment; filename="${invoiceName}"`);
                
            //     // res.type('.pdf');
            //     // res.set('content-types' , 'application/pdf');
            //     // res.contentType('application/pdf');
            //     res.send(data);
            // });

            // const file=fs.createReadStream(invoicePath);
            // res.setHeader('Content-Disposition',`attachment; filename="${invoiceName}"`);
            // file.pipe(res); // readStream to writeStream

        })
        .catch(err => {
            return next(err);
        })

}

exports.getCheckout = (req,res,next) => {
    // stripe only allows authourised business person to make payment so we cannot use this but this the way of implementation
    let products;
    let total=0;
    req.user.populate('cart.items.productId')
        .then(user => {
            // console.log(user.cart.items);
            products =user.cart.items;
            total=0;
            products.forEach(p => {
                total = total + (p.quantity*p.productId.price);
            })
            
            return stripe.checkout.sessions.create({
                payment_method_types : ['card'],
                line_items : products.map(p => {
                    return {
                        name : p.productId.title,
                        description : p.productId.description,
                        amount : p.productId.price * 100 ,
                        currency : 'usd',
                        quantity : p.quantity
                    };
                }),
                success_url : req.protocol + '://' + req.get('host') + '/checkout/success' , // http://localhost:3000/checkout/success
                cancel_url : req.protocol + '://' + req.get('host') + '/checkout/cancel'
            });
            // console.log(products);
            
        })
        .then((session) =>{
            console.log("iske andar aaya ");    
            res.render('shop/checkout',{
                pageTitle:'checkout',
                path:'/checkout',
                product:products,
                isAuthenticated : req.session.isLoggedIn,
                totalSum : total,
                sessionId : session
            }); 
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });
}
