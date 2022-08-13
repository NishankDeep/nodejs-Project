const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema ({
    products : [
        {
            product : {type : Object , require : true},
            quantity : {type : Number , require : true}
        }
    ],
    user : {
        userId: {type : Schema.Types.ObjectId , ref : 'User' ,require : true},
        email: {type : String , ref: 'User' , require : true}
    },
    totalPrice : {type : Number , require : true}
})


module.exports=mongoose.model('Order',orderSchema);