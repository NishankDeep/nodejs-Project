const crypto = require('crypto');

const User = require('../model/user');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator/check');


// const transporter= nodemailer.createTransport(sendgridTransport({
//     auth: {
//         api_key: //not generated yet 
//     }
// }))

exports.getLogin=(req,res,next) => {
    // const loggedIn = req.get('Cookie').trim().split('=')[1];
    // console.log(req.session.isLoggedIn)
    let message =req.flash('error');
    if(message.length>0){
        message=message[0];
    }
    else{
        message=null;
    }

    // const loggedIn=false;
    console.log(req.session.email);
    res.render('auth/login',{
        path : '/login',
        pageTitle : 'login',
        errorMsg : message,
        isAuthenticated : req.session.isLoggedIn,
        oldInput : {
            email:"",
            password : ""
        },
        validationError : []
    });
};


exports.postLogin=(req,res,next) => {
    // res.setHeader('Set-Cookie','loggedIn=true');
    const email=req.body.email;
    const password=req.body.password;

    const errors=validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).render('auth/login',{
            path : '/login',
            pageTitle : 'login',
            errorMsg : errors.array()[0].msg,
            isAuthenticated : req.session.isLoggedIn,
            oldInput : {
                email:email,
                password : password
            },
            validationError : errors.array()
        });
    }
    
    User.findOne({email : email})
    .then(user => {

            if(!user){
                req.flash('error','invalid email or password');
                // return res.redirect('/login');
                return res.status(422).render('auth/login',{
                    path : '/login',
                    pageTitle : 'login',
                    errorMsg : "Invalid email or password",
                    isAuthenticated : req.session.isLoggedIn,
                    oldInput : {
                        email:email,
                        password : password
                    },
                    validationError : []
                });
            }

            return bcrypt.compare(password,user.password)
                .then(isMatch => {
                    if(isMatch){
                        req.session.isLoggedIn=true;
                        req.session.user=user;
                        return req.session.save((err) => {
                            //when we need to redirect to the page only when our session is defined
                            console.log(err);
            
                            return res.redirect('/');
                        });
                    }

                    return res.status(422).render('auth/login',{
                        path : '/login',
                        pageTitle : 'login',
                        errorMsg : "Invalid email or password",
                        isAuthenticated : req.session.isLoggedIn,
                        oldInput : {
                            email:email,
                            password : password
                        },
                        validationError : []
                    });
                    // req.flash('error','invalid email or password');
                    // res.redirect('/login');
                })
                .catch(err => {
                    console.log(err);

                    return res.redirect('/login');
                })
            // req.session.isLoggedIn=true;
            // req.session.user=user;
            // req.session.save((err) => {
            //     //when we need to redirect to the page only when our session is defined
            //     console.log(err);

            //     res.redirect('/');
            // })
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });
        // .then(()=>{
        //     res.redirect('/');
        // })
}

exports.getSignup=(req,res,next) => {
    let message=req.flash('error');
    if(message.length>0){
        message = message[0];
    }
    else{
        message=null;
    }
    res.render('auth/signup',{
        path : '/signup',
        pageTitle : 'signup',
        errorMsg : message,
        isAuthenticated : req.session.isLoggedIn,
        oldInput: {
            email:"",
            password:"",
            confirmPassword : ""
        },
        validationError : []
    });
}

exports.postSignup=(req,res,next) => {
    const email=req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).render('auth/signup',{
            path : '/signup',
            pageTitle : 'signup',
            errorMsg : errors.array()[0].msg,
            isAuthenticated : req.session.isLoggedIn,
            oldInput: {
                email:email,
                password:password,
                confirmPassword : req.body.confirmPassword
            },
            validationError : errors.array()
        })
    }

    User.findOne({email : email})
        .then(userDoc => {
            // if(userDoc){
                
            //     req.flash('error',' E-mail already present ');
            //     return res.redirect('/signup');
            // }

            return bcrypt.hash(password,12)
                .then(hashPassword => {
                    const user = new User({
                        email : email,
                        password : hashPassword,
                        cart : {items : []},
                        totalPrice : 0
                    });
        
                    return user.save();
                })
                .then( result => {
                    // sendgrid api is not generated but the apprach is this only
                    // return transporter.sendMail({
                    //     to : email,
                    //     from : 'shop@gamil.com',
                    //     subject : 'Signup succeeded',
                    //     html : '<h1>Successfully signed up!! </h1>'
                    // })
                    return res.redirect('/login');
                });
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postLogout=(req,res,next) =>{
    req.session.destroy((err) =>{
        console.log(err);

        res.redirect('/');
    })
}

exports.getReset = (req,res,next) => {
    let message = req.flash('error');
    if(message.length > 0){
        message=message[0];
    }
    else{
        message=null;
    }

    res.render('auth/reset.ejs',{
        pageTitle : 'Reset Password',
        path : '/reset',
        errorMsg: message
    })
}

exports.postReset = (req,res,next) => {
    crypto.randomBytes(32 , (err,buffer) => {
        if(err){
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email : req.body.email})
            .then(user => {
                if(!user){
                    req.flash('err','Email do not exist');
                    return res.redirect('/reset');
                }
    
                user.resetToken=token;
                user.resetTokenExpiration= Date.now() + 3600000;
                // const store = Date.now();
                // console.log(Date.now())
                console.log(user.resetTokenExpiration);
                return user.save();
            })
            .then(result => {
                res.redirect(`/reset/${token}`);
                // transporter.sendMail({
                //     to:req.body.email,
                //     from : 'shop@gmail.com',
                //     subject : 'Password Reset Link',
                //     html : `
                //         <p> Your requested a password reset </p>
                //         <p>Click this <a href="http://localhost:3000/reset/${token}" > link </a> to reset the password </p>
                //     `
                // })
            })
            .catch(err =>{
                // console.log(err)
                const error=new Error('error occured');
                error.httpStatusCode = 500;
                return next(error);
            });


    })
}

exports.getNewPassword=(req,res,next) => {
    const token = req.params.token;
    // console.log(Date.now());
    User.findOne({resetToken : token , resetTokenExpiration : { $gt : Date.now() } })
        .then(user => {
            // console.log(user);
            let message= req.flash('error');
            if(message.length>0){
                message=message[0];
            }
            else{
                message=null;
            }

            res.render('auth/new-password',{
                pageTitle:"New Password",
                path:"/new-password",
                errorMsg : message,
                userId: user._id.toString(),
                passwordToken : token
            })
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postNewPassword = (req,res,next) => {
    const password= req.body.password;
    const userId= req.body.userId;
    const token = req.body.passwordToken;
    let resetUser;

    User.findOne({resetToken : token , resetTokenExpiration : {$gt : Date.now()} , _id : userId})
        .then(user => {
            resetUser=user;
            return bcrypt.hash(password,12);
        })
        .then(hashPassword => {
            resetUser.password = hashPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration=undefined;

            return resetUser.save();
        })
        .then(result => {
            return res.redirect('/login');
        })
        .catch(err =>{
            // console.log(err)
            const error=new Error('error occured');
            error.httpStatusCode = 500;
            return next(error);
        });


};


