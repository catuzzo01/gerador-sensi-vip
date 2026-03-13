function gerar(){

let modelo = document.getElementById("model").value

if(modelo === ""){
alert("Digite o modelo do celular")
return
}

localStorage.setItem("modelo",modelo)

window.location="loading.html"

}