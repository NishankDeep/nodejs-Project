const deleteProduct = (btn) =>{
    // console.log("deleted");
    const productId=btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    const productElement = btn.closest('article');

    fetch(`/product/${productId}`,{
        method : "DELETE",
        headers : {
            'csrf-token' : csrf
        }
    })
    .then(result => {
        // console.log(result);
        return result.json();

    })
    .then(data => {
        console.log(data);
        productElement.remove();
        // productElement.parentNode.removeChild(productElement);
    })
    .catch(err => {
        // alert("hua");
        console.log(err);
    })
}