const sum = (a,b) =>{
    if(a && b){
        return a+b;
    }

    throw new Error("Invalid arguments");
}

// sum(1);

try{
    sum(1);
}
catch(error){
    console.log('Error Occured');
    // console.log(error);
}

console.log('ye bhi chala is baar');