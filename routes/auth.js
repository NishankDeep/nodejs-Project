const express = require("express");

const User = require('../model/user')

// for validation we imort a validator package
// const expValidator =  require("express-validator")
// now importing the sub package from the express validator 
const { check , body } = require("express-validator/check")

const authControllers=require('../controller/auth');

const router=express.Router();

router.get('/login',authControllers.getLogin);

router.get('/signup',authControllers.getSignup);

router.post('/login',
        [    
            check('email')
            .isEmail()
            .withMessage('Invalid Email')
            .normalizeEmail(),

            body('password','Password must be number,charachter and at least 5 charachter')
            .isLength({min : 5})
            .isAlphanumeric()
            .trim()
        ],    
         authControllers.postLogin
);

router.post('/signup',
    [
         check('email')
         .isEmail()
         .withMessage('Please Enter a valid mail')
         .custom((value, {req})=>{
            // if(value==="test@test.com"){
            //     throw new Error("The email address is forbidden "); 
            // }
            // return true;
            return User.findOne({email : value})
            .then(userDoc => {
                if(userDoc){
                    return Promise.reject('E-mail exist already');
                }

            })
        })
        .normalizeEmail(),
        body('password','Password enter must contain number, charachter and must be at least 5 character')
        .trim()
        .isLength({min : 5})
        .isAlphanumeric(),
        body('confirmPassword')
            .trim()
            .custom((value ,{ req }) => {
                if(value !== req.body.password){
                    throw new Error("Password didnot match");
                }

                return true;
            })

    ],
        authControllers.postSignup
    );

router.post('/logout',authControllers.postLogout);

router.get('/reset',authControllers.getReset);

router.post('/reset',authControllers.postReset);

router.get('/reset/:token',authControllers.getNewPassword);

router.post('/new-password',authControllers.postNewPassword);

module.exports=router;