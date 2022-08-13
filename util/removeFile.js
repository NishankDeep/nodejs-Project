const fs= require('fs');

const deleteFromFile = (filePath) =>{
    fs.unlink(filePath , (err)=>{
        if(err){
            //  throw (err);
            console.log(err);
            return ;   
        }
    })
};

exports.deleteFromFile = deleteFromFile;