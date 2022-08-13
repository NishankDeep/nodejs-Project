const mongoose = require('mongoose');
const Product = require('./product');
const Schema = mongoose.Schema;



const userSchema = new Schema ({

    email : {
        type : String,
        require : true
    },
    password : {
        type:String,
        require : true 
    },
    resetToken : String,

    resetTokenExpiration : Date,
    cart : {
        items :
         [
            {
                productId : {type : Schema.Types.ObjectId, ref: 'Product' , require : true } ,
                quantity : {type : Number ,require : true },
            }
         ]
    },
    totalPrice : {type : Number ,require : true}
});

userSchema.methods.addToCart = function(product){
    const productIndex=this.cart.items.findIndex(p => {
        return p.productId.toString() === product._id.toString();
    });

    let newQuantity=1;
    let totPrice=product.price;

    this.totalPrice = this.totalPrice + totPrice;
    const updateCartItem=[...this.cart.items];

    if(productIndex>=0){
        newQuantity=this.cart.items[productIndex].quantity + 1;
        updateCartItem[productIndex].quantity=newQuantity;
    }
    else{
        updateCartItem.push({
            productId : product._id,
            quantity : newQuantity
        });
    }

    const updateCart = {items : updateCartItem};
    this.cart=updateCart;

    return this.save();

}

userSchema.methods.updateTotalProd=function(product,oldProdValue){
    const productIndex=this.cart.items.findIndex(p => {
        return p.productId.toString() === product._id.toString();
    });

    if(productIndex>=0){
        let qty = this.cart.items[productIndex].quantity;
        let changePrice = this.totalPrice - (qty*oldProdValue);
        changePrice = changePrice+(qty*product.price);

        this.totalPrice=changePrice;
        console.log("totalPrice : ", changePrice);

        return this.save();
    }

    return this;

}

userSchema.methods.removeFromCart=function(productId){
    const cartProductIndex= this.cart.items.findIndex(p => {
        return p.productId.toString() === productId.toString();
    });

    if(cartProductIndex < 0 ){
        return this.save();
    }

    const quantity=this.cart.items[cartProductIndex].quantity;
    let prodPrice=0;
    let newPrice;

    return Product.findById(productId)
        .then(product => {
            // console.log(product);
            prodPrice = product.price;
            // console.log("product price : " , prodPrice);
            newPrice= this.totalPrice-(prodPrice*quantity);
            return;
        })
        .then(() => {
            const updatedCartItem = this.cart.items.filter(p => {
                return p.productId.toString() !== productId.toString();
            })
        
            this.cart.items=updatedCartItem;
            this.totalPrice=newPrice;
            return this.save();
        })
        .catch(err => {
            console.log(err);
        })
    
}

userSchema.methods.clearCart = function(){
    this.cart = {items : []};
    this.totalPrice=0;

    return this.save();
}


module.exports = mongoose.model('User',userSchema);


// modified by mongoose
// userSchema.methods.getCart = function(){
//     const productIds=this.cart.items.map(i=>{
//         return i.productId;
//     });

//     return Product.find({ _id : {$in : productIds}}).cursor().toArray()
//         .then(products => {
//             return products.map(p => {
//                 return {...p, quantity : this.cart.items.find(i => {
//                         return i.productId.toString() === p._id.toString();
//                         }).quantity
//                         };
//             })
//         })
//         .catch(err => console.log(err));

// }



// const mongodb= require('mongodb');
// const { getCart } = require('../controller/shop');
// const getDb = require('../util/database').getDB;

// class User {
//     constructor(username,email,cart,id){
//         this.username=username;
//         this.email=email;
//         this.cart=cart; //{item : []}
//         this._id=id;
//     }

//     save(){
//         const db=getDb();
//         return db.collection('users').insertOne(this)
//             .then(result => {

//                 console.log(result);

//             })
//             .catch(err => console.log(err));
//     }

//     addToCart(product){
//         const cartProductIndex= this.cart.items.findIndex(cp => {
//             return cp.productId.toString() === product._id.toString();
//         });

//         let newQuantity=1;
//         const updatedCartItem = [...this.cart.items];
//         console.log(updatedCartItem);
//         if(cartProductIndex >= 0){
//             newQuantity = this.cart.items[cartProductIndex].quantity +1;
//             updatedCartItem[cartProductIndex].quantity=newQuantity;
//         }
//         else{
//             updatedCartItem.push({ productId : new mongodb.ObjectId(product._id) , quantity : newQuantity});
//         }
//         // proudct.quantity=1; //to declare the field explicityly
//         // dont want to copy the complete data 
//         // const updatedCart={ items : [{...product, quantity: 1}]};

//         const updatedCart = { items : updatedCartItem };
//         const db=getDb();

//         return db.collection('users')
//             .updateOne({ _id : new mongodb.ObjectId(this._id)},
//             { $set : {cart : updatedCart}});

//     }

//     getCart(){
//         // return this.cart;
//         const db=getDb();
//         const productIds=this.cart.items.map(i => {
//             return i.productId;
//         })
//         return db.collection('products').find({ _id : {$in : productIds}}).toArray()
//             .then(products => {
//                 return products.map(p => {
//                     return {...p, quantity : this.cart.items.find(i => {
//                             return i.productId.toString() === p._id.toString();
//                             }).quantity
//                            };
//                 })
//             })
//             .catch(err => console.log(err));
//     }

//     deleteFromCart(prodId){
//         const updatedCartItem= this.cart.items.filter(i => {
//             return i.productId.toString() !== prodId.toString();
//         });

//         const db=getDb();
//         return db.collection('users')
//             .updateOne({ _id : new mongodb.ObjectId(this._id)},
//                         {$set : {cart : {items : updatedCartItem}}});

//     }

//     addToOrder(){
//         const db=getDb();
//         return this.getCart()
//             .then(products => {
//                 const order = {
//                     items: products,
//                     user : {
//                         _id : new mongodb.ObjectId(this._id),
//                         name : this.name
//                     }
//                 }
//                 return db.collection('orders').insertOne(order);
//             })
//             .then(result => {
//                 this.cart= { items : [] };
//                 return db.collection('users')
//                         .updateOne({ _id : new mongodb.ObjectId(this._id)},
//                                     {$set : {cart : {items : []}}});
//             })
//             .catch(err => console.log(err));
//     }

//     getOrders(){
//         const db=getDb();
//         return db.collection('orders').find({'user._id' : new mongodb.ObjectId(this._id)}).toArray();
//     }

//     static findById(userId){
//         const db=getDb();
//         return db.collection('users')
//             .find({ _id : new mongodb.ObjectId(userId)}).next()
//             .then(result => {
//                 console.log(result);
//                 return result;  
//             })
//             .catch(err => console.log(err));
//     }
// };

// module.exports = User;