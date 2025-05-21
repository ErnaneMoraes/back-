/* Tela de clientes */
/* =========================================== */

function abrirPopUpClientes() {
    document.getElementById("popUpClientes").style.display = "block";
}

function fecharPopUpClientes() {
    document.getElementById("popUpClientes").style.display = "none"
}

// Fechar ao clicar fora do popUp
window.onclick = function(event) {
    let modal = document.getElementById("popUpClientes");

    if(event.target === modal) {
        modal.style.display = "none"
    }
}

/* Tela de produtos */
/* =========================================== */
/* PopUp de confirmações */

document.addEventListener("DOMContentLoaded", function () {
    const popUp = document.getElementById("popUpProduto");
    const btnSalvar = document.getElementById("abrirPopUp"); // Botão principal
    const btnFechar = document.getElementById("close_popUp");
    const btnConfirmar = document.getElementById("cad_produtos"); // Botão de confirmação no pop-up

    // Função para abrir o pop-up
    function abrirPopUp(event) {
        event.preventDefault(); // Evita o envio do formulário antes da confirmação
        popUp.style.display = "flex";
    }

    // Função para fechar o pop-up
    function fecharPopUp() {
        popUp.style.display = "none";
    }

    // Evento para abrir o pop-up ao clicar no botão "Salvar"
    btnSalvar.addEventListener("click", abrirPopUp);

    // Evento para fechar o pop-up ao clicar no botão "Cancelar"
    btnFechar.addEventListener("click", fecharPopUp);

    // Evento para confirmar o cadastro e enviar o formulário
    btnConfirmar.addEventListener("click", function () {
        document.querySelector("form").submit();
    });
});
