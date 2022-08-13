const express = require("express");
const path = require("path");
const fs = require ('fs');
const bodyParser = require("body-parser");
// const { notStrictEqual } = require("assert");

const multer=require('multer')
const app = express();


const adminRoute=require('./routes/admin');
const shopRoute=require('./routes/shop');
const authRoute=require('./routes/auth');

const product=require('./controller/error');

const mongoose = require('mongoose');
const User = require('./model/user');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf =  require('csurf');
const flash= require('connect-flash');
const helmet = require('helmet');
const morgan = require('morgan');

const dotenv = require('dotenv');
dotenv.config()


console.log(process.env.MONGODB_DATABASE);
// const MONGODB_URI ='mongodb+srv://Nishank:2e6qinegEshobrmn@cluster0.sio3l.mongodb.net/shop?retryWrites=true&w=majority';
const MONGODB_URI =`mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.sio3l.mongodb.net/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

//const MONGODB_URI =`mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0-shard-00-00.sio3l.mongodb.net:27017,cluster0-shard-00-01.sio3l.mongodb.net:27017,cluster0-shard-00-02.sio3l.mongodb.net:27017/${process.env.MONGODB_DATABASE}?ssl=true&replicaSet=atlas-c46uqu-shard-0&authSource=admin&retryWrites=true&w=majority`;

const store = new MongoDBStore({
    uri : MONGODB_URI,
    collection: 'session'
});

const csrfProtection=csrf();

const fileStorage = multer.diskStorage({
    destination :(req,file,cb) => {
        cb(null,'images');
    } ,
    filename : (req,file,cb) => {
        // console.log("original : ",file.originalname);
        cb(null, file.fieldname + '-'  +Date.now() + '-' + file.originalname);
        // cb(null, new Date().toISOString + '-' + file.originalname);
        // new Date().toISOString()
    }
});
console.log("hogaya kya$$");
// console.log(process.env.NODE_ENV);

const filefilter = (req,file,cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image.jpg' || file.mimetype==='image/jpeg'){
        cb(null,true);
    }
    else{
        cb(null,false);
    }
}
const accessLogStream = fs.createWriteStream(path.join(__dirname,'access.log'),{flag : 'a'});

app.use(helmet());
app.use(morgan('combined', {stream : accessLogStream}));
app.use(bodyParser.urlencoded({extended :false}));

app.use(multer({storage : fileStorage, fileFilter : filefilter}).single('image'));
// app.use(multer({dest : 'images'}).single('image'))

app.use(express.static(path.join(__dirname,"public")));
app.use('/images', express.static(path.join(__dirname,"images")));

app.use(session({secret : 'my secret', resave: false , saveUninitialized:false, store : store }));
app.use(csrfProtection);
app.use(flash());

app.set('view engine','ejs');
app.set('views','views');

// generating the csrf token before the user initializatino
app.use((req,res,next) => {
    res.locals.isAuthenticated=req.session.isLoggedIn;
    res.locals.csrfToken=req.csrfToken();

    next();
})

app.use((req,res,next) =>{
    // throw new Error("Dummy Sync");

    if(!req.session.user){
        return next();
    }

    User.findById(req.session.user._id)
        .then(user => {
            if(!user){
                next();
            }
            // req.user=user; //we can explicitly define the properties and assign them if they do not store any value
            // console.log(user);
            req.user = user;
            next();
        })
        .catch(err => { 
            // console.log(err)
            // throw new Error(err);
            next(new Error(err));
        });
})



// dp.execute('SELECT * FROM products')
//     .then(result => {
//         console.log(result[0]);
//     })
//     .catch(err => {
//         console.log(err);
//     });

app.use(adminRoute);
app.use(shopRoute);
app.use(authRoute);


app.get('/500',product.get500);

app.use('/',product.get404);

// a special type of middleware that execute only when the error occured
app.use((error,req,res,next) => {
    // res.statusCode(error.httpStatusCode).render(......)
    // res.redirect('/500');
    console.log(error);
    res.status(500).render('500.ejs',{
        pageTitle : 'Error Occured',
        path : '/500',
        isAuthenticated : req.session.isLoggedIn
    })
    
})

mongoose.connect(MONGODB_URI)
    .then(result => {
        app.listen(process.env.PORT || 3000);
    })
    .catch(err => {
        console.log(err)
    });

// app.listen(3000);